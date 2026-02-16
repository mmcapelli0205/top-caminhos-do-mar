import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, Book, Clock, MapPin, Users, X } from "lucide-react";
import { toast } from "sonner";
import PredicaFormDialog from "./PredicaFormDialog";

type Predica = {
  id: string;
  codigo: string;
  dia: string;
  titulo: string;
  local: string | null;
  horario_previsto: string | null;
  duracao_estimada_min: number | null;
  pregador_nome: string | null;
  pregador_id: string | null;
  passagens_biblicas: string | null;
  publico: string | null;
  recursos_necessarios: string | null;
  status: string | null;
  observacoes: string | null;
  top_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const DIA_CORES: Record<string, string> = {
  D1: "#F97316",
  D2: "#3B82F6",
  D3: "#22C55E",
  D4: "#EAB308",
};

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  pendente: { className: "bg-muted text-muted-foreground", label: "Pendente" },
  confirmada: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Confirmada" },
  ajustada: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Ajustada" },
  cancelada: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "Cancelada" },
};

function formatHorario(h: string | null) {
  if (!h) return "—";
  return h.substring(0, 5);
}

export default function PredicasTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [predicaSelecionada, setPredicaSelecionada] = useState<Predica | null>(null);
  const [editando, setEditando] = useState<Predica | null | undefined>(undefined); // undefined=closed, null=new, Predica=edit
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: predicas = [], isLoading } = useQuery({
    queryKey: ["predicas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predicas")
        .select("*")
        .order("codigo");
      if (error) throw error;
      return data as Predica[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("predicas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predicas"] });
      toast.success("Prédica excluída com sucesso");
    },
    onError: () => toast.error("Erro ao excluir prédica"),
  });

  // Filtering
  const filtered = predicas.filter((p) => {
    if (diaSelecionado && p.dia !== diaSelecionado) return false;
    if (statusFiltro && p.status !== statusFiltro) return false;
    if (busca) {
      const q = busca.toLowerCase();
      if (
        !p.titulo.toLowerCase().includes(q) &&
        !(p.pregador_nome ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // Counts per day
  const countByDay = predicas.reduce<Record<string, number>>((acc, p) => {
    acc[p.dia] = (acc[p.dia] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">🙏 Lista de Prédicas</h2>
          <p className="text-sm text-muted-foreground">{predicas.length} prédicas cadastradas</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setEditando(null)}>
            <Plus className="h-4 w-4 mr-1" /> Nova Prédica
          </Button>
        )}
      </div>

      {/* Day Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={diaSelecionado === "" ? "default" : "outline"}
          onClick={() => setDiaSelecionado("")}
        >
          Todos
          <Badge variant="secondary" className="ml-1 text-[10px]">{predicas.length}</Badge>
        </Button>
        {["D1", "D2", "D3", "D4"].map((dia) => (
          <Button
            key={dia}
            size="sm"
            variant={diaSelecionado === dia ? "default" : "outline"}
            onClick={() => setDiaSelecionado(diaSelecionado === dia ? "" : dia)}
            style={
              diaSelecionado === dia
                ? { backgroundColor: DIA_CORES[dia], borderColor: DIA_CORES[dia] }
                : { borderColor: DIA_CORES[dia], color: DIA_CORES[dia] }
            }
          >
            {dia}
            <Badge variant="secondary" className="ml-1 text-[10px]">{countByDay[dia] || 0}</Badge>
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar título ou pregador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="ajustada">Ajustada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Código</TableHead>
              <TableHead className="w-14">Dia</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Local</TableHead>
              <TableHead className="w-20">Horário</TableHead>
              <TableHead className="w-20">Duração</TableHead>
              <TableHead>Pregador</TableHead>
              <TableHead>Público</TableHead>
              <TableHead className="w-24">Status</TableHead>
              {canEdit && <TableHead className="w-20">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 10 : 9} className="text-center text-muted-foreground py-8">
                  Nenhuma prédica encontrada.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const isCancelada = p.status === "cancelada";
              const statusInfo = STATUS_BADGES[p.status ?? "pendente"] ?? STATUS_BADGES.pendente;
              return (
                <TableRow
                  key={p.id}
                  className={`cursor-pointer hover:bg-muted/50 ${isCancelada ? "opacity-50" : ""}`}
                  style={{ borderLeft: `4px solid ${DIA_CORES[p.dia] ?? "#888"}` }}
                  onClick={() => setPredicaSelecionada(p)}
                >
                  <TableCell className={`font-mono text-xs ${isCancelada ? "line-through" : ""}`}>{p.codigo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: DIA_CORES[p.dia], color: DIA_CORES[p.dia] }}>
                      {p.dia}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-medium ${isCancelada ? "line-through" : ""}`}>{p.titulo}</TableCell>
                  <TableCell className="text-sm">{p.local ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatHorario(p.horario_previsto)}</TableCell>
                  <TableCell className="text-sm">{p.duracao_estimada_min ? `${p.duracao_estimada_min}min` : "—"}</TableCell>
                  <TableCell className="text-sm">{p.pregador_nome ?? "—"}</TableCell>
                  <TableCell className="text-sm">{p.publico ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir prédica?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{p.codigo} — {p.titulo}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma prédica encontrada.</p>
        )}
        {filtered.map((p) => {
          const isCancelada = p.status === "cancelada";
          const statusInfo = STATUS_BADGES[p.status ?? "pendente"] ?? STATUS_BADGES.pendente;
          return (
            <Card
              key={p.id}
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${isCancelada ? "opacity-50" : ""}`}
              style={{ borderLeft: `4px solid ${DIA_CORES[p.dia] ?? "#888"}` }}
              onClick={() => setPredicaSelecionada(p)}
            >
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm ${isCancelada ? "line-through" : ""}`}>
                    <span className="font-mono text-xs text-muted-foreground mr-1">{p.codigo}</span>
                    {p.titulo}
                  </span>
                  <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>{statusInfo.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {p.pregador_nome && <span>🎤 {p.pregador_nome}</span>}
                  {p.local && <span><MapPin className="inline h-3 w-3" /> {p.local}</span>}
                  {p.horario_previsto && <span><Clock className="inline h-3 w-3" /> {formatHorario(p.horario_previsto)}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Details Dialog */}
      <Dialog open={!!predicaSelecionada} onOpenChange={(o) => !o && setPredicaSelecionada(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono text-sm" style={{ color: DIA_CORES[predicaSelecionada?.dia ?? ""] }}>
                {predicaSelecionada?.codigo}
              </span>
              {predicaSelecionada?.titulo}
            </DialogTitle>
          </DialogHeader>
          {predicaSelecionada && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Dia</p>
                  <Badge variant="outline" style={{ borderColor: DIA_CORES[predicaSelecionada.dia], color: DIA_CORES[predicaSelecionada.dia] }}>
                    {predicaSelecionada.dia}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant="outline" className={STATUS_BADGES[predicaSelecionada.status ?? "pendente"]?.className}>
                    {STATUS_BADGES[predicaSelecionada.status ?? "pendente"]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Horário</p>
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatHorario(predicaSelecionada.horario_previsto)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duração</p>
                  <p>{predicaSelecionada.duracao_estimada_min ? `${predicaSelecionada.duracao_estimada_min} min` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pregador</p>
                  <p>{predicaSelecionada.pregador_nome ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Local</p>
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {predicaSelecionada.local ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Público</p>
                  <p className="flex items-center gap-1"><Users className="h-3 w-3" /> {predicaSelecionada.publico ?? "—"}</p>
                </div>
              </div>
              {predicaSelecionada.passagens_biblicas && (
                <div>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Book className="h-3 w-3" /> Passagens Bíblicas</p>
                  <p className="whitespace-pre-wrap bg-muted/30 rounded p-2 mt-1">{predicaSelecionada.passagens_biblicas}</p>
                </div>
              )}
              {predicaSelecionada.recursos_necessarios && (
                <div>
                  <p className="text-muted-foreground text-xs">Recursos Necessários</p>
                  <p className="whitespace-pre-wrap">{predicaSelecionada.recursos_necessarios}</p>
                </div>
              )}
              {predicaSelecionada.observacoes && (
                <div>
                  <p className="text-muted-foreground text-xs">Observações</p>
                  <p className="whitespace-pre-wrap">{predicaSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <PredicaFormDialog
        open={editando !== undefined}
        onOpenChange={(o) => !o && setEditando(undefined)}
        predica={editando === undefined ? null : editando}
      />
    </div>
  );
}
