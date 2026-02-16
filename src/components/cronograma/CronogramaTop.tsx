import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, Filter, X, MapPin, Clock, Droplets, Clapperboard, BarChart3 } from "lucide-react";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";
import { toast } from "sonner";
import CronogramaFormDialog from "./CronogramaFormDialog";
import RelatorioTop from "./RelatorioTop";
import type { Tables } from "@/integrations/supabase/types";

type Atividade = Tables<"cronograma_atividades">;

const CORES_TIPO: Record<string, string> = {
  "Trilha": "#B6D7A8",
  "Prédica": "#FFE599",
  "Instrução": "#A4C2F4",
  "Trajeto": "#D9D9D9",
  "Translado": "#D9D9D9",
  "Dinâmica": "#D5A6E6",
  "Refeição": "#F97316",
  "Montagem": "#D2B48C",
  "Desmontagem": "#D2B48C",
  "Atividade": "transparent",
};

const DIAS_CONFIG = [
  { id: "D1", label: "D1 PARTIDA", color: "#F97316" },
  { id: "D2", label: "D2", color: "#3B82F6" },
  { id: "D3", label: "D3", color: "#22C55E" },
  { id: "D4", label: "D4 CHEGADA", color: "#EAB308" },
];

const TIPOS_FILTER = ["Trilha", "Prédica", "Instrução", "Atividade", "Dinâmica", "Trajeto", "Translado", "Refeição", "Montagem", "Desmontagem"];
const EQUIPES_FILTER = ["ADM", "Logística", "Eventos", "Segurança", "Mídia", "Voz", "Comunicação", "Hakuna", "Intercessão", "Coordenação Geral", "Coletiva", "Legendários", "Participantes"];

interface Props {
  canEdit: boolean;
  cronogramaTipo: string;
}

