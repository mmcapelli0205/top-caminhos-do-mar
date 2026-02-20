import { useState, useEffect } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  topId: string | null;
}

export function CheckinConfigSection({ topId }: Props) {
  const { toast } = useToast();
  const [horarioServidores, setHorarioServidores] = useState("14:00");
  const [horarioParticipantes, setHorarioParticipantes] = useState("16:00");
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      let query = supabase.from("checkin_config").select("*");
      if (topId) query = query.eq("top_id", topId);
      const { data } = await query.maybeSingle();
      if (data) {
        setConfigId(data.id);
        const hs = data.horario_checkin_servidores ?? "14:00:00";
        const hp = data.horario_checkin_participantes ?? "16:00:00";
        setHorarioServidores(hs.slice(0, 5));
        setHorarioParticipantes(hp.slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, [topId]);

  async function salvar() {
    setSaving(true);
    const payload = {
      horario_checkin_servidores: horarioServidores + ":00",
      horario_checkin_participantes: horarioParticipantes + ":00",
      top_id: topId,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (configId) {
      ({ error } = await supabase.from("checkin_config").update(payload).eq("id", configId));
    } else {
      const { error: err, data } = await supabase.from("checkin_config").insert(payload).select().single();
      error = err;
      if (data) setConfigId(data.id);
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Horários salvos!", description: "Configuração atualizada com sucesso." });
    }
  }

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Configuração de Horários</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm">Início check-in dos servidores</Label>
          <Input
            type="time"
            value={horarioServidores}
            onChange={(e) => setHorarioServidores(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">QR Code libera a partir desse horário</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Horário check-in dos participantes</Label>
          <Input
            type="time"
            value={horarioParticipantes}
            onChange={(e) => setHorarioParticipantes(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">30 min antes: nomes pendentes começam a piscar</p>
        </div>
      </div>
      <Button onClick={salvar} disabled={saving} size="sm">
        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
        Salvar Horários
      </Button>
    </div>
  );
}
