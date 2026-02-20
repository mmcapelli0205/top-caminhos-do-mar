import { useState, useEffect } from "react";
import { CheckCircle, ChevronRight, Bus, Car, Loader2, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF } from "@/lib/cpf";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AREAS = [
  "ADM", "Comunicação", "Diretoria", "DOC", "Eventos",
  "Hakuna", "Intercessão", "Logística", "Louvor", "Mídia",
  "Segurança", "Voz",
];

type Servidor = {
  id: string;
  nome: string;
  cpf: string | null;
  cargo_area: string | null;
};

type Etapa = "area" | "nome" | "cpf" | "sucesso";

export default function CheckinServidor() {
  const [etapa, setEtapa] = useState<Etapa>("area");
  const [areaSelecionada, setAreaSelecionada] = useState<string>("");
  const [servidorSelecionado, setServidorSelecionado] = useState<Servidor | null>(null);
  const [cpf, setCpf] = useState("");
  const [transporte, setTransporte] = useState<"onibus" | "proprio">("onibus");
  const [erroMsg, setErroMsg] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loadingServidores, setLoadingServidores] = useState(false);
  const [horarioAbertura, setHorarioAbertura] = useState<string | null>(null);
  const [checkinLiberado, setCheckinLiberado] = useState<boolean | null>(null);
  const [checkinHorario, setCheckinHorario] = useState<string>("");
  const [topId, setTopId] = useState<string | null>(null);

  // Buscar configuração e top_id
  useEffect(() => {
    async function init() {
      // Buscar top ativo
      const { data: tops } = await supabase
        .from("tops")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const tId = tops?.id ?? null;
      setTopId(tId);

      // Buscar horário de check-in
      let query = supabase.from("checkin_config").select("horario_checkin_servidores");
      if (tId) query = query.eq("top_id", tId);
      const { data: config } = await query.maybeSingle();

      const horario = config?.horario_checkin_servidores ?? "14:00:00";
      const [h, m] = horario.split(":");
      setHorarioAbertura(`${h}:${m}`);

      const agora = new Date();
      const abertura = new Date();
      abertura.setHours(parseInt(h), parseInt(m), 0, 0);
      setCheckinLiberado(agora >= abertura);
    }
    init();
  }, []);

  // Buscar servidores ao selecionar área
  useEffect(() => {
    if (!areaSelecionada) return;
    setLoadingServidores(true);
    async function fetchServidores() {
      // Servidores da área
      const { data: all } = await supabase
        .from("servidores")
        .select("id, nome, cpf, cargo_area")
        .eq("area_servico", areaSelecionada)
        .eq("status", "ativo")
        .order("nome");

      // Quem já fez check-in
      let csQuery = supabase
        .from("checkin_servidores")
        .select("servidor_id")
        .eq("area_servico", areaSelecionada)
        .eq("status", "checkin");
      if (topId) csQuery = csQuery.eq("top_id", topId);
      const { data: jaFeitos } = await csQuery;

      const jaFeitosIds = new Set((jaFeitos ?? []).map((j) => j.servidor_id));
      const disponiveis = (all ?? []).filter((s) => !jaFeitosIds.has(s.id));
      setServidores(disponiveis);
      setLoadingServidores(false);
    }
    fetchServidores();
  }, [areaSelecionada, topId]);

  function handleAreaSelect(area: string) {
    setAreaSelecionada(area);
    setServidorSelecionado(null);
    setCpf("");
    setErroMsg("");
    setEtapa("nome");
  }

  function handleNomeSelect(servidor: Servidor) {
    setServidorSelecionado(servidor);
    setCpf("");
    setErroMsg("");
    setEtapa("cpf");
  }

  async function handleConfirmar() {
    if (!servidorSelecionado) return;
    setErroMsg("");

    const cpfDigits = cpf.replace(/\D/g, "");
    const cpfServidor = (servidorSelecionado.cpf ?? "").replace(/\D/g, "");

    if (!cpfDigits) { setErroMsg("Informe o CPF."); return; }
    if (cpfDigits !== cpfServidor) {
      setErroMsg("CPF não confere com o servidor selecionado.");
      return;
    }

    setLoadingSubmit(true);
    const agora = new Date().toISOString();

    const { error } = await supabase.from("checkin_servidores").insert({
      servidor_id: servidorSelecionado.id,
      servidor_nome: servidorSelecionado.nome,
      area_servico: areaSelecionada,
      cargo: servidorSelecionado.cargo_area,
      cpf: cpfDigits,
      transporte,
      status: "checkin",
      checkin_em: agora,
      top_id: topId,
    });

    setLoadingSubmit(false);

    if (error) {
      if (error.code === "23505") {
        setErroMsg("Este servidor já realizou check-in.");
      } else {
        setErroMsg("Erro ao registrar check-in. Tente novamente.");
      }
      return;
    }

    setCheckinHorario(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    setEtapa("sucesso");
  }

  function reiniciar() {
    setEtapa("area");
    setAreaSelecionada("");
    setServidorSelecionado(null);
    setCpf("");
    setErroMsg("");
    setTransporte("onibus");
  }

  // Loading inicial
  if (checkinLiberado === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Bloqueado por horário
  if (!checkinLiberado) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Clock className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Check-in dos Servidores</h1>
        <p className="text-muted-foreground text-lg">
          Check-in abre às <span className="text-primary font-bold">{horarioAbertura}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          {etapa !== "area" && etapa !== "sucesso" && (
            <button
              onClick={() => setEtapa(etapa === "cpf" ? "nome" : "area")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">Check-in de Servidores</h1>
            <p className="text-xs text-muted-foreground">TOP Caminhos do Mar</p>
          </div>
        </div>
        {/* Stepper */}
        {etapa !== "sucesso" && (
          <div className="flex gap-1 mt-3 max-w-md mx-auto">
            {(["area", "nome", "cpf"] as const).map((e, i) => (
              <div
                key={e}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  etapa === e
                    ? "bg-primary"
                    : i < ["area", "nome", "cpf"].indexOf(etapa)
                    ? "bg-primary/50"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">

        {/* ETAPA 1 — Área */}
        {etapa === "area" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Selecione sua área</h2>
              <p className="text-sm text-muted-foreground">Em qual área você serve?</p>
            </div>
            <div className="grid gap-2">
              {AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaSelect(area)}
                  className="flex items-center justify-between w-full bg-card border border-border hover:border-primary hover:bg-accent rounded-lg px-4 py-3 text-left transition-all"
                >
                  <span className="font-medium text-foreground">{area}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 2 — Nome */}
        {etapa === "nome" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wider">{areaSelecionada}</p>
              <h2 className="text-lg font-semibold text-foreground">Selecione seu nome</h2>
              <p className="text-sm text-muted-foreground">Apenas servidores que ainda não fizeram check-in aparecem.</p>
            </div>
            {loadingServidores ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : servidores.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">Todos os servidores desta área já realizaram check-in! 🎉</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {servidores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleNomeSelect(s)}
                    className="flex items-center justify-between w-full bg-card border border-border hover:border-primary hover:bg-accent rounded-lg px-4 py-3 text-left transition-all"
                  >
                    <div>
                      <span className="font-medium text-foreground">{s.nome}</span>
                      {s.cargo_area && <p className="text-xs text-muted-foreground">{s.cargo_area}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ETAPA 3 — CPF + Transporte */}
        {etapa === "cpf" && servidorSelecionado && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wider">{areaSelecionada}</p>
              <h2 className="text-lg font-semibold text-foreground">Confirmar identidade</h2>
              <p className="text-base text-foreground/80 font-medium">{servidorSelecionado.nome}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-foreground">CPF</Label>
              <Input
                id="cpf"
                type="tel"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(maskCPF(e.target.value));
                  setErroMsg("");
                }}
                className="text-lg h-12"
                maxLength={14}
              />
              {erroMsg && (
                <p className="text-destructive text-sm">{erroMsg}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-foreground">Como vai vir ao TOP?</Label>
              <RadioGroup
                value={transporte}
                onValueChange={(v) => setTransporte(v as "onibus" | "proprio")}
                className="gap-3"
              >
                <div
                  className={cn(
                    "flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all",
                    transporte === "onibus" ? "border-primary bg-accent" : "border-border bg-card"
                  )}
                  onClick={() => setTransporte("onibus")}
                >
                  <RadioGroupItem value="onibus" id="onibus" />
                  <Label htmlFor="onibus" className="cursor-pointer flex items-center gap-2">
                    <Bus className="h-4 w-4 text-primary" />
                    Ônibus dos Legendários
                  </Label>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all",
                    transporte === "proprio" ? "border-primary bg-accent" : "border-border bg-card"
                  )}
                  onClick={() => setTransporte("proprio")}
                >
                  <RadioGroupItem value="proprio" id="proprio" />
                  <Label htmlFor="proprio" className="cursor-pointer flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Transporte Próprio
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              className="w-full h-12 text-base"
              onClick={handleConfirmar}
              disabled={loadingSubmit || !cpf}
            >
              {loadingSubmit ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registrando...</>
              ) : (
                "Confirmar Check-in"
              )}
            </Button>
          </div>
        )}

        {/* SUCESSO */}
        {etapa === "sucesso" && servidorSelecionado && (
          <div className="flex flex-col items-center text-center space-y-6 animate-fade-in pt-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Check-in realizado!</h2>
              <p className="text-muted-foreground mt-1">Que Deus te abençoe neste TOP!</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 w-full text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Nome</span>
                <span className="text-foreground font-medium">{servidorSelecionado.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Área</span>
                <span className="text-foreground font-medium">{areaSelecionada}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Transporte</span>
                <span className="text-foreground font-medium">
                  {transporte === "onibus" ? "Ônibus dos Legendários" : "Transporte Próprio"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Horário</span>
                <span className="text-primary font-bold">{checkinHorario}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={reiniciar}>
              Novo Check-in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