export default function CronogramaTop({ canEdit, cronogramaTipo }: Props) {
  const qc = useQueryClient();
  const [diaSelecionado, setDiaSelecionado] = useState("D1");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState("");
  const [busca, setBusca] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editAtividade, setEditAtividade] = useState<Atividade | null>(null);
  const [showRelatorio, setShowRelatorio] = useState(false);

  // Fetch all activities for counts
  const { data: allAtividades = [] } = useQuery({
    queryKey: ["cronograma-atividades-all", cronogramaTipo],
    queryFn: async () => {
      const { data } = await supabase
        .from("cronograma_atividades")
        .select("*")
        .eq("cronograma_tipo", cronogramaTipo)
        .order("ordem");
      return (data ?? []) as Atividade[];
    },
  });

  const atividades = useMemo(() =>
    allAtividades.filter(a => a.dia === diaSelecionado),
    [allAtividades, diaSelecionado]
  );

  const countByDay = useMemo(() => {
    const c: Record<string, number> = {};
    DIAS_CONFIG.forEach(d => { c[d.id] = allAtividades.filter(a => a.dia === d.id).length; });
    return c;
  }, [allAtividades]);

  const filtradas = useMemo(() => {
    let result = atividades;
    if (filtroTipo) result = result.filter(a => a.tipo === filtroTipo);
    if (filtroEquipe) result = result.filter(a => a.equipe_responsavel === filtroEquipe);
    if (busca) {
      const q = busca.toLowerCase();
      result = result.filter(a =>
        a.titulo.toLowerCase().includes(q) || (a.local?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [atividades, filtroTipo, filtroEquipe, busca]);

  const hasFilters = filtroTipo || filtroEquipe || busca;

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cronograma_atividades").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Atividade excluída");
    qc.invalidateQueries({ queryKey: ["cronograma-atividades-all"] });
  };

  const handleEdit = (a: Atividade) => {
    setEditAtividade(a);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditAtividade(null);
    setFormOpen(true);
  };

  // Compute gaps for interval separators
  const getGapMinutes = (prev: Atividade, curr: Atividade): number | null => {
    if (!prev.horario_fim || !curr.horario_inicio) return null;
    const [ph, pm] = prev.horario_fim.split(":").map(Number);
    const [ch, cm] = curr.horario_inicio.split(":").map(Number);
    const gap = (ch * 60 + cm) - (ph * 60 + pm);
    return gap > 0 ? gap : null;
  };

  const formatTime = (t: string | null) => {
    if (!t) return "--:--";
    return t.substring(0, 5);
  };

  return (
    <div className="space-y-4">
      {showRelatorio ? (
        <RelatorioTop onVoltar={() => setShowRelatorio(false)} />
      ) : (
      <>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">📋 Cronograma do TOP</h2>
          <p className="text-sm text-muted-foreground">{allAtividades.length} atividades em 4 dias</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setShowRelatorio(true)}>
              <BarChart3 className="h-4 w-4 mr-1" /> Relatório do TOP
            </Button>
          )}
          {canEdit && (
            <Button onClick={handleNew} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Atividade
            </Button>
          )}
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIAS_CONFIG.map(d => (
          <button
            key={d.id}
            onClick={() => setDiaSelecionado(d.id)}
            className={`px-4 py-2.5 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
              diaSelecionado === d.id ? "ring-2 ring-offset-2 ring-offset-background scale-105" : "opacity-70 hover:opacity-100"
            }`}
            style={{
              backgroundColor: d.color,
              color: getTextColor(d.color),
              boxShadow: diaSelecionado === d.id ? `0 4px 12px ${d.color}40` : undefined,
            }}
          >
            {d.label}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{countByDay[d.id]}</Badge>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-3 w-3" /> Filtros
            {hasFilters && <Badge variant="destructive" className="text-[10px] px-1">!</Badge>}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="w-40">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_FILTER.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={filtroEquipe} onValueChange={setFiltroEquipe}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Equipe" /></SelectTrigger>
                <SelectContent>
                  {EQUIPES_FILTER.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input
              className="h-8 w-48 text-xs"
              placeholder="Buscar título ou local..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFiltroTipo(""); setFiltroEquipe(""); setBusca(""); }}>
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

        <div className="space-y-0">
          {filtradas.map((a, idx) => {
            const prev = idx > 0 ? filtradas[idx - 1] : null;
            const gap = prev ? getGapMinutes(prev, a) : null;
            const corTipo = CORES_TIPO[a.tipo] || "transparent";
            const corEquipe = a.equipe_responsavel ? CORES_EQUIPES[a.equipe_responsavel] : undefined;

            return (
              <div key={a.id}>
                {/* Interval separator */}
                {gap && gap > 0 && (
                  <div className="flex items-center gap-2 py-1 pl-8 md:pl-10">
                    <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">⏸️ Intervalo — {gap}min</span>
                    <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
                  </div>
                )}

                {/* Activity card */}
                <div className="relative md:pl-10 pl-2 py-1">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 border-background hidden md:block"
                    style={{ backgroundColor: corTipo !== "transparent" ? corTipo : "hsl(var(--muted-foreground))" }}
                  />

                  <Card
                    className="overflow-hidden hover:shadow-md transition-shadow duration-200"
                    style={{ borderLeftWidth: "4px", borderLeftColor: corTipo !== "transparent" ? corTipo : "hsl(var(--border))" }}
                  >
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto_auto] gap-2 md:gap-4 items-start">
                        {/* Col 1: Times */}
                        <div className="flex md:flex-col items-center md:items-start gap-1">
                          <span className="font-mono text-lg font-bold">{formatTime(a.horario_inicio)}</span>
                          <span className="text-muted-foreground text-xs">→ {formatTime(a.horario_fim)}</span>
                          {a.tempo_previsto_min && (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="h-2.5 w-2.5 mr-0.5" />{a.tempo_previsto_min}min
                            </Badge>
                          )}
                        </div>

                        {/* Col 2: Main info */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className="text-[10px] px-1.5"
                              style={{
                                backgroundColor: corTipo !== "transparent" ? corTipo : undefined,
                                color: corTipo !== "transparent" ? getTextColor(corTipo) : undefined,
                              }}
                              variant={corTipo === "transparent" ? "outline" : "default"}
                            >
                              {a.tipo}
                            </Badge>
                            <span className="font-bold text-sm md:text-base truncate">{a.titulo}</span>
                          </div>
                          {a.local && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {a.local}
                            </p>
                          )}
                          {a.cenario_recursos && (
                            <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                              <Clapperboard className="h-3 w-3" /> {a.cenario_recursos}
                            </p>
                          )}
                          {a.reposicao_agua && (
                            <p className="text-xs text-blue-400 flex items-center gap-1">
                              <Droplets className="h-3 w-3" /> {a.reposicao_agua}
                            </p>
                          )}
                        </div>

                        {/* Col 3: Team */}
                        <div className="flex flex-wrap gap-1 items-start">
                          {corEquipe && (
                            <Badge
                              className="text-[10px]"
                              style={{ backgroundColor: corEquipe, color: getTextColor(corEquipe) }}
                            >
                              {a.equipe_responsavel}
                            </Badge>
                          )}
                          {a.responsavel_nome && (
                            <span className="text-xs text-muted-foreground">{a.responsavel_nome}</span>
                          )}
                        </div>

                        {/* Col 4: Actions */}
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(a)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                                  <AlertDialogDescription>"{a.titulo}" será removida permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}

          {filtradas.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {hasFilters ? "Nenhuma atividade encontrada com esses filtros." : "Nenhuma atividade neste dia."}
            </p>
          )}
        </div>
      </div>

      <CronogramaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        atividade={editAtividade}
        cronogramaTipo={cronogramaTipo}
        defaultDia={diaSelecionado}
      />
      </>
      )}
    </div>
  );
}
