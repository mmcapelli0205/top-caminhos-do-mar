import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, Download, Plus, Eye, Pencil, Upload,
  CheckCircle, XCircle, Circle, ArrowUp, ArrowDown, Trash2, Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import ParticipanteSheet from "@/components/ParticipanteSheet";
import ImportCSVDialog from "@/components/ImportCSVDialog";
import BatchEditDialog from "@/components/BatchEditDialog";
import { useParticipantes, type Participante } from "@/hooks/useParticipantes";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAreaServico } from "@/hooks/useAreaServico";
import { useAuth } from "@/hooks/useAuth";
import { getPermissoesMenu } from "@/lib/permissoes";

const PAGE_SIZE = 20;

type SortKey = "nome" | "idade" | "telefone" | "igreja" | "familia" | "status";
type SortDir = "asc" | "desc";

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

const statusColors: Record<string, string> = {
  inscrito: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  confirmado: "bg-green-600/20 text-green-400 border-green-600/30",
  cancelado: "bg-red-600/20 text-red-400 border-red-600/30",
};

const ergoColors: Record<string, string> = {
  pendente: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  enviado: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  aprovado: "bg-green-600/20 text-green-400 border-green-600/30",
  dispensado: "bg-muted text-muted-foreground border-border",
};

export default function Participantes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { role } = useAuth();
  const { areaServico } = useAreaServico();
  const { participantes, familiaMap, familias, isLoading } = useParticipantes();

  const effectiveArea = role === "diretoria" ? "Diretoria" : areaServico;
  const perms = getPermissoesMenu(effectiveArea);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterFamilia, setFilterFamilia] = useState("todos");
  const [filterContrato, setFilterContrato] = useState("todos");
  const [filterErgo, setFilterErgo] = useState("todos");
  const [filterCidade, setFilterCidade] = useState("todos");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Participante | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const existingCpfs = useMemo(() => participantes.map((p) => p.cpf), [participantes]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterStatus, filterFamilia, filterContrato, filterErgo, filterCidade]);

  useEffect(() => { setSelectedIds(new Set()); }, [debouncedSearch, filterStatus, filterFamilia, filterContrato, filterErgo, filterCidade, currentPage]);

  const cidadesUnicas = useMemo(() => {
    return [...new Set(participantes.map((p) => p.cidade).filter(Boolean))].sort() as string[];
  }, [participantes]);

  const getFamiliaNumero = useCallback((fid: number | null) => {
    if (fid == null) return null;
    return familiaMap.get(fid) ?? null;
  }, [familiaMap]);

  const filtered = useMemo(() => {
    let list = participantes;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.cpf.toLowerCase().includes(q) ||
          (p.telefone?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filterStatus !== "todos") list = list.filter((p) => p.status === filterStatus);
    if (filterFamilia !== "todos") list = list.filter((p) => String(p.familia_id) === filterFamilia);
    if (filterContrato === "sim") list = list.filter((p) => p.contrato_assinado);
    if (filterContrato === "nao") list = list.filter((p) => !p.contrato_assinado);
    if (filterErgo !== "todos") list = list.filter((p) => p.ergometrico_status === filterErgo);
    if (filterCidade !== "todos") list = list.filter((p) => p.cidade === filterCidade);
    return list;
  }, [participantes, debouncedSearch, filterStatus, filterFamilia, filterContrato, filterErgo, filterCidade]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      let va: string | number | null = null;
      let vb: string | number | null = null;
      switch (sortKey) {
        case "nome": va = a.nome.toLowerCase(); vb = b.nome.toLowerCase(); break;
        case "idade": va = calcAge(a.data_nascimento); vb = calcAge(b.data_nascimento); break;
        case "telefone": va = a.telefone; vb = b.telefone; break;
        case "igreja": va = a.igreja; vb = b.igreja; break;
        case "familia": va = getFamiliaNumero(a.familia_id); vb = getFamiliaNumero(b.familia_id); break;
        case "status": va = a.status; vb = b.status; break;
      }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir, getFamiliaNumero]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginated.forEach((p) => next.delete(p.id));
      } else {
        paginated.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBatchDelete() {
    setDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("participantes").delete().in("id", ids);
    setDeleting(false);
    setDeleteConfirmOpen(false);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }

    toast.success(`${ids.length} participante(s) excluído(s).`);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["participantes"] });
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />;
  }

  function exportCSV() {
    const headers = ["Nome", "CPF", "Idade", "Telefone", "Email", "Igreja", "Família", "Status", "Contrato", "Ergométrico", "Check-in"];
    const rows = filtered.map((p) => [
      p.nome, p.cpf, calcAge(p.data_nascimento) ?? "", p.telefone ?? "", p.email ?? "",
      p.igreja ?? "", getFamiliaNumero(p.familia_id) ?? "", p.status ?? "",
      p.contrato_assinado ? "Sim" : "Não", p.ergometrico_status ?? "", p.checkin_realizado ? "Sim" : "Não",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "participantes.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Participantes</h1>
          <span className="text-sm text-muted-foreground">({filtered.length})</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {perms.participantes_importar === "E" && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Importar da TicketAndGo
            </Button>
          )}
          {perms.participantes_exportar === "E" && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          )}
          {(perms.participantes_novo === "E") && (
            <Button size="sm" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white" onClick={() => navigate("/participantes/novo")}>
              <Plus className="h-4 w-4 mr-1" /> Novo Participante
            </Button>
          )}
        </div>
      </div>

      {/* Search — hidden if buscar is null */}
      {perms.participantes_buscar !== null && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="inscrito">Inscrito</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFamilia} onValueChange={setFilterFamilia}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Família" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Famílias</SelectItem>
            {familias.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>Família {f.numero}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterContrato} onValueChange={setFilterContrato}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Contrato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Contratos</SelectItem>
            <SelectItem value="sim">Assinado</SelectItem>
            <SelectItem value="nao">Não assinado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterErgo} onValueChange={setFilterErgo}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Ergométrico" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Ergométricos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="dispensado">Dispensado</SelectItem>
          </SelectContent>
        </Select>
        {cidadesUnicas.length > 0 && (
          <Select value={filterCidade} onValueChange={setFilterCidade}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Cidades</SelectItem>
              {cidadesUnicas.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Batch action bar */}
      {someSelected && perms.participantes_editar === "E" && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-md bg-muted/50 border border-border">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} selecionado(s)</span>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setBatchEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" /> Editar em Lote
            </Button>
            <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Table / Mobile Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {paginated.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum participante encontrado.</p>
          ) : paginated.map((p) => {
            const age = calcAge(p.data_nascimento);
            const famNum = getFamiliaNumero(p.familia_id);
            const isSelected = selectedIds.has(p.id);
            return (
              <Card key={p.id} className={`cursor-pointer ${isSelected ? "border-primary" : ""}`} onClick={() => setSelectedParticipant(p)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(p.id)} />
                      <span className="font-medium truncate">{p.nome}</span>
                    </div>
                    <Badge className={statusColors[p.status ?? "inscrito"] ?? ""}>{p.status ?? "inscrito"}</Badge>
                  </div>
                   {p.cidade && <p className="text-xs text-muted-foreground">{p.cidade}</p>}
                   <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                     {age != null && <span>Idade: {age}</span>}
                     {famNum != null && <span>Família: {famNum}</span>}
                    <span className="flex items-center gap-1">
                      Contrato: {p.contrato_assinado ? <CheckCircle className="h-3.5 w-3.5 text-green-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    </span>
                    <span>Ergo: <Badge className={`text-[10px] px-1 py-0 ${ergoColors[p.ergometrico_status ?? "pendente"] ?? ""}`}>{p.ergometrico_status ?? "pendente"}</Badge></span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedParticipant(p)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/participantes/${p.id}/editar`)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
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
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected && paginated.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("nome")}>Nome<SortIcon col="nome" /></TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("idade")}>Idade<SortIcon col="idade" /></TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Igreja</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("familia")}>Família<SortIcon col="familia" /></TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="hidden md:table-cell">Ergométrico</TableHead>
                <TableHead className="hidden lg:table-cell">Check-in</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>Status<SortIcon col="status" /></TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    Nenhum participante encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => {
                  const age = calcAge(p.data_nascimento);
                  const famNum = getFamiliaNumero(p.familia_id);
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <TableRow key={p.id} className={`cursor-pointer ${isSelected ? "bg-muted/40" : ""}`} onClick={() => setSelectedParticipant(p)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                          aria-label={`Selecionar ${p.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{age ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.telefone ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.igreja ?? "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{p.cidade ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{famNum != null ? famNum : "—"}</TableCell>
                      <TableCell>
                        {p.contrato_assinado
                          ? <CheckCircle className="h-4 w-4 text-green-400" />
                          : <XCircle className="h-4 w-4 text-red-400" />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={ergoColors[p.ergometrico_status ?? "pendente"] ?? ""}>
                          {p.ergometrico_status ?? "pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {p.checkin_realizado
                          ? <CheckCircle className="h-4 w-4 text-green-400" />
                          : <Circle className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[p.status ?? "inscrito"] ?? ""}>
                          {p.status ?? "inscrito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedParticipant(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/participantes/${p.id}/editar`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <ParticipanteSheet
        participante={selectedParticipant}
        open={!!selectedParticipant}
        onOpenChange={(open) => { if (!open) setSelectedParticipant(null); }}
        familiaNumero={selectedParticipant ? getFamiliaNumero(selectedParticipant.familia_id) : null}
      />
      <ImportCSVDialog open={importOpen} onOpenChange={setImportOpen} existingCpfs={existingCpfs} />
      <BatchEditDialog
        open={batchEditOpen}
        onOpenChange={setBatchEditOpen}
        selectedIds={Array.from(selectedIds)}
        onDone={() => setSelectedIds(new Set())}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} participante(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
