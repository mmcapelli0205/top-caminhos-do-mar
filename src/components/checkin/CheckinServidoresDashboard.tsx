import { useState, useEffect, useCallback } from "react";
import { Users, CheckCircle2, Clock, Bus, Car, AlertTriangle, ChevronDown, ChevronUp, Loader2, Strikethrough } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { CheckinConfigSection } from "./CheckinConfigSection";
import { CheckinQrCodeCartaz } from "./CheckinQrCodeCartaz";

const AREAS = [
  "ADM", "Comunicação", "Diretoria", "DOC", "Eventos",
  "Hakuna", "Intercessão", "Logística", "Louvor", "Mídia",
  "Segurança", "Voz",
];

type ServidorDB = {
  id: string;
  nome: string;
  area_servico: string | null;
};

type CheckinRecord = {
  id: string;
  servidor_id: string | null;
  servidor_nome: string | null;
  area_servico: string | null;
  transporte: string | null;
  status: string | null;
  checkin_em: string | null;
  desistencia_por: string | null;
  desistencia_por_nome: string | null;
};

interface Props {
  topId: string | null;
  userId: string;
  userEmail: string;
  isAdmin: boolean;
}

export function CheckinServidoresDashboard({ topId, userId, userEmail, isAdmin }: Props) {
  const { toast } = useToast();
  const [servidores, setServidores] = useState<ServidorDB[]>([]);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [config, setConfig] = useState<{ horario_checkin_participantes?: string | null } | null>(null);
  const [areasAbertas, setAreasAbertas] = useState<Set<string>>(new Set(AREAS));
  const [loading, setLoading] = useState(true);
  const [alertaAtivo, setAlertaAtivo] = useState(false);

  const carregar = useCallback(async () => {
    const [{ data: srvs }, { data: cks }, { data: cfg }] = await Promise.all([
      supabase.from("servidores").select("id, nome, area_servico").eq("status", "ativo"),
      topId
        ? supabase.from("checkin_servidores").select("*").eq("top_id", topId)
        : supabase.from("checkin_servidores").select("*"),
      topId
        ? supabase.from("checkin_config").select("horario_checkin_participantes").eq("top_id", topId).maybeSingle()
        : supabase.from("checkin_config").select("horario_checkin_participantes").maybeSingle(),
    ]);

    setServidores((srvs ?? []) as ServidorDB[]);
    setCheckins((cks ?? []) as CheckinRecord[]);
    setConfig(cfg);

    // Alerta 30 min antes dos participantes
    if (cfg?.horario_checkin_participantes) {
      const [h, m] = cfg.horario_checkin_participantes.split(":");
      const alertaEm = new Date();
      alertaEm.setHours(parseInt(h), parseInt(m) - 30, 0, 0);
      setAlertaAtivo(new Date() >= alertaEm);
    }

    setLoading(false);
  }, [topId]);

  useEffect(() => {
    carregar();
    // Recarregar a cada 30s
    const interval = setInterval(carregar, 30000);
    return () => clearInterval(interval);
  }, [carregar]);

  async function marcarDesistencia(servidor: ServidorDB) {
    const checkin = checkins.find((c) => c.servidor_id === servidor.id && c.status !== "desistencia");
    const { error } = await supabase
      .from("checkin_servidores")
      .upsert({
        servidor_id: servidor.id,
        servidor_nome: servidor.nome,
        area_servico: servidor.area_servico,
        status: "desistencia",
        desistencia_em: new Date().toISOString(),
        desistencia_por: userId,
        desistencia_por_nome: userEmail,
        top_id: topId,
        ...(checkin ? {} : { checkin_em: new Date().toISOString() }),
      }, { onConflict: checkin ? "id" : "servidor_id,top_id" });

    if (error) {
      // Try update if upsert fails
      if (checkin?.id) {
        await supabase.from("checkin_servidores").update({
          status: "desistencia",
          desistencia_em: new Date().toISOString(),
          desistencia_por: userId,
          desistencia_por_nome: userEmail,
        }).eq("id", checkin.id);
      } else {
        await supabase.from("checkin_servidores").insert({
          servidor_id: servidor.id,
          servidor_nome: servidor.nome,
          area_servico: servidor.area_servico,
          status: "desistencia",
          desistencia_em: new Date().toISOString(),
          desistencia_por: userId,
          desistencia_por_nome: userEmail,
          top_id: topId,
          checkin_em: new Date().toISOString(),
        });
      }
    }

    toast({ title: `${servidor.nome} marcado como desistente.` });
    carregar();
  }

  // Totais
  const totalServidores = servidores.length;
  const checkinFeitos = checkins.filter((c) => c.status === "checkin").length;
  const desistencias = checkins.filter((c) => c.status === "desistencia").length;
  const aguardando = totalServidores - checkinFeitos - desistencias;
  const onibus = checkins.filter((c) => c.status === "checkin" && c.transporte === "onibus").length;
  const proprio = checkins.filter((c) => c.status === "checkin" && c.transporte === "proprio").length;

  // Faltantes globais para banner
  const faltantes = servidores.filter((s) => {
    const ck = checkins.find((c) => c.servidor_id === s.id);
    return !ck || ck.status === "desistencia";
  });

  function toggleArea(area: string) {
    setAreasAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: totalServidores, icon: Users, cls: "text-foreground" },
          { label: "Check-in", value: checkinFeitos, icon: CheckCircle2, cls: "text-primary" },
          { label: "Aguardando", value: aguardando, icon: Clock, cls: "text-yellow-400" },
          { label: "Desistências", value: desistencias, icon: Strikethrough, cls: "text-destructive" },
          { label: "Ônibus", value: onibus, icon: Bus, cls: "text-blue-400" },
          { label: "Transp. Próprio", value: proprio, icon: Car, cls: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
            <Icon className={cn("h-4 w-4 mx-auto mb-1", cls)} />
            <p className={cn("text-xl font-bold", cls)}>{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Banner de alerta */}
      {alertaAtivo && faltantes.length > 0 && (
        <div className="bg-destructive/15 border border-destructive/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="font-semibold text-destructive text-sm">
              ⚠️ {faltantes.length} servidor{faltantes.length !== 1 ? "es" : ""} ainda não realizou{faltantes.length !== 1 ? "am" : ""} check-in!
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {faltantes.slice(0, 5).map((s) => s.nome).join(", ")}
            {faltantes.length > 5 && ` e mais ${faltantes.length - 5}...`}
          </p>
        </div>
      )}

      {/* Config e QR */}
      {isAdmin && (
        <div className="grid gap-3 md:grid-cols-2">
          <CheckinConfigSection topId={topId} />
          <CheckinQrCodeCartaz />
        </div>
      )}

      {/* Botão atualizar */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={carregar}>
          Atualizar
        </Button>
      </div>

      {/* Lista por área */}
      <div className="space-y-3">
        {AREAS.map((area) => {
          const servsArea = servidores.filter((s) => s.area_servico === area);
          if (servsArea.length === 0) return null;

          const cksArea = checkins.filter((c) => c.area_servico === area);
          const feitos = cksArea.filter((c) => c.status === "checkin").length;
          const aberta = areasAbertas.has(area);

          // Ordenar: pendentes primeiro, depois realizados por horário
          const servsOrdenados = [...servsArea].sort((a, b) => {
            const ckA = cksArea.find((c) => c.servidor_id === a.id);
            const ckB = cksArea.find((c) => c.servidor_id === b.id);
            const feizA = ckA?.status === "checkin";
            const feizB = ckB?.status === "checkin";
            if (feizA !== feizB) return feizA ? 1 : -1;
            if (feizA && feizB) {
              return (ckA?.checkin_em ?? "").localeCompare(ckB?.checkin_em ?? "");
            }
            return a.nome.localeCompare(b.nome);
          });

          return (
            <div key={area} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => toggleArea(area)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground uppercase text-sm tracking-wide">{area}</span>
                  <span className="text-xs text-muted-foreground">
                    {feitos} de {servsArea.length} chegaram
                  </span>
                  {feitos === servsArea.length && servsArea.length > 0 && (
                    <span className="text-xs text-primary">✓ Todos!</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(servsArea.length, 8) }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < feitos ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                    {servsArea.length > 8 && <span className="text-xs text-muted-foreground ml-1">+{servsArea.length - 8}</span>}
                  </div>
                  {aberta ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {aberta && (
                <div className="border-t border-border divide-y divide-border">
                  {servsOrdenados.map((servidor) => {
                    const ck = cksArea.find((c) => c.servidor_id === servidor.id);
                    const fez = ck?.status === "checkin";
                    const desistiu = ck?.status === "desistencia";
                    const pendente = !fez && !desistiu;
                    const piscando = alertaAtivo && pendente;

                    return (
                      <div
                        key={servidor.id}
                        className="flex items-center justify-between px-4 py-2.5 gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {fez ? (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                          )}
                          <span
                            className={cn(
                              "text-sm truncate transition-all",
                              fez && "text-foreground font-medium",
                              pendente && !piscando && "text-muted-foreground",
                              desistiu && "text-muted-foreground line-through",
                              piscando && "animate-pulse text-destructive font-medium"
                            )}
                          >
                            {servidor.nome}
                          </span>
                          {desistiu && (
                            <span className="text-xs bg-destructive/20 text-destructive border border-destructive/30 rounded px-1.5 py-0.5 flex-shrink-0">DESISTIU</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {fez && ck?.checkin_em && (
                            <>
                              <span className="text-xs text-primary font-mono">
                                {new Date(ck.checkin_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {ck.transporte === "onibus" ? "🚌" : "🚗"}
                              </span>
                            </>
                          )}
                          {isAdmin && (pendente || desistiu) && !fez && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="h-6 text-xs px-2 py-0">
                                  Desistiu
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Marcar como desistente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Marcar <strong>{servidor.nome}</strong> como desistente? Esta ação pode ser revertida manualmente pelo banco.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() => marcarDesistencia(servidor)}
                                  >
                                    Confirmar Desistência
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
