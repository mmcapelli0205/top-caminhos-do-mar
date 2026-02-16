import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Search, Download, Plus, Eye, Pencil, Check, X,
  ArrowUp, ArrowDown, AlertTriangle, RefreshCw, Upload, Trash2, Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import ServidorSheet from "@/components/ServidorSheet";
import ImportServidoresCSVDialog from "@/components/ImportServidoresCSVDialog";
import type { Tables } from "@/integrations/supabase/types";

type Servidor = Tables<"servidores">;

const AREAS_SERVICO = [
  "Hakuna", "Segurança", "Eventos", "Mídia", "Comunicação",
  "Logística", "Voz", "ADM", "Coordenação Geral",
  "Intercessão", "DOC", "Diretoria",
];

const LOGOS_EQUIPES: Record<string, string> = {
  "ADM": "adm.png",
  "Eventos": "eventos.png",
  "Hakuna": "hakunas.png",
  "Intercessão": "intercessao.png",
  "DOC": "intercessao.png",
  "Louvor": "intercessao.png",
  "Logística": "logistica.png",
  "Mídia": "midia.png",
  "Comunicação": "midia.png",
  "Segurança": "seguranca.png",
  "Voz": "voz.png",
  "Coordenação Geral": "adm.png",
  "Diretoria": "Logo%20Legendarios.png",
};

const ASSET_BASE = "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";

const PAGE_SIZE = 20;
type SortKey = "nome" | "idade" | "status";
type SortDir = "asc" | "desc";

const statusColors: Record<string, string> = {
  pendente: "bg-orange-600/20 text-orange-400 border-orange-600/30",
  aprovado: "bg-green-600/20 text-green-400 border-green-600/30",
  recusado: "bg-red-600/20 text-red-400 border-red-600/30",
  sem_area: "bg-red-900/30 text-red-300 border-red-800/40",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  sem_area: "Sem Área",
};

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000));
}

