import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Radio,
  ArrowLeft,
  CheckCircle2,
  Circle,
  SkipForward,
  Clock,
  Play,
  Square,
} from "lucide-react";
import { toast } from "sonner";

type Atividade = {
  id: string;
  titulo: string;
  tipo: string;
  dia: string;
  ordem: number;
  horario_inicio: string | null;
  horario_fim: string | null;
  local: string | null;
  tempo_previsto_min: number | null;
  horario_inicio_real: string | null;
  horario_fim_real: string | null;
  tempo_real_min: number | null;
  status_execucao: string | null;
  observacao_execucao: string | null;
  cronograma_tipo: string | null;
};

const DAY_COLORS: Record<string, string> = {
  D1: "#F97316",
  D2: "#3B82F6",
  D3: "#22C55E",
  D4: "#EAB308",
};

const TIPO_COLORS: Record<string, string> = {
  trilha: "bg-green-600",
  predica: "bg-purple-600",
  instrucao: "bg-blue-600",
  refeicao: "bg-orange-500",
  logistica: "bg-gray-500",
  intervalo: "bg-slate-400",
  dinamica: "bg-pink-500",
  oracao: "bg-indigo-500",
};

function timeToToday(timeStr: string | null): Date | null {
  if (!timeStr) return null;
  const [h, m, s] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, s || 0, 0);
  return d;
}

