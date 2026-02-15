import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  areaId: string;
}

interface Etapa {
  id: string;
  numero: number;
  nome: string;
  descricao: string | null;
  status: string;
  concluida: boolean | null;
  data_prevista: string | null;
  data_conclusao: string | null;
  responsavel_nome: string | null;
  observacao: string | null;
}

type DerivedStatus = "concluida" | "em_andamento" | "atrasada" | "pendente";

function deriveStatus(etapa: Etapa): DerivedStatus {
  if (etapa.concluida || etapa.status === "concluida") return "concluida";
  if (
    etapa.data_prevista &&
    new Date(etapa.data_prevista) < new Date(new Date().toDateString()) &&
    etapa.status !== "concluida"
  )
    return "atrasada";
  if (etapa.status === "em_andamento") return "em_andamento";
  return "pendente";
}

const STATUS_CONFIG: Record<DerivedStatus, { label: string; color: string; bg: string; border: string; badgeClass: string }> = {
  concluida: { label: "✅ Concluída", color: "text-green-400", bg: "bg-green-500", border: "border-green-500", badgeClass: "bg-green-500/20 text-green-400 border-green-500/30" },
  em_andamento: { label: "🔄 Em Andamento", color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500", badgeClass: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  pendente: { label: "⏳ Pendente", color: "text-muted-foreground", bg: "bg-muted", border: "border-muted", badgeClass: "bg-muted text-muted-foreground" },
  atrasada: { label: "🔴 Atrasada", color: "text-red-400", bg: "bg-red-500", border: "border-red-500", badgeClass: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export default function HomologacaoTimeline({ areaId }: Props) {
  const queryClient = useQueryClient();
  const { profile, role } = useAuth();
  const notifiedRef = useRef(false);

  const canEdit = role === "diretoria" || profile?.area_preferencia === "ADM";

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["homologacao-etapas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homologacao_etapas")
        .select("id, numero, nome, descricao, status, concluida, data_prevista, data_conclusao, responsavel_nome, observacao")
        .order("numero");
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const concluidas = etapas.filter((e) => deriveStatus(e) === "concluida").length;
  const total = etapas.length || 12;
  const pct = Math.round((concluidas / total) * 100);

  // Auto-notify delayed stages
  useEffect(() => {
    if (notifiedRef.current || etapas.length === 0 || !areaId) return;
    notifiedRef.current = true;

    const atrasadas = etapas.filter((e) => deriveStatus(e) === "atrasada");
    if (atrasadas.length === 0) return;

    (async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const etapa of atrasadas) {
        const titulo = `⚠️ Etapa Atrasada: ${etapa.nome}`;
        const { data: existing } = await supabase
          .from("area_avisos")
          .select("id")
          .eq("area_id", areaId)
          .eq("titulo", titulo)
          .gte("created_at", sevenDaysAgo.toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue;

        await supabase.from("area_avisos").insert({
          area_id: areaId,
          titulo,
          conteudo: `A etapa '${etapa.nome}' está atrasada desde ${etapa.data_prevista ? format(new Date(etapa.data_prevista), "dd/MM/yyyy", { locale: ptBR }) : "data não definida"}. Responsável: ${etapa.responsavel_nome || "Não definido"}.`,
          fixado: false,
        });
      }
    })();
  }, [etapas, areaId]);

  const updateField = async (id: string, field: string, value: unknown) => {
    const { error } = await supabase
      .from("homologacao_etapas")
      .update({ [field]: value, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq("id", id);
    if (error) {
      toast.error("Erro ao salvar");
    } else {
      queryClient.invalidateQueries({ queryKey: ["homologacao-etapas"] });
    }
  };

  const handleComplete = async (id: string, checked: boolean) => {
    const updates: Record<string, unknown> = checked
      ? { status: "concluida", concluida: true, data_conclusao: new Date().toISOString().split("T")[0], updated_at: new Date().toISOString() }
      : { status: "pendente", concluida: false, data_conclusao: null, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("homologacao_etapas").update(updates).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success(checked ? "Etapa concluída!" : "Etapa reaberta");
      queryClient.invalidateQueries({ queryKey: ["homologacao-etapas"] });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando etapas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Homologação da Pista</CardTitle>
          <p className="text-sm text-muted-foreground">{concluidas} de {total} etapas concluídas</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress
              value={pct}
              className="flex-1 h-3 [&>div]:bg-orange-500 [&>div]:transition-all [&>div]:duration-500"
            />
            <span className="text-sm font-bold text-orange-400 min-w-[40px]">{pct}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {etapas.map((etapa, idx) => {
          const status = deriveStatus(etapa);
          const cfg = STATUS_CONFIG[status];
          const isLast = idx === etapas.length - 1;
          const pulse = status === "em_andamento" || status === "atrasada";

          return (
            <div key={etapa.id} className="flex gap-3 md:gap-5">
              {/* Circle + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative flex items-center justify-center h-8 w-8 md:h-10 md:w-10 rounded-full border-2 ${cfg.border} ${cfg.bg} text-white text-sm font-bold shrink-0 ${pulse ? "animate-pulse" : ""} transition-all duration-300`}
                >
                  {status === "concluida" ? (
                    <Check className="h-4 w-4 md:h-5 md:w-5" />
                  ) : status === "em_andamento" ? (
                    <Clock className="h-4 w-4 md:h-5 md:w-5" />
                  ) : status === "atrasada" ? (
                    <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <span className="text-xs md:text-sm">{etapa.numero}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[20px] ${status === "concluida" ? "bg-green-500" : "bg-muted"} transition-all duration-300`}
                  />
                )}
              </div>

              {/* Card */}
              <Card className={`flex-1 mb-4 ${status === "concluida" ? "border-green-500/30" : status === "atrasada" ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base md:text-lg">{etapa.nome}</span>
                    <Badge variant="outline" className={cfg.badgeClass}>{cfg.label}</Badge>
                  </div>

                  {etapa.descricao && (
                    <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
                  )}

                  {canEdit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="text-xs text-muted-foreground">Responsável</label>
                        <Input
                          defaultValue={etapa.responsavel_nome ?? ""}
                          placeholder="Nome do responsável"
                          className="h-8 text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== (etapa.responsavel_nome ?? ""))
                              updateField(etapa.id, "responsavel_nome", e.target.value || null);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Data Prevista</label>
                        <Input
                          type="date"
                          defaultValue={etapa.data_prevista ?? ""}
                          className="h-8 text-sm"
                          onChange={(e) => updateField(etapa.id, "data_prevista", e.target.value || null)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Data Conclusão</label>
                        <Input
                          type="date"
                          defaultValue={etapa.data_conclusao ?? ""}
                          className="h-8 text-sm"
                          onChange={(e) => updateField(etapa.id, "data_conclusao", e.target.value || null)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs text-muted-foreground">Observação</label>
                        <Textarea
                          defaultValue={etapa.observacao ?? ""}
                          placeholder="Observações..."
                          className="min-h-[50px] text-sm"
                          onBlur={(e) => {
                            if (e.target.value !== (etapa.observacao ?? ""))
                              updateField(etapa.id, "observacao", e.target.value || null);
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Checkbox
                          checked={status === "concluida"}
                          onCheckedChange={(checked) => handleComplete(etapa.id, !!checked)}
                        />
                        <span className="text-sm">Marcar como concluída</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {etapa.responsavel_nome && (
                        <p><span className="text-muted-foreground">Responsável:</span> {etapa.responsavel_nome}</p>
                      )}
                      {etapa.data_prevista && (
                        <p><span className="text-muted-foreground">Prevista:</span> {format(new Date(etapa.data_prevista), "dd/MM/yyyy")}</p>
                      )}
                      {etapa.data_conclusao && (
                        <p><span className="text-muted-foreground">Concluída em:</span> {format(new Date(etapa.data_conclusao), "dd/MM/yyyy")}</p>
                      )}
                      {etapa.observacao && (
                        <p className="md:col-span-2"><span className="text-muted-foreground">Obs:</span> {etapa.observacao}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