export default function Servidores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { role, profile } = useAuth();
  const canDelete = role === "diretoria" || profile?.cargo === "coordenacao";

  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("servidores").select("*").order("nome");
      if (error) throw error;
      return data as Servidor[];
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterArea, setFilterArea] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [sortKey, setSortKey] = useState<SortKey>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null);

  const [recusarTarget, setRecusarTarget] = useState<Servidor | null>(null);
  const [recusarMotivo, setRecusarMotivo] = useState("");

  const [realocarTarget, setRealocarTarget] = useState<Servidor | null>(null);
  const [realocarArea, setRealocarArea] = useState("");
  const [realocando, setRealocando] = useState(false);

  const [showRealocarTodos, setShowRealocarTodos] = useState(false);
  const [realocarTodosMap, setRealocarTodosMap] = useState<Record<string, string>>({});
  const [recusando, setRecusando] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Servidor | null>(null);

  const existingCpfs = useMemo(() => servidores.map(s => s.cpf).filter(Boolean) as string[], [servidores]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterArea, filterStatus]);

  const pendentes = useMemo(() => servidores.filter(s => s.status === "pendente"), [servidores]);
  const semArea = useMemo(() => servidores.filter(s => s.status === "sem_area"), [servidores]);

  const areaCounts = useMemo(() => {
    const map: Record<string, { aprovados: number; pendentes: number }> = {};
    AREAS_SERVICO.forEach(a => { map[a] = { aprovados: 0, pendentes: 0 }; });
    servidores.forEach(s => {
      const area = s.area_servico;
      if (!area || !map[area]) return;
      if (s.status === "aprovado") map[area].aprovados++;
      else if (s.status === "pendente") map[area].pendentes++;
    });
    return map;
  }, [servidores]);

  const filtered = useMemo(() => {
    let list = servidores;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(s => s.nome.toLowerCase().includes(q) || (s.cpf?.toLowerCase().includes(q) ?? false));
    }
    if (filterArea !== "todas") list = list.filter(s => s.area_servico === filterArea);
    if (filterStatus !== "todos") list = list.filter(s => s.status === filterStatus);
    return list;
  }, [servidores, debouncedSearch, filterArea, filterStatus]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      let va: string | number | null = null, vb: string | number | null = null;
      switch (sortKey) {
        case "nome": va = a.nome.toLowerCase(); vb = b.nome.toLowerCase(); break;
        case "idade": va = calcAge(a.data_nascimento); vb = calcAge(b.data_nascimento); break;
        case "status": va = a.status; vb = b.status; break;
      }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />;
  }

  async function handleAceitar(s: Servidor) {
    const { error } = await supabase.from("servidores").update({
      status: "aprovado",
      updated_at: new Date().toISOString(),
    }).eq("id", s.id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`${s.nome} aprovado na área ${s.area_servico}!`);
    queryClient.invalidateQueries({ queryKey: ["servidores"] });
  }

  async function handleRecusarConfirm() {
    if (!recusarTarget || !recusarMotivo.trim()) return;
    setRecusando(true);
    const s = recusarTarget;
    const naFirstOption = s.area_servico === s.area_preferencia_1;
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (naFirstOption && s.area_preferencia_2) {
      update.area_servico = s.area_preferencia_2;
      update.status = "pendente";
    } else {
      update.status = "sem_area";
    }
    const { error } = await supabase.from("servidores").update(update).eq("id", s.id);
    setRecusando(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    if (naFirstOption && s.area_preferencia_2) {
      toast.info(`${s.nome} movido para 2ª opção: ${s.area_preferencia_2}`);
    } else {
      toast.warning(`${s.nome} ficou sem área.`);
    }
    setRecusarTarget(null);
    setRecusarMotivo("");
    queryClient.invalidateQueries({ queryKey: ["servidores"] });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("servidores").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir: " + error.message); return; }
    toast.success("Servidor excluído com sucesso");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["servidores"] });
  }

  function exportCSV() {
    const headers = ["Nome", "CPF", "Idade", "Telefone", "Email", "1ª Opção", "2ª Opção", "Área Atual", "Status"];
    const rows = filtered.map(s => [
      s.nome, s.cpf ?? "", calcAge(s.data_nascimento) ?? "", s.telefone ?? "", s.email ?? "",
      s.area_preferencia_1 ?? "", s.area_preferencia_2 ?? "", s.area_servico ?? "", s.status ?? "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "servidores.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Servidores</h1>
          <span className="text-sm text-muted-foreground">({servidores.length} total)</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar TicketAndGo
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => navigate("/servidores/novo")}>
            <Plus className="h-4 w-4 mr-1" /> Novo Servidor
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {pendentes.length > 0 && (
        <Card className="border-orange-600/50 bg-orange-600/10 cursor-pointer" onClick={() => { setFilterStatus("pendente"); setFilterArea("todas"); }}>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">⚠️ {pendentes.length} servidor(es) aguardando alocação!</span>
          </CardContent>
        </Card>
      )}
      {semArea.length > 0 && (
        <Card className="border-red-600/50 bg-red-600/10">
          <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setFilterStatus("sem_area"); setFilterArea("todas"); }}>
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-red-400">⚠️ {semArea.length} servidor(es) sem área!</span>
            </div>
            <Button size="sm" variant="outline" className="w-full sm:w-auto border-red-600/50 text-red-400 hover:bg-red-600/20" onClick={() => {
              const map: Record<string, string> = {};
              semArea.forEach(s => { map[s.id] = ""; });
              setRealocarTodosMap(map);
              setShowRealocarTodos(true);
            }}>
              <RefreshCw className="h-4 w-4 mr-1" /> Realocar todos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Area Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {AREAS_SERVICO.map(area => {
          const c = areaCounts[area];
          const logoFile = LOGOS_EQUIPES[area];
          const corEquipe = CORES_EQUIPES[area] || "#6B7280";
          return (
            <Card
              key={area}
              className="cursor-pointer relative h-40 flex flex-col items-center justify-center border-2 hover:scale-[1.05] hover:shadow-lg transition-all duration-300"
              style={{ borderColor: corEquipe }}
              onClick={() => navigate(`/areas/${encodeURIComponent(area)}`)}
            >
              <Badge className="absolute top-1.5 right-1.5 bg-primary/20 text-primary border-primary/30 text-xs h-5 min-w-5 flex items-center justify-center px-1">
                {c.aprovados}
              </Badge>
              {c.pendentes > 0 && (
                <Badge className="absolute top-1.5 left-1.5 bg-orange-600/20 text-orange-400 border-orange-600/30 text-xs h-5 px-1">
                  {c.pendentes}
                </Badge>
              )}
              <CardContent className="p-3 flex flex-col items-center justify-center gap-1 h-full w-full">
                {logoFile && !imgErrors[area] ? (
                  <img
                    src={`${ASSET_BASE}${logoFile}`}
                    alt={area}
                    className="h-24 w-24 md:h-28 md:w-28 object-contain"
                    onError={() => setImgErrors(prev => ({ ...prev, [area]: true }))}
                  />
                ) : (
                  <div
                    className="h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: corEquipe }}
                  >
                    <span className="text-3xl font-bold" style={{ color: getTextColor(corEquipe) }}>
                      {area.charAt(0)}
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-foreground text-center truncate w-full">{area}</p>
              </CardContent>
            </Card>
          );
        })}
        {semArea.length > 0 && (
          <Card
            className="cursor-pointer relative h-40 flex flex-col items-center justify-center border-2 border-red-600/40 hover:scale-[1.05] hover:shadow-lg transition-all duration-300"
            onClick={() => { setFilterStatus("sem_area"); setFilterArea("todas"); }}
          >
            <Badge className="absolute top-1.5 right-1.5 bg-red-600/20 text-red-400 border-red-600/30 text-xs h-5 min-w-5 flex items-center justify-center px-1">
              {semArea.length}
            </Badge>
            <CardContent className="p-3 flex flex-col items-center justify-center gap-1 h-full">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center bg-red-600/20">
                <AlertTriangle className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-xs font-bold text-red-400">Sem Área</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Áreas</SelectItem>
            {AREAS_SERVICO.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
            <SelectItem value="sem_area">Sem Área</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : paginated.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum servidor encontrado.</p>
          ) : paginated.map(s => {
            const st = s.status ?? "ativo";
            return (
              <Card key={s.id} className="cursor-pointer" onClick={() => setSelectedServidor(s)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium truncate flex items-center gap-1">
                      {s.origem === "convite" && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                      {s.dados_completos === false && (
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><span><AlertTriangle className="h-3.5 w-3.5 text-yellow-400 animate-pulse shrink-0" /></span></TooltipTrigger><TooltipContent>Dados incompletos - aguardando preenchimento</TooltipContent></Tooltip></TooltipProvider>
                      )}
                      {s.nome}
                    </span>
                    <Badge className={statusColors[st] ?? ""}>{statusLabels[st] ?? st}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>Área: {s.area_servico ?? "—"}</span>
                    <span>Idade: {calcAge(s.data_nascimento) ?? "—"}</span>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedServidor(s)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/servidores/${s.id}/editar`)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    {st === "pendente" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400" onClick={() => handleAceitar(s)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { setRecusarTarget(s); setRecusarMotivo(""); }}>
                          <X className="h-4 w-4" />
                       </Button>
                      </>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
                <TableHead className="cursor-pointer" onClick={() => toggleSort("nome")}>Nome<SortIcon col="nome" /></TableHead>
                <TableHead className="cursor-pointer hidden md:table-cell" onClick={() => toggleSort("idade")}>Idade<SortIcon col="idade" /></TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">1ª Opção</TableHead>
                <TableHead className="hidden lg:table-cell">2ª Opção</TableHead>
                <TableHead>Área Atual</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>Status<SortIcon col="status" /></TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum servidor encontrado.</TableCell>
                </TableRow>
              ) : paginated.map(s => {
                const st = s.status ?? "ativo";
                return (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedServidor(s)}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-1">
                        {s.origem === "convite" && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />}
                        {s.dados_completos === false && (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><span><AlertTriangle className="h-3.5 w-3.5 text-yellow-400 animate-pulse shrink-0" /></span></TooltipTrigger><TooltipContent>Dados incompletos - aguardando preenchimento</TooltipContent></Tooltip></TooltipProvider>
                        )}
                        {s.nome}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{calcAge(s.data_nascimento) ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.telefone ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{s.area_preferencia_1 ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">{s.area_preferencia_2 ?? "—"}</TableCell>
                    <TableCell>{s.area_servico ?? "—"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[st] ?? ""}>{statusLabels[st] ?? st}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedServidor(s)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/servidores/${s.id}/editar`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {st === "pendente" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-300" onClick={() => handleAceitar(s)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setRecusarTarget(s); setRecusarMotivo(""); }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {st === "sem_area" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-400 hover:text-orange-300" onClick={() => { setRealocarTarget(s); setRealocarArea(""); }}>
                          <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(s)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} de {sorted.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Próximo</Button>
          </div>
        </div>
      )}

      {/* Recusar Dialog */}
      <Dialog open={!!recusarTarget} onOpenChange={open => { if (!open) setRecusarTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Recusar Servidor</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Recusar <strong>{recusarTarget?.nome}</strong> da área <strong>{recusarTarget?.area_servico}</strong>?
            {recusarTarget?.area_servico === recusarTarget?.area_preferencia_1 && recusarTarget?.area_preferencia_2
              ? ` Será movido para a 2ª opção: ${recusarTarget.area_preferencia_2}.`
              : " Ficará sem área atribuída."}
          </p>
          <Textarea placeholder="Motivo da recusa (obrigatório)" value={recusarMotivo} onChange={e => setRecusarMotivo(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecusarTarget(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={!recusarMotivo.trim() || recusando} onClick={handleRecusarConfirm}>Confirmar Recusa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!realocarTarget} onOpenChange={open => { if (!open) setRealocarTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Realocar Servidor</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione uma nova área para <strong>{realocarTarget?.nome}</strong>:</p>
          <Select value={realocarArea} onValueChange={setRealocarArea}>
            <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
            <SelectContent>
              {AREAS_SERVICO.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRealocarTarget(null)}>Cancelar</Button>
            <Button disabled={!realocarArea || realocando} onClick={async () => {
              if (!realocarTarget || !realocarArea) return;
              setRealocando(true);
              const { error } = await supabase.from("servidores").update({
                area_servico: realocarArea, status: "aprovado", updated_at: new Date().toISOString(),
              }).eq("id", realocarTarget.id);
              setRealocando(false);
              if (error) { toast.error("Erro: " + error.message); return; }
              toast.success(`Servidor ${realocarTarget.nome} realocado para ${realocarArea}!`);
              setRealocarTarget(null);
              queryClient.invalidateQueries({ queryKey: ["servidores"] });
            }}>Confirmar Realocação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRealocarTodos} onOpenChange={open => { if (!open) setShowRealocarTodos(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Realocar Todos Sem Área</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {semArea.map(s => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{s.nome}</span>
                <Select value={realocarTodosMap[s.id] ?? ""} onValueChange={v => setRealocarTodosMap(prev => ({ ...prev, [s.id]: v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Área" /></SelectTrigger>
                  <SelectContent>
                    {AREAS_SERVICO.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRealocarTodos(false)}>Cancelar</Button>
            <Button disabled={realocando} onClick={async () => {
              const entries = Object.entries(realocarTodosMap).filter(([, area]) => area);
              if (entries.length === 0) { toast.error("Selecione pelo menos uma área"); return; }
              setRealocando(true);
              for (const [id, area] of entries) {
                await supabase.from("servidores").update({
                  area_servico: area, status: "aprovado", updated_at: new Date().toISOString(),
                }).eq("id", id);
              }
              setRealocando(false);
              toast.success(`${entries.length} servidor(es) realocado(s)!`);
              setShowRealocarTodos(false);
              queryClient.invalidateQueries({ queryKey: ["servidores"] });
            }}>Salvar Todos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServidorSheet servidor={selectedServidor} open={!!selectedServidor} onOpenChange={open => { if (!open) setSelectedServidor(null); }} />

      <ImportServidoresCSVDialog open={importOpen} onOpenChange={setImportOpen} existingCpfs={existingCpfs} />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Servidor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteTarget?.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
