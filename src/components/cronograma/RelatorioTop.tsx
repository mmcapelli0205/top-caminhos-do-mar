import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileDown, FileSpreadsheet, X, TrendingUp, TrendingDown, Clock, CheckCircle2, SkipForward, AlertCircle } from "lucide-react";
import { getTextColor } from "@/lib/coresEquipes";
import { toast } from "sonner";
import jsPDF from "jspdf";
import Papa from "papaparse";
import type { Tables } from "@/integrations/supabase/types";

type Atividade = Tables<"cronograma_atividades">;

const DIAS_CONFIG = [
  { id: "D1", label: "D1 PARTIDA", color: "#F97316" },
  { id: "D2", label: "D2", color: "#3B82F6" },
  { id: "D3", label: "D3", color: "#22C55E" },
  { id: "D4", label: "D4 CHEGADA", color: "#EAB308" },
];

const TIPOS = ["Trilha", "Prédica", "Instrução", "Atividade", "Dinâmica", "Trajeto", "Translado", "Refeição", "Montagem", "Desmontagem"];

interface Props {
  onVoltar: () => void;
}

function formatTime(t: string | null) {
  if (!t) return "—";
  return t.substring(0, 5);
}

function formatTimestamp(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(min: number | null) {
  if (min == null) return "—";
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${min}min`;
}

function getDiffLabel(a: Atividade): { text: string; color: string } {
  if (a.status_execucao === "pulada") return { text: "Pulada", color: "text-muted-foreground" };
  if (a.tempo_real_min == null || a.tempo_previsto_min == null) return { text: "—", color: "text-muted-foreground" };
  const diff = a.tempo_real_min - a.tempo_previsto_min;
  if (Math.abs(diff) < 3) return { text: "✅ No tempo", color: "text-foreground" };
  if (diff > 0) return { text: `⚠️ +${diff}min`, color: "text-red-400" };
  return { text: `✅ ${diff}min`, color: "text-green-400" };
}

export default function RelatorioTop({ onVoltar }: Props) {
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

  const { data: atividades = [] } = useQuery({
    queryKey: ["relatorio-top-atividades"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cronograma_atividades")
        .select("*")
        .eq("cronograma_tipo", "adm")
        .order("dia")
        .order("ordem");
      return (data ?? []) as Atividade[];
    },
  });

  const filtradas = useMemo(() => {
    let r = atividades;
    if (filtroDia) r = r.filter(a => a.dia === filtroDia);
    if (filtroTipo) r = r.filter(a => a.tipo === filtroTipo);
    if (filtroStatus) r = r.filter(a => (a.status_execucao ?? "pendente") === filtroStatus);
    return r;
  }, [atividades, filtroDia, filtroTipo, filtroStatus]);

  const hasFilters = filtroDia || filtroTipo || filtroStatus;

  // Executive summary
  const stats = useMemo(() => {
    const total = atividades.length;
    const concluidas = atividades.filter(a => a.status_execucao === "concluida");
    const puladas = atividades.filter(a => a.status_execucao === "pulada").length;
    const pendentes = atividades.filter(a => !a.status_execucao || a.status_execucao === "pendente").length;
    const tempoPrevisto = atividades.reduce((s, a) => s + (a.tempo_previsto_min ?? 0), 0);
    const tempoReal = concluidas.reduce((s, a) => s + (a.tempo_real_min ?? 0), 0);
    const diff = tempoReal - tempoPrevisto;
    const onTime = concluidas.filter(a => {
      if (a.tempo_real_min == null || a.tempo_previsto_min == null) return false;
      return Math.abs(a.tempo_real_min - a.tempo_previsto_min) <= 3;
    }).length;
    const pontualidade = concluidas.length > 0 ? Math.round((onTime / concluidas.length) * 100) : 0;
    return { total, concluidas: concluidas.length, puladas, pendentes, tempoPrevisto, tempoReal, diff, pontualidade };
  }, [atividades]);

  // Group by day
  const grouped = useMemo(() => {
    const days: Record<string, Atividade[]> = {};
    filtradas.forEach(a => {
      if (!days[a.dia]) days[a.dia] = [];
      days[a.dia].push(a);
    });
    return days;
  }, [filtradas]);

  // Insights
  const insights = useMemo(() => {
    const concluidas = atividades.filter(a => a.status_execucao === "concluida" && a.tempo_real_min != null && a.tempo_previsto_min != null);
    let maiorAtraso: Atividade | null = null;
    let maxDiff = 0;
    concluidas.forEach(a => {
      const d = (a.tempo_real_min ?? 0) - (a.tempo_previsto_min ?? 0);
      if (d > maxDiff) { maxDiff = d; maiorAtraso = a; }
    });

    // Best day
    const dayStats: Record<string, { onTime: number; total: number }> = {};
    concluidas.forEach(a => {
      if (!dayStats[a.dia]) dayStats[a.dia] = { onTime: 0, total: 0 };
      dayStats[a.dia].total++;
      if (Math.abs((a.tempo_real_min ?? 0) - (a.tempo_previsto_min ?? 0)) <= 3) dayStats[a.dia].onTime++;
    });
    let bestDay = "";
    let bestPct = 0;
    Object.entries(dayStats).forEach(([dia, s]) => {
      const pct = s.total > 0 ? (s.onTime / s.total) * 100 : 0;
      if (pct > bestPct) { bestPct = pct; bestDay = dia; }
    });

    // Average by type
    const typeAvg: Record<string, { sum: number; count: number }> = {};
    concluidas.forEach(a => {
      if (!typeAvg[a.tipo]) typeAvg[a.tipo] = { sum: 0, count: 0 };
      typeAvg[a.tipo].sum += (a.tempo_real_min ?? 0) - (a.tempo_previsto_min ?? 0);
      typeAvg[a.tipo].count++;
    });
    const topType = Object.entries(typeAvg).sort((a, b) => Math.abs(b[1].sum / b[1].count) - Math.abs(a[1].sum / a[1].count))[0];

    return { maiorAtraso, maxDiff, bestDay, bestPct: Math.round(bestPct), topType };
  }, [atividades]);

  // Summary by type
  const resumoTipo = useMemo(() => {
    const map: Record<string, { qtd: number; previsto: number; real: number }> = {};
    atividades.filter(a => a.status_execucao === "concluida").forEach(a => {
      if (!map[a.tipo]) map[a.tipo] = { qtd: 0, previsto: 0, real: 0 };
      map[a.tipo].qtd++;
      map[a.tipo].previsto += a.tempo_previsto_min ?? 0;
      map[a.tipo].real += a.tempo_real_min ?? 0;
    });
    return Object.entries(map).map(([tipo, v]) => ({
      tipo,
      ...v,
      diffMedia: v.qtd > 0 ? Math.round((v.real - v.previsto) / v.qtd) : 0,
    }));
  }, [atividades]);

  // Day subtotals
  const daySubtotals = useMemo(() => {
    const map: Record<string, { previsto: number; real: number }> = {};
    atividades.filter(a => a.status_execucao === "concluida").forEach(a => {
      if (!map[a.dia]) map[a.dia] = { previsto: 0, real: 0 };
      map[a.dia].previsto += a.tempo_previsto_min ?? 0;
      map[a.dia].real += a.tempo_real_min ?? 0;
    });
    return map;
  }, [atividades]);

  const exportCSV = () => {
    const rows = atividades.map(a => ({
      Dia: a.dia,
      Ordem: a.ordem,
      Atividade: a.titulo,
      Tipo: a.tipo,
      Local: a.local ?? "",
      "H. Previsto Início": formatTime(a.horario_inicio),
      "H. Previsto Fim": formatTime(a.horario_fim),
      "H. Real Início": formatTimestamp(a.horario_inicio_real),
      "H. Real Fim": formatTimestamp(a.horario_fim_real),
      "Tempo Previsto (min)": a.tempo_previsto_min ?? "",
      "Tempo Real (min)": a.tempo_real_min ?? "",
      "Diferença (min)": a.tempo_real_min != null && a.tempo_previsto_min != null ? a.tempo_real_min - a.tempo_previsto_min : "",
      Status: a.status_execucao ?? "pendente",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-top.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFontSize(16);
    doc.text("Relatório Pós-Evento — TOP 1575 Caminhos do Mar", 14, y);
    y += 8;
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, y);
    y += 10;

    // Summary
    doc.setFontSize(11);
    doc.text(`Total: ${stats.total} | Concluídas: ${stats.concluidas} | Puladas: ${stats.puladas} | Pendentes: ${stats.pendentes}`, 14, y);
    y += 6;
    doc.text(`Tempo Previsto: ${formatDuration(stats.tempoPrevisto)} | Tempo Real: ${formatDuration(stats.tempoReal)} | Diferença: ${stats.diff > 0 ? "+" : ""}${stats.diff}min | Pontualidade: ${stats.pontualidade}%`, 14, y);
    y += 10;

    // Table header
    const cols = ["Dia", "Ord", "Atividade", "Tipo", "Local", "H.Prev", "H.Real I", "H.Real F", "T.Prev", "T.Real", "Diff", "Status"];
    const colX = [14, 28, 38, 108, 138, 168, 188, 208, 228, 245, 260, 275];
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    cols.forEach((c, i) => doc.text(c, colX[i], y));
    y += 5;
    doc.setFont("helvetica", "normal");

    atividades.forEach(a => {
      if (y > 190) { doc.addPage(); y = 15; }
      const diff = a.tempo_real_min != null && a.tempo_previsto_min != null ? a.tempo_real_min - a.tempo_previsto_min : null;
      const diffStr = diff != null ? (Math.abs(diff) < 3 ? "OK" : `${diff > 0 ? "+" : ""}${diff}`) : "—";
      const row = [
        a.dia, String(a.ordem), a.titulo.substring(0, 30), a.tipo, (a.local ?? "").substring(0, 12),
        formatTime(a.horario_inicio), formatTimestamp(a.horario_inicio_real), formatTimestamp(a.horario_fim_real),
        a.tempo_previsto_min != null ? `${a.tempo_previsto_min}` : "—",
        a.tempo_real_min != null ? `${a.tempo_real_min}` : "—",
        diffStr,
        a.status_execucao ?? "pendente",
      ];

      if (diff != null && diff > 3) doc.setTextColor(220, 50, 50);
      else if (diff != null && diff < -3) doc.setTextColor(50, 180, 50);
      else doc.setTextColor(0, 0, 0);

      row.forEach((v, i) => doc.text(v, colX[i], y));
      doc.setTextColor(0, 0, 0);
      y += 4.5;
    });

    // Insights
    y += 8;
    if (y > 180) { doc.addPage(); y = 15; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Insights", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    if (insights.maiorAtraso) doc.text(`Maior atraso: ${insights.maiorAtraso.titulo} (+${insights.maxDiff}min)`, 14, y);
    y += 5;
    if (insights.bestDay) doc.text(`Melhor pontualidade: ${insights.bestDay} (${insights.bestPct}%)`, 14, y);

    doc.save("relatorio-top.pdf");
    toast.success("PDF exportado!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">📊 Relatório Pós-Evento</h2>
          <p className="text-sm text-muted-foreground">TOP 1575 Caminhos do Mar — Gerado em {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Cronograma
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total" value={stats.total} icon={<Clock className="h-5 w-5" />} />
        <SummaryCard label="Concluídas" value={stats.concluidas} icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} className="border-green-500/30" />
        <SummaryCard label="Puladas" value={stats.puladas} icon={<SkipForward className="h-5 w-5 text-muted-foreground" />} className="border-muted-foreground/30" />
        <SummaryCard label="Pendentes" value={stats.pendentes} icon={<AlertCircle className="h-5 w-5 text-yellow-400" />} className="border-yellow-500/30" />
        <SummaryCard label="Tempo Previsto" value={formatDuration(stats.tempoPrevisto)} />
        <SummaryCard label="Tempo Real" value={formatDuration(stats.tempoReal)} />
        <SummaryCard
          label="Diferença Geral"
          value={`${stats.diff > 0 ? "+" : ""}${formatDuration(stats.diff)}`}
          className={stats.diff > 0 ? "border-red-500/30" : "border-green-500/30"}
          icon={stats.diff > 0 ? <TrendingUp className="h-5 w-5 text-red-400" /> : <TrendingDown className="h-5 w-5 text-green-400" />}
        />
        <SummaryCard label="Pontualidade" value={`${stats.pontualidade}%`} icon={<CheckCircle2 className="h-5 w-5 text-primary" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-36">
          <Select value={filtroDia} onValueChange={setFiltroDia}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Dia" /></SelectTrigger>
            <SelectContent>
              {DIAS_CONFIG.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="pulada">Pulada</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFiltroDia(""); setFiltroTipo(""); setFiltroStatus(""); }}>
            <X className="h-3 w-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block">
        {DIAS_CONFIG.filter(d => !filtroDia || d.id === filtroDia).map(dia => {
          const dayActs = grouped[dia.id];
          if (!dayActs || dayActs.length === 0) return null;
          const sub = daySubtotals[dia.id];
          return (
            <div key={dia.id} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Badge style={{ backgroundColor: dia.color, color: getTextColor(dia.color) }} className="text-sm px-3 py-1">
                  {dia.label}
                </Badge>
                {sub && (
                  <span className="text-xs text-muted-foreground">
                    Previsto: {formatDuration(sub.previsto)} | Real: {formatDuration(sub.real)} |
                    <span className={sub.real - sub.previsto > 0 ? " text-red-400" : " text-green-400"}>
                      {" "}Diff: {sub.real - sub.previsto > 0 ? "+" : ""}{sub.real - sub.previsto}min
                    </span>
                  </span>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Ord</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead className="w-20">Tipo</TableHead>
                    <TableHead className="w-24">Local</TableHead>
                    <TableHead className="w-16">H.Prev</TableHead>
                    <TableHead className="w-16">H.Real I</TableHead>
                    <TableHead className="w-16">H.Real F</TableHead>
                    <TableHead className="w-16">T.Prev</TableHead>
                    <TableHead className="w-16">T.Real</TableHead>
                    <TableHead className="w-20">Diferença</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayActs.map(a => {
                    const d = getDiffLabel(a);
                    const isPulada = a.status_execucao === "pulada";
                    const isPendente = !a.status_execucao || a.status_execucao === "pendente";
                    return (
                      <TableRow key={a.id} className={isPulada ? "opacity-50" : isPendente ? "text-muted-foreground" : ""}>
                        <TableCell>{a.ordem}</TableCell>
                        <TableCell className={isPulada ? "line-through" : ""}>{a.titulo}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{a.tipo}</Badge></TableCell>
                        <TableCell className="text-xs">{a.local ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{formatTime(a.horario_inicio)}–{formatTime(a.horario_fim)}</TableCell>
                        <TableCell className="font-mono text-xs">{formatTimestamp(a.horario_inicio_real)}</TableCell>
                        <TableCell className="font-mono text-xs">{formatTimestamp(a.horario_fim_real)}</TableCell>
                        <TableCell className="text-xs">{a.tempo_previsto_min != null ? `${a.tempo_previsto_min}min` : "—"}</TableCell>
                        <TableCell className="text-xs">{a.tempo_real_min != null ? `${a.tempo_real_min}min` : "—"}</TableCell>
                        <TableCell className={`text-xs font-medium ${d.color}`}>{d.text}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status_execucao} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          );
        })}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-2">
        {filtradas.map(a => {
          const d = getDiffLabel(a);
          const isPulada = a.status_execucao === "pulada";
          return (
            <Card key={a.id} className={isPulada ? "opacity-50" : ""}>
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-sm ${isPulada ? "line-through" : ""}`}>{a.titulo}</span>
                  <StatusBadge status={a.status_execucao} />
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{a.dia}</Badge>
                  <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                  <div><span className="text-muted-foreground">Previsto:</span> {a.tempo_previsto_min != null ? `${a.tempo_previsto_min}min` : "—"}</div>
                  <div><span className="text-muted-foreground">Real:</span> {a.tempo_real_min != null ? `${a.tempo_real_min}min` : "—"}</div>
                  <div className={`font-medium ${d.color}`}>{d.text}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary by Type */}
      {resumoTipo.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-2">📈 Resumo por Tipo</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-16">Qtd</TableHead>
                <TableHead className="w-24">T. Previsto</TableHead>
                <TableHead className="w-24">T. Real</TableHead>
                <TableHead className="w-24">Diff Média</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoTipo.map(r => (
                <TableRow key={r.tipo}>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell>{r.qtd}</TableCell>
                  <TableCell>{formatDuration(r.previsto)}</TableCell>
                  <TableCell>{formatDuration(r.real)}</TableCell>
                  <TableCell className={r.diffMedia > 0 ? "text-red-400" : r.diffMedia < 0 ? "text-green-400" : ""}>
                    {r.diffMedia > 0 ? "+" : ""}{r.diffMedia}min
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Insights */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold">💡 Insights</h3>
        <div className="space-y-1 text-sm">
          {insights.maiorAtraso && (
            <p className="text-red-400">⚠️ Maior atraso: <strong>{insights.maiorAtraso.titulo}</strong> (+{insights.maxDiff}min)</p>
          )}
          {insights.bestDay && (
            <p className="text-green-400">🏆 Melhor pontualidade: <strong>{insights.bestDay}</strong> ({insights.bestPct}%)</p>
          )}
          {insights.topType && (
            <p className="text-muted-foreground">
              📊 {insights.topType[0]} tiveram em média {insights.topType[1].count > 0 ? (Math.round(insights.topType[1].sum / insights.topType[1].count) > 0 ? "+" : "") + Math.round(insights.topType[1].sum / insights.topType[1].count) : 0}min de diferença
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, className }: { label: string; value: string | number; icon?: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4 flex flex-col items-center text-center gap-1">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "pendente";
  if (s === "concluida") return <Badge className="bg-green-500/20 text-green-400 text-[10px]">✅ Concluída</Badge>;
  if (s === "pulada") return <Badge className="bg-muted text-muted-foreground text-[10px]">⏭️ Pulada</Badge>;
  if (s === "em_andamento") return <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">🔄 Em andamento</Badge>;
  return <Badge variant="outline" className="text-[10px]">⏳ Pendente</Badge>;
}
