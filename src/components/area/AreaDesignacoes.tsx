import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { TopUser } from "@/lib/auth";

type Area = Tables<"areas">;
type Designacao = Tables<"area_designacoes">;

interface Props {
  area: Area;
  canEdit: boolean;
  currentUser: TopUser | null;
}

export default function AreaDesignacoes({ area, canEdit, currentUser }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [servidorId, setServidorId] = useState("");
  const [participanteId, setParticipanteId] = useState("");
  const [tipo, setTipo] = useState("oracao");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchPart, setSearchPart] = useState("");

  const { data: servidores = [] } = useQuery({
    queryKey: ["servidores-area-desig", area.nome],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("id, nome, telefone, numero_legendario").eq("area_servico", area.nome).order("nome");
      return data ?? [];
    },
  });

  const { data: designacoes = [] } = useQuery({
    queryKey: ["area-designacoes", area.id],
    queryFn: async () => {
      const { data } = await supabase.from("area_designacoes").select("*").eq("area_id", area.id);
      return (data ?? []) as Designacao[];
    },
  });

  const { data: participantes = [] } = useQuery({
    queryKey: ["participantes-all"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  const filteredParts = searchPart
    ? participantes.filter(p => p.nome.toLowerCase().includes(searchPart.toLowerCase())).slice(0, 20)
    : participantes.slice(0, 20);

  // Group by servidor
  const grouped = servidores.map(s => ({
    ...s,
    designados: designacoes.filter(d => d.servidor_id === s.id),
  }));

  const totalDesignados = designacoes.length;
  const totalServidores = servidores.length;

  async function handleSave() {
    if (!servidorId || !participanteId) return;
    setSaving(true);
    await supabase.from("area_designacoes").insert({
      area_id: area.id, servidor_id: servidorId, participante_id: participanteId,
      tipo, observacoes: obs || null, criado_por: currentUser?.id,
    });
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["area-designacoes", area.id] });
    qc.invalidateQueries({ queryKey: ["area-designacoes-count", area.id] });
    toast.success("Participante designado!");
    setDialogOpen(false);
    setServidorId(""); setParticipanteId(""); setObs(""); setSearchPart("");
  }

  async function handleRemove(id: string) {
    await supabase.from("area_designacoes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["area-designacoes", area.id] });
    toast.success("Designação removida!");
  }

  async function handleDistribuir() {
    const designadosIds = new Set(designacoes.map(d => d.participante_id));
    const naoDesignados = participantes.filter(p => !designadosIds.has(p.id));
    if (naoDesignados.length === 0) { toast.info("Todos participantes já estão designados."); return; }
    if (servidores.length === 0) { toast.error("Nenhum servidor nesta área."); return; }

    const inserts = naoDesignados.map((p, i) => ({
      area_id: area.id,
      servidor_id: servidores[i % servidores.length].id,
      participante_id: p.id,
      tipo: "oracao",
      criado_por: currentUser?.id,
    }));

    const { error } = await supabase.from("area_designacoes").insert(inserts);
    if (error) { toast.error("Erro: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["area-designacoes", area.id] });
    toast.success(`${naoDesignados.length} participantes distribuídos!`);
  }

  function getPartName(id: string | null) {
    return participantes.find(p => p.id === id)?.nome ?? "—";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {totalDesignados} participante{totalDesignados !== 1 ? "s" : ""} designado{totalDesignados !== 1 ? "s" : ""} para {totalServidores} servidor{totalServidores !== 1 ? "es" : ""}
        </p>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDistribuir}>
              <Shuffle className="h-4 w-4 mr-1" /> Distribuir Auto
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Designar
            </Button>
          </div>
        )}
      </div>

      {grouped.map(s => (
        <Card key={s.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {s.nome}{s.numero_legendario ? ` - ${s.numero_legendario}` : ""}
              {s.telefone && <span className="text-xs text-muted-foreground font-normal">{s.telefone}</span>}
              <Badge variant="secondary" className="ml-auto">{s.designados.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {s.designados.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum participante designado.</p>
            ) : (
              <div className="space-y-1">
                {s.designados.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span>{getPartName(d.participante_id)}</span>
                      <Badge variant="outline" className="text-[10px]">{d.tipo}</Badge>
                      {d.observacoes && <span className="text-xs text-muted-foreground">— {d.observacoes}</span>}
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemove(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Designar Participante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Servidor</Label>
              <Select value={servidorId} onValueChange={setServidorId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {servidores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}{s.numero_legendario ? ` - ${s.numero_legendario}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Participante</Label>
              <Input placeholder="Buscar..." value={searchPart} onChange={e => setSearchPart(e.target.value)} className="mb-1" />
              <Select value={participanteId} onValueChange={setParticipanteId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {filteredParts.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oracao">Oração</SelectItem>
                  <SelectItem value="cuidado">Cuidado</SelectItem>
                  <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Designar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
