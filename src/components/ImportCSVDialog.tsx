import { useState, useCallback, useMemo, useRef } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { validateCPF } from "@/lib/cpf";

/* ── Types ── */

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCpfs: string[];
  topId?: string | null;
}

interface ColumnMapping {
  dbColumn: string;
  label: string;
  required: boolean;
  csvColumn: string | null;
}

interface ValidationRow {
  index: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
  status: "new" | "duplicate" | "error";
  errors: string[];
  included: boolean;
}

/* ── Constants ── */

const DB_COLUMNS: { key: string; label: string; required: boolean; fuzzy: string[] }[] = [
  { key: "nome", label: "Nome", required: true, fuzzy: ["nome", "name", "nome completo", "participante"] },
  { key: "cpf", label: "CPF", required: true, fuzzy: ["cpf", "documento", "doc"] },
  { key: "telefone", label: "Telefone", required: true, fuzzy: ["telefone", "celular", "whatsapp", "fone", "phone", "tel"] },
  { key: "data_nascimento", label: "Data Nascimento", required: true, fuzzy: ["nascimento", "data nasc", "data_nascimento", "dt nasc", "birthday", "birth"] },
  { key: "email", label: "Email", required: false, fuzzy: ["email", "e-mail", "mail"] },
  { key: "igreja", label: "Igreja", required: false, fuzzy: ["igreja", "comunidade", "paroquia"] },
  { key: "peso", label: "Peso (kg)", required: false, fuzzy: ["peso", "weight"] },
  { key: "altura", label: "Altura (m)", required: false, fuzzy: ["altura", "height"] },
  { key: "tamanho_farda", label: "Tamanho Farda", required: false, fuzzy: ["farda", "camisa", "camiseta", "tamanho"] },
  { key: "profissao", label: "Profissão", required: false, fuzzy: ["profissao", "profissão", "ocupacao"] },
  { key: "instagram", label: "Instagram", required: false, fuzzy: ["instagram", "insta"] },
  { key: "amigo_parente", label: "Amigo/Parente", required: false, fuzzy: ["amigo", "parente", "indicacao", "indicação"] },
  { key: "motivo_inscricao", label: "Motivo Inscrição", required: false, fuzzy: ["motivo", "motivacao"] },
  { key: "doenca", label: "Doença", required: false, fuzzy: ["doenca", "doença", "comorbidade", "saude", "saúde"] },
  { key: "medicamentos", label: "Medicamentos", required: false, fuzzy: ["medicamentos", "medicamento", "remedio", "remédio"] },
  { key: "alergia_alimentar", label: "Alergia Alimentar", required: false, fuzzy: ["alergia", "alergia alimentar"] },
  { key: "condicionamento", label: "Condicionamento", required: false, fuzzy: ["condicionamento", "fitness", "condição física"] },
  { key: "contato_nome", label: "Contato Nome", required: false, fuzzy: ["contato nome", "contato_nome", "emergencia", "emergência"] },
  { key: "contato_telefone", label: "Contato Telefone", required: false, fuzzy: ["contato telefone", "contato_telefone", "tel emergencia"] },
  { key: "contato_email", label: "Contato Email", required: false, fuzzy: ["contato email", "contato_email", "email emergencia"] },
  { key: "inscrito_por", label: "Inscrito Por", required: false, fuzzy: ["inscrito por", "inscrito_por", "responsavel inscricao"] },
];

const STEPS = ["Upload", "Mapeamento", "Validação", "Importação"];
const BATCH_SIZE = 50;

/* ── Helpers ── */

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function fuzzyMatch(csvHeader: string, patterns: string[]): boolean {
  const n = normalize(csvHeader);
  return patterns.some((p) => n.includes(p) || p.includes(n));
}

