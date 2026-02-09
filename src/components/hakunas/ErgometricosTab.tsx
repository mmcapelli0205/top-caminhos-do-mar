import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Search as SearchIcon, Info } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Participante = Tables<"participantes">;
type Ergometrico = Tables<"ergometricos">;

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

const STATUS_COLORS: Record<string, string> = {
  pendente: "secondary", enviado: "default", aprovado: "default", reprovado: "destructive", dispensado: "outline",
};

export default function ErgometricosTab() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("todos");
  const [analyzeId, setAnalyzeId] = useState<string | null>(null);
  const [analyzeStatus, setAnalyzeStatus] = useState("aprovado");
  const [analyzeObs, setAnalyzeObs] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const { data: participantes = [], isLoading: loadP } = useQuery({
    queryKey: ["erg-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("*").order("nome");
      return (data ?? []) as Participante[];
    },
  });

  const { data: ergometricos = [] } = useQuery({
    queryKey: ["erg-registros"],
    queryFn: async () => {
      const { data } = await supabase.from("ergometricos").select("*");
      return (data ?? []) as Ergometrico[];
    },
  });

  const ergMap = useMemo(() => {
    const m = new Map<string, Ergometrico>();
    ergometricos.forEach((e) => { if (e.participante_id) m.set(e.participante_id, e); });
    return m;
  }, [ergometricos]);

  const parts40 = useMemo(() => participantes.filter((p) => {
    const age = calcAge(p.data_nascimento);
    return age !== null && age >= 40;
  }), [participantes]);

  const filtered = useMemo(() => {
    if (filter === "todos") return parts40;
    return parts40.filter((p) => {
      const erg = ergMap.get(p.id);
      const status = erg?.status ?? p.ergometrico_status ?? "pendente";
      return status === filter;
    });
  }, [parts40, filter, ergMap]);

  const counts = useMemo(() => {
    const c = { total: parts40.length, pendente: 0, enviado: 0, aprovado: 0, reprovado: 0, dispensado: 0 };
    parts40.forEach((p) => {
      const erg = ergMap.get(p.id);
      const s = erg?.status ?? p.ergometrico_status ?? "pendente";
      if (s in c) (c as any)[s]++;
    });
    return c;
  }, [parts40, ergMap]);

  const handleUpload = async (partId: string, file: File) => {
    setUploadingFor(partId);
    try {
      const path = `ergometricos/${partId}/${file.name}`;
      const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
      const existing = ergMap.get(partId);
      if (existing) {
        await supabase.from("ergometricos").update({ arquivo_url: urlData.publicUrl, status: "enviado", data_envio: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("ergometricos").insert({ participante_id: partId, arquivo_url: urlData.publicUrl, status: "enviado" });
      }
      await supabase.from("participantes").update({ ergometrico_status: "enviado" }).eq("id", partId);
      qc.invalidateQueries({ queryKey: ["erg-registros"] });
      qc.invalidateQueries({ queryKey: ["erg-participantes"] });
      toast({ title: "Arquivo enviado" });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploadingFor(null);
    }
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!analyzeId) return;
      const erg = ergMap.get(analyzeId);
      if (erg) {
        await supabase.from("ergometricos").update({ status: analyzeStatus, observacoes_medicas: analyzeObs, data_analise: new Date().toISOString() }).eq("id", erg.id);
      } else {
        await supabase.from("ergometricos").insert({ participante_id: analyzeId, status: analyzeStatus, observacoes_medicas: analyzeObs, data_analise: new Date().toISOString() });
      }
      await supabase.from("participantes").update({ ergometrico_status: analyzeStatus }).eq("id", analyzeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["erg-registros"] });
      qc.invalidateQueries({ queryKey: ["erg-participantes"] });
      setAnalyzeId(null); setAnalyzeObs("");
      toast({ title: "Análise salva" });
    },
  });

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Participantes com 40+ anos precisam de teste ergométrico aprovado</AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {([["Total 40+", counts.total], ["Pendentes", counts.pendente], ["Enviados", counts.enviado], ["Aprovados", counts.aprovado], ["Reprovados", counts.reprovado], ["Dispensados", counts.dispensado]] as [string, number][]).map(([label, val]) => (
          <Card key={label}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{label}</p><span className="text-lg font-bold text-foreground">{val}</span></CardContent></Card>
        ))}
      </div>

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className={isMobile ? "w-full" : "w-48"}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="enviado">Enviado</SelectItem>
          <SelectItem value="aprovado">Aprovado</SelectItem>
          <SelectItem value="reprovado">Reprovado</SelectItem>
          <SelectItem value="dispensado">Dispensado</SelectItem>
        </SelectContent>
      </Select>

      {isMobile ? (
        <div className="space-y-3">
          {loadP ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum participante encontrado</p>
          ) : filtered.map((p) => {
            const erg = ergMap.get(p.id);
            const status = erg?.status ?? p.ergometrico_status ?? "pendente";
            return (
              <Card key={p.id}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.nome}</p>
                      <p className="text-sm text-muted-foreground">Idade: {calcAge(p.data_nascimento)}</p>
                    </div>
                    <Badge variant={STATUS_COLORS[status] as any ?? "secondary"}>{status}</Badge>
                  </div>
                  {erg?.arquivo_url && (
                    <a href={erg.arquivo_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Ver PDF
                    </a>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 relative" disabled={uploadingFor === p.id}>
                      <Upload className="h-4 w-4 mr-1" /> Upload
                      <input type="file" accept=".pdf,.jpg,.png,.jpeg" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(p.id, f); }} />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAnalyzeId(p.id); setAnalyzeStatus("aprovado"); setAnalyzeObs(erg?.observacoes_medicas ?? ""); }}>
                      <SearchIcon className="h-4 w-4 mr-1" /> Analisar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card z-10">Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Arquivo</TableHead>
                <TableHead className="hidden lg:table-cell">Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadP ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum participante encontrado</TableCell></TableRow>
              ) : filtered.map((p) => {
                const erg = ergMap.get(p.id);
                const status = erg?.status ?? p.ergometrico_status ?? "pendente";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium">{p.nome}</TableCell>
                    <TableCell>{calcAge(p.data_nascimento)}</TableCell>
                    <TableCell><Badge variant={STATUS_COLORS[status] as any ?? "secondary"}>{status}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">
                      {erg?.arquivo_url ? (<a href={erg.arquivo_url} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1"><FileText className="h-3 w-3" /> Ver PDF</a>) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{erg?.observacoes_medicas ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" className="relative" disabled={uploadingFor === p.id}>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                          <input type="file" accept=".pdf,.jpg,.png,.jpeg" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(p.id, f); }} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setAnalyzeId(p.id); setAnalyzeStatus("aprovado"); setAnalyzeObs(erg?.observacoes_medicas ?? ""); }}>
                          <SearchIcon className="h-4 w-4 mr-1" /> Analisar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!analyzeId} onOpenChange={(o) => { if (!o) setAnalyzeId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Analisar Ergométrico</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={analyzeStatus} onValueChange={setAnalyzeStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="dispensado">Dispensado</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Observações médicas..." value={analyzeObs} onChange={(e) => setAnalyzeObs(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyzeId(null)}>Cancelar</Button>
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