function formatTimer(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const min = Math.floor((abs % 3600) / 60);
  const sec = abs % 60;
  const sign = seconds < 0 ? "-" : "";
  if (h > 0) return `${sign}${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${sign}${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "--:--";
  return timeStr.slice(0, 5);
}

const TopRealTime = () => {
  const { profile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [diaSelecionado, setDiaSelecionado] = useState("D1");
  const [now, setNow] = useState(new Date());
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [skipObservacao, setSkipObservacao] = useState("");
  const [skipAtividadeId, setSkipAtividadeId] = useState<string | null>(null);

  // Permission check
  const isDiretoria = role === "diretoria";
  const userCargo = profile?.cargo;

  const { data: servidor } = useQuery({
    queryKey: ["servidor-by-email", profile?.email],
    queryFn: async () => {
      if (!profile?.email) return null;
      const { data } = await supabase
        .from("servidores")
        .select("id, area_servico, cargo_area")
        .eq("email", profile.email)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  const { data: coordAreas } = useQuery({
    queryKey: ["areas-coord", servidor?.id],
    queryFn: async () => {
      if (!servidor?.id) return [];
      const { data } = await supabase
        .from("areas")
        .select("id, nome, coordenador_id")
        .or(
          `coordenador_id.eq.${servidor.id},coordenador_02_id.eq.${servidor.id},coordenador_03_id.eq.${servidor.id}`
        );
      return data || [];
    },
    enabled: !!servidor?.id,
  });

  const isAdmCoord = servidor?.area_servico === "ADM" &&
    (servidor?.cargo_area?.toLowerCase().includes("coordenador") || servidor?.cargo_area?.toLowerCase().includes("coord"));
  const isCoord01 = (coordAreas?.length ?? 0) > 0;
  const canControl = isDiretoria || isAdmCoord;
  const canView = canControl || isCoord01 ||
    userCargo === "coordenacao" || userCargo === "coord02" || userCargo === "coord03";

  // Redirect if no access
  useEffect(() => {
    if (!authLoading && !canView && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, canView, profile, navigate]);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch activities
  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ["top-realtime", diaSelecionado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cronograma_atividades")
        .select("*")
        .eq("dia", diaSelecionado)
        .eq("cronograma_tipo", "adm")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as Atividade[];
    },
    refetchInterval: 5000,
  });

  // Theoretical activity
  const atividadeTeorica = useMemo(() => {
    for (const a of atividades) {
      const start = timeToToday(a.horario_inicio);
      const end = timeToToday(a.horario_fim);
      if (start && end && now >= start && now < end) return a;
    }
    // If past all, return last
    for (let i = atividades.length - 1; i >= 0; i--) {
      const end = timeToToday(atividades[i].horario_fim);
      if (end && now >= end) return atividades[i];
    }
    return atividades[0] || null;
  }, [atividades, now]);

  // Real activity (em_andamento)
  const atividadeReal = useMemo(
    () => atividades.find((a) => a.status_execucao === "em_andamento") || null,
    [atividades]
  );

  // Next pending
  const proximaAtividade = useMemo(() => {
    if (atividadeReal) {
      const idx = atividades.findIndex((a) => a.id === atividadeReal.id);
      return atividades[idx + 1] || null;
    }
    return atividades.find((a) => a.status_execucao === "pendente") || null;
  }, [atividades, atividadeReal]);

  // Theoretical timer
  const timerTeorico = useMemo(() => {
    if (!atividadeTeorica) return null;
    const end = timeToToday(atividadeTeorica.horario_fim);
    if (!end) return null;
    return Math.floor((end.getTime() - now.getTime()) / 1000);
  }, [atividadeTeorica, now]);

  // Real timer
  const timerReal = useMemo(() => {
    if (!atividadeReal?.horario_inicio_real) return null;
    const start = new Date(atividadeReal.horario_inicio_real);
    return Math.floor((now.getTime() - start.getTime()) / 1000);
  }, [atividadeReal, now]);

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (!atividadeReal?.tempo_previsto_min || !timerReal) return 0;
    return Math.min((timerReal / 60 / atividadeReal.tempo_previsto_min) * 100, 150);
  }, [atividadeReal, timerReal]);

  const progressColor = progressPercent < 80 ? "bg-green-500" : progressPercent <= 100 ? "bg-yellow-500" : "bg-red-500";

  // Comparison
  const comparacao = useMemo(() => {
    if (!atividadeTeorica || !atividadeReal) return null;
    const idxTeorico = atividades.findIndex((a) => a.id === atividadeTeorica.id);
    const idxReal = atividades.findIndex((a) => a.id === atividadeReal.id);
    if (idxTeorico === -1 || idxReal === -1) return null;

    if (idxReal === idxTeorico) {
      // Same activity - compare time
      const endTeorico = timeToToday(atividadeTeorica.horario_inicio);
      const startReal = atividadeReal.horario_inicio_real ? new Date(atividadeReal.horario_inicio_real) : null;
      if (endTeorico && startReal) {
        const diffMin = Math.round((startReal.getTime() - endTeorico.getTime()) / 60000);
        if (Math.abs(diffMin) < 5) return { text: "⏱️ No horário", color: "bg-green-600", pulse: false };
        if (diffMin < 0) return { text: `⚡ Adiantado ${Math.abs(diffMin)}min`, color: "bg-green-600", pulse: false };
        return { text: `⚠️ Atrasado ${diffMin}min`, color: "bg-red-600", pulse: true };
      }
    }
    if (idxReal > idxTeorico) return { text: "⚡ Adiantado", color: "bg-green-600", pulse: false };
    const diff = idxTeorico - idxReal;
    return { text: `⚠️ Atrasado ${diff} atividade(s)`, color: "bg-red-600", pulse: true };
  }, [atividadeTeorica, atividadeReal, atividades]);

  const handleIniciar = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("cronograma_atividades")
      .update({
        horario_inicio_real: new Date().toISOString(),
        status_execucao: "em_andamento",
      })
      .eq("id", id);
    if (error) { toast.error("Erro ao iniciar"); return; }
    toast.success("Atividade iniciada!");
    queryClient.invalidateQueries({ queryKey: ["top-realtime"] });
  }, [queryClient]);

  const handleConcluir = useCallback(async (id: string) => {
    const atv = atividades.find((a) => a.id === id);
    if (!atv?.horario_inicio_real) return;
    const inicioReal = new Date(atv.horario_inicio_real);
    const tempoRealMin = Math.round((Date.now() - inicioReal.getTime()) / 60000);
    const { error } = await supabase
      .from("cronograma_atividades")
      .update({
        horario_fim_real: new Date().toISOString(),
        tempo_real_min: tempoRealMin,
        status_execucao: "concluida",
      })
      .eq("id", id);
    if (error) { toast.error("Erro ao concluir"); return; }
    toast.success("Atividade concluída!");
    queryClient.invalidateQueries({ queryKey: ["top-realtime"] });
  }, [atividades, queryClient]);

  const handlePular = useCallback(async () => {
    if (!skipAtividadeId || !skipObservacao.trim()) {
      toast.error("Observação obrigatória");
      return;
    }
    const { error } = await supabase
      .from("cronograma_atividades")
      .update({
        status_execucao: "pulada",
        observacao_execucao: skipObservacao.trim(),
      })
      .eq("id", skipAtividadeId);
    if (error) { toast.error("Erro ao pular"); return; }
    toast.success("Atividade pulada");
    setSkipDialogOpen(false);
    setSkipObservacao("");
    setSkipAtividadeId(null);
    queryClient.invalidateQueries({ queryKey: ["top-realtime"] });
  }, [skipAtividadeId, skipObservacao, queryClient]);

  const concluidas = atividades.filter((a) => a.status_execucao === "concluida").length;
  const total = atividades.length;

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-6 w-6 text-red-500" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">TOP Real Time</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Início
        </Button>
      </div>

      {/* Day selector + badge */}
      <div className="flex flex-wrap items-center gap-2">
        {(["D1", "D2", "D3", "D4"] as const).map((dia) => (
          <Button
            key={dia}
            variant={diaSelecionado === dia ? "default" : "outline"}
            size="sm"
            className="font-bold"
            style={
              diaSelecionado === dia
                ? { backgroundColor: DAY_COLORS[dia], color: "#fff", borderColor: DAY_COLORS[dia] }
                : { borderColor: DAY_COLORS[dia], color: DAY_COLORS[dia] }
            }
            onClick={() => setDiaSelecionado(dia)}
          >
            {dia}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-2">
          Atividade {concluidas} de {total}
        </Badge>
        {!canControl && (
          <Badge variant="outline" className="ml-auto text-muted-foreground">
            Modo visualização
          </Badge>
        )}
      </div>

      {/* Dual panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Theoretical */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              ⏱️ Cronograma Planejado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atividadeTeorica ? (
              <div className="space-y-3">
                <p className="text-lg font-bold text-foreground">{atividadeTeorica.titulo}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={TIPO_COLORS[atividadeTeorica.tipo] || "bg-gray-500"}>
                    {atividadeTeorica.tipo}
                  </Badge>
                  {atividadeTeorica.local && (
                    <Badge variant="outline">{atividadeTeorica.local}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatTime(atividadeTeorica.horario_inicio)} — {formatTime(atividadeTeorica.horario_fim)}
                </p>
                {timerTeorico !== null && (
                  <p className={`text-3xl font-mono font-bold ${timerTeorico < 0 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
                    {timerTeorico < 0 ? "+" : ""}{formatTimer(timerTeorico < 0 ? -timerTeorico : timerTeorico)}
                    <span className="text-sm font-sans ml-2 text-muted-foreground">
                      {timerTeorico < 0 ? "excedido" : "restante"}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma atividade no momento</p>
            )}
          </CardContent>
        </Card>

        {/* Real */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              🎯 Execução Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atividadeReal ? (
              <div className="space-y-3">
                <p className="text-lg font-bold text-foreground">{atividadeReal.titulo}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className={TIPO_COLORS[atividadeReal.tipo] || "bg-gray-500"}>
                    {atividadeReal.tipo}
                  </Badge>
                  {atividadeReal.local && (
                    <Badge variant="outline">{atividadeReal.local}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Iniciada: {atividadeReal.horario_inicio_real
                    ? new Date(atividadeReal.horario_inicio_real).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                    : "--:--"}
                </p>
                {timerReal !== null && (
                  <p className={`text-3xl font-mono font-bold ${progressPercent > 100 ? "text-red-500 animate-pulse" : "text-foreground"}`}>
                    {formatTimer(timerReal)}
                  </p>
                )}
                {atividadeReal.tempo_previsto_min && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{Math.round(Math.min(progressPercent, 100))}%</span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full transition-all rounded-full ${progressColor}`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Previsto: {atividadeReal.tempo_previsto_min}min
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma atividade em andamento</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison badge */}
      {comparacao && (
        <div className="flex justify-center">
          <Badge
            className={`text-base px-4 py-2 text-white ${comparacao.color} ${comparacao.pulse ? "animate-pulse" : ""}`}
          >
            {comparacao.text}
          </Badge>
        </div>
      )}

      {/* Controls */}
      {canControl && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {atividadeReal && (
            <Card className="border border-orange-500/30">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Atividade atual</p>
                <p className="font-semibold text-foreground">{atividadeReal.titulo}</p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1 h-12"
                    onClick={() => handleConcluir(atividadeReal.id)}
                  >
                    <Square className="h-4 w-4 mr-2" /> CONCLUIR
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12"
                    onClick={() => {
                      setSkipAtividadeId(atividadeReal.id);
                      setSkipDialogOpen(true);
                    }}
                  >
                    <SkipForward className="h-4 w-4 mr-1" /> PULAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {proximaAtividade && !atividadeReal && (
            <Card className="border border-green-500/30">
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Próxima atividade</p>
                <p className="font-semibold text-foreground">{proximaAtividade.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(proximaAtividade.horario_inicio)} — {proximaAtividade.local || ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleIniciar(proximaAtividade.id)}
                  >
                    <Play className="h-4 w-4 mr-2" /> INICIAR
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-12"
                    onClick={() => {
                      setSkipAtividadeId(proximaAtividade.id);
                      setSkipDialogOpen(true);
                    }}
                  >
                    <SkipForward className="h-4 w-4 mr-1" /> PULAR
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {proximaAtividade && atividadeReal && (
            <Card className="border border-muted">
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Próxima na fila</p>
                <p className="font-semibold text-foreground">{proximaAtividade.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(proximaAtividade.horario_inicio)} — {proximaAtividade.local || ""}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Activity list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Atividades do {diaSelecionado}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {atividades.map((a) => {
            const status = a.status_execucao || "pendente";
            const isPulada = status === "pulada";
            const isConcluida = status === "concluida";
            const isEmAndamento = status === "em_andamento";

            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 p-2 rounded-lg border ${
                  isEmAndamento ? "border-orange-500/50 bg-orange-500/5" : "border-transparent"
                } ${isPulada ? "opacity-50" : ""}`}
              >
                <div className="flex-shrink-0">
                  {isConcluida && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {isEmAndamento && <Circle className="h-5 w-5 text-orange-500 animate-pulse" />}
                  {isPulada && <SkipForward className="h-5 w-5 text-muted-foreground" />}
                  {status === "pendente" && <Clock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isPulada ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {a.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(a.horario_inicio)} — {formatTime(a.horario_fim)}
                    {a.local ? ` · ${a.local}` : ""}
                  </p>
                </div>
                {isConcluida && a.tempo_previsto_min && a.tempo_real_min !== null && (
                  <div className="text-xs text-right flex-shrink-0">
                    <span className="text-muted-foreground">{a.tempo_previsto_min}min →</span>{" "}
                    <span
                      className={
                        a.tempo_real_min! > a.tempo_previsto_min
                          ? "text-red-500 font-semibold"
                          : "text-green-500 font-semibold"
                      }
                    >
                      {a.tempo_real_min}min
                    </span>
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] flex-shrink-0 ${TIPO_COLORS[a.tipo] || ""} ${
                    TIPO_COLORS[a.tipo] ? "text-white border-transparent" : ""
                  }`}
                >
                  {a.tipo}
                </Badge>
              </div>
            );
          })}
          {atividades.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma atividade cadastrada para {diaSelecionado}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skip dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pular atividade</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Motivo para pular esta atividade (obrigatório)"
            value={skipObservacao}
            onChange={(e) => setSkipObservacao(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePular} disabled={!skipObservacao.trim()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopRealTime;