function parseDate(value: string): string | null {
  if (!value || !value.trim()) return null;
  const v = value.trim();

  // yyyy-mm-dd
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // dd/mm/yyyy or dd-mm-yyyy
  const br = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

function cleanCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function calcAge(dob: string): number {
  const d = new Date(dob + "T12:00:00");
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
}

function decodeBuffer(buffer: ArrayBuffer): string {
  // Try UTF-8 first
  const utf8 = new TextDecoder("utf-8", { fatal: true });
  try {
    const text = utf8.decode(buffer);
    // Check for replacement characters that indicate bad decode
    if (!text.includes("\uFFFD")) return text;
  } catch { /* fall through */ }

  // Fallback to Latin1
  const latin1 = new TextDecoder("iso-8859-1");
  return latin1.decode(buffer);
}

/* ── Component ── */

export default function ImportCSVDialog({ open, onOpenChange, existingCpfs, topId }: ImportCSVDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importDone, setImportDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  /* ── Reset ── */
  const reset = useCallback(() => {
    setStep(1);
    setFileName("");
    setCsvHeaders([]);
    setCsvData([]);
    setMapping([]);
    setValidationRows([]);
    setImporting(false);
    setImportProgress(0);
    setImportTotal(0);
    setImportDone(false);
    setImportedCount(0);
    setErrorMsg("");
    setExpandedSection(null);
  }, []);

  const handleOpenChange = useCallback((o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  }, [onOpenChange, reset]);

  /* ── Step 1: File handling ── */
  const processFile = useCallback((file: File) => {
    setErrorMsg("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const text = decodeBuffer(buffer);

      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        setErrorMsg("Erro ao ler o arquivo CSV. Verifique o formato.");
        return;
      }

      if (result.data.length === 0) {
        setErrorMsg("Arquivo vazio ou sem linhas válidas.");
        return;
      }

      const headers = result.meta.fields ?? [];
      setCsvHeaders(headers);
      setCsvData(result.data);

      // Auto-map
      const autoMapping: ColumnMapping[] = DB_COLUMNS.map((col) => {
        const matched = headers.find((h) => fuzzyMatch(h, col.fuzzy));
        return { dbColumn: col.key, label: col.label, required: col.required, csvColumn: matched ?? null };
      });
      setMapping(autoMapping);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  /* ── Step 2: Mapping ── */
  const updateMapping = useCallback((dbColumn: string, csvColumn: string | null) => {
    setMapping((prev) =>
      prev.map((m) => (m.dbColumn === dbColumn ? { ...m, csvColumn: csvColumn === "__none__" ? null : csvColumn } : m))
    );
  }, []);

  const requiredMapped = useMemo(() => {
    return mapping.filter((m) => m.required).every((m) => m.csvColumn !== null);
  }, [mapping]);

  const previewRows = useMemo(() => csvData.slice(0, 5), [csvData]);

  /* ── Step 3: Validation ── */
  const runValidation = useCallback(() => {
    const existingSet = new Set(existingCpfs.map(cleanCpf));
    const seenCpfs = new Set<string>();

    const rows: ValidationRow[] = csvData.map((raw, index) => {
      const mapped: Record<string, string> = {};
      for (const m of mapping) {
        if (m.csvColumn && raw[m.csvColumn] !== undefined) {
          mapped[m.dbColumn] = String(raw[m.csvColumn]).trim();
        }
      }

      const errors: string[] = [];

      // Required fields
      for (const m of mapping) {
        if (m.required && !mapped[m.dbColumn]) {
          errors.push(`${m.label} vazio`);
        }
      }

      // CPF validation
      const cpfRaw = mapped.cpf ?? "";
      const cpfClean = cleanCpf(cpfRaw);
      if (cpfClean && !validateCPF(cpfClean)) {
        errors.push("CPF inválido");
      }

      // Date validation
      if (mapped.data_nascimento) {
        const parsed = parseDate(mapped.data_nascimento);
        if (!parsed) errors.push("Data de nascimento inválida");
        else mapped.data_nascimento = parsed;
      }

      // Duplicate check
      let status: "new" | "duplicate" | "error" = "new";
      if (errors.length > 0) {
        status = "error";
      } else if (cpfClean && (existingSet.has(cpfClean) || seenCpfs.has(cpfClean))) {
        status = "duplicate";
      }

      if (cpfClean) seenCpfs.add(cpfClean);

      return { index, raw, mapped, status, errors, included: status === "new" };
    });

    setValidationRows(rows);
  }, [csvData, mapping, existingCpfs]);

  const validationSummary = useMemo(() => {
    const newRows = validationRows.filter((r) => r.status === "new");
    const dupes = validationRows.filter((r) => r.status === "duplicate");
    const errs = validationRows.filter((r) => r.status === "error");
    return { newRows, dupes, errs };
  }, [validationRows]);

  const includedCount = useMemo(() => validationRows.filter((r) => r.included).length, [validationRows]);

  const toggleIncluded = useCallback((index: number) => {
    setValidationRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, included: !r.included } : r))
    );
  }, []);

  /* ── Step 4: Import ── */
  const runImport = useCallback(async () => {
    const toImport = validationRows.filter((r) => r.included);
    if (toImport.length === 0) return;

    setImporting(true);
    setImportTotal(toImport.length);
    setImportProgress(0);

    let imported = 0;

    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE).map((r) => {
        const cpfClean = cleanCpf(r.mapped.cpf ?? "");
        const age = r.mapped.data_nascimento ? calcAge(r.mapped.data_nascimento) : null;

        return {
          nome: r.mapped.nome ?? "",
          cpf: cpfClean,
          telefone: r.mapped.telefone ?? null,
          data_nascimento: r.mapped.data_nascimento ?? null,
          email: r.mapped.email ?? null,
          igreja: r.mapped.igreja ?? null,
          peso: r.mapped.peso ? parseFloat(r.mapped.peso) || null : null,
          altura: r.mapped.altura ? parseFloat(r.mapped.altura.replace(",", ".")) || null : null,
          tamanho_farda: r.mapped.tamanho_farda ?? null,
          profissao: r.mapped.profissao ?? null,
          instagram: r.mapped.instagram ?? null,
          amigo_parente: r.mapped.amigo_parente ?? null,
          motivo_inscricao: r.mapped.motivo_inscricao ?? null,
          doenca: r.mapped.doenca ?? null,
          medicamentos: r.mapped.medicamentos ?? null,
          alergia_alimentar: r.mapped.alergia_alimentar ?? null,
          condicionamento: r.mapped.condicionamento ? parseInt(r.mapped.condicionamento) || null : null,
          contato_nome: r.mapped.contato_nome ?? null,
          contato_telefone: r.mapped.contato_telefone ?? null,
          contato_email: r.mapped.contato_email ?? null,
          inscrito_por: r.mapped.inscrito_por ?? null,
          qr_code: crypto.randomUUID(),
          status: "inscrito",
          contrato_assinado: false,
          checkin_realizado: false,
          ergometrico_status: age !== null && age >= 40 ? "pendente" : "dispensado",
          ...(topId ? { top_id: topId } : {}),
        };
      });

      const { error } = await supabase.from("participantes").insert(batch);
      if (error) {
        setErrorMsg(`Erro ao importar lote: ${error.message}`);
        break;
      }

      imported += batch.length;
      setImportProgress(imported);
    }

    setImportedCount(imported);
    setImportDone(true);
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["participantes"] });
  }, [validationRows, topId, queryClient]);

  /* ── Render helpers ── */

  const renderStepper = () => (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
              step > i + 1
                ? "bg-green-600 text-white"
                : step === i + 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline ${step === i + 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s}</span>
          {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">Arraste um arquivo CSV ou clique para selecionar</p>
        <p className="text-xs text-muted-foreground">Formatos aceitos: .csv</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">{csvData.length} linhas encontradas</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Mapeie as colunas do CSV para os campos do sistema:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mapping.map((m) => (
          <div key={m.dbColumn} className="flex items-center gap-2">
            <span className={`text-sm min-w-[130px] ${m.required && !m.csvColumn ? "text-red-400 font-semibold" : "text-foreground"}`}>
              {m.label}{m.required && " *"}
            </span>
            <Select value={m.csvColumn ?? "__none__"} onValueChange={(v) => updateMapping(m.dbColumn, v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecionar coluna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Não mapear —</SelectItem>
                {csvHeaders.map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {previewRows.length > 0 && (
        <>
          <p className="text-sm font-medium mt-4">Preview (primeiras 5 linhas):</p>
          <ScrollArea className="max-h-48">
            <Table>
              <TableHeader>
                <TableRow>
                  {csvHeaders.slice(0, 8).map((h) => (
                    <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {csvHeaders.slice(0, 8).map((h) => (
                      <TableCell key={h} className="text-xs py-1 whitespace-nowrap max-w-[150px] truncate">{row[h] ?? ""}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </>
      )}
    </div>
  );

  const renderValidationSection = (title: string, rows: ValidationRow[], color: string, icon: React.ReactNode, sectionKey: string) => {
    const isOpen = expandedSection === sectionKey;
    return (
      <div className="border border-border rounded-md">
        <button
          className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
          onClick={() => setExpandedSection(isOpen ? null : sectionKey)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            <Badge className={color}>{rows.length}</Badge>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {isOpen && rows.length > 0 && (
          <ScrollArea className="max-h-48 border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">CPF</TableHead>
                  <TableHead className="text-xs">Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.index}>
                    <TableCell className="py-1">
                      <Checkbox checked={r.included} onCheckedChange={() => toggleIncluded(r.index)} />
                    </TableCell>
                    <TableCell className="text-xs py-1">{r.mapped.nome ?? "—"}</TableCell>
                    <TableCell className="text-xs py-1">{r.mapped.cpf ?? "—"}</TableCell>
                    <TableCell className="text-xs py-1 text-red-400">{r.errors.join(", ") || (r.status === "duplicate" ? "CPF duplicado" : "—")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-3">
      {renderValidationSection(
        "Novos participantes",
        validationSummary.newRows,
        "bg-green-600/20 text-green-400 border-green-600/30",
        <CheckCircle2 className="h-4 w-4 text-green-400" />,
        "new"
      )}
      {renderValidationSection(
        "Duplicatas (CPF já cadastrado)",
        validationSummary.dupes,
        "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
        <AlertTriangle className="h-4 w-4 text-yellow-400" />,
        "dupes"
      )}
      {renderValidationSection(
        "Erros",
        validationSummary.errs,
        "bg-red-600/20 text-red-400 border-red-600/30",
        <XCircle className="h-4 w-4 text-red-400" />,
        "errors"
      )}
      <p className="text-sm text-muted-foreground">
        {includedCount} participante(s) selecionado(s) para importação.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      {!importDone && !importing && (
        <div className="text-center space-y-3">
          <p className="text-sm">
            Pronto para importar <span className="font-bold text-primary">{includedCount}</span> participante(s).
          </p>
          <Button onClick={runImport} disabled={includedCount === 0} className="bg-orange-600 hover:bg-orange-700 text-white">
            Importar {includedCount} participantes
          </Button>
        </div>
      )}

      {(importing || importDone) && (
        <div className="space-y-3">
          <Progress value={importTotal > 0 ? (importProgress / importTotal) * 100 : 0} />
          <p className="text-sm text-center text-muted-foreground">
            {importing ? `Importando... ${importProgress}/${importTotal}` : `${importedCount} importado(s) com sucesso!`}
          </p>
        </div>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  /* ── Navigation ── */
  const canNext = () => {
    if (step === 1) return csvData.length > 0;
    if (step === 2) return requiredMapped;
    if (step === 3) return includedCount > 0;
    return false;
  };

  const goNext = () => {
    if (step === 2) {
      runValidation();
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar da TicketAndGo</DialogTitle>
          <DialogDescription>Importe participantes a partir de um arquivo CSV.</DialogDescription>
        </DialogHeader>

        {renderStepper()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => step === 1 ? handleOpenChange(false) : setStep((s) => s - 1)} disabled={importing}>
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>
          {step < 4 ? (
            <Button onClick={goNext} disabled={!canNext()}>
              Próximo
            </Button>
          ) : importDone ? (
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
