import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Heart, GraduationCap, Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";
import type { TopUser } from "@/lib/auth";

type Area = Tables<"areas">;
type Evento = Tables<"area_eventos">;

const TIPO_ICONS: Record<string, typeof Calendar> = {
  reuniao: Calendar,
  oracao: Heart,
  treinamento: GraduationCap,
  outro: Star,
};

interface Props {
  area: Area;
  canEdit: boolean;
  currentUser: TopUser | null;
}

export default function AreaCalendario({ area, canEdit, currentUser }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState("reuniao");
  const [saving, setSaving] = useState(false);

  const { data: eventos = [] } = useQuery({
    queryKey: ["area-eventos", area.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_eventos")
        .select("*")
        .eq("area_id", area.id)
        .order("data_inicio", { ascending: true });
      return (data ?? []) as Evento[];
    },
  });

  const now = new Date();
  const futuros = eventos.filter(e => new Date(e.data_inicio) >= now);
  const passados = eventos.filter(e => new Date(e.data_inicio) < now).reverse();

  function openNew() {
    setEditId(null); setTitulo(""); setDescricao(""); setDataInicio(""); setDataFim(""); setLocal(""); setTipo("reuniao"); setDialogOpen(true);
  }

  function openEdit(e: Evento) {
    setEditId(e.id); setTitulo(e.titulo); setDescricao(e.descricao ?? ""); 
    setDataInicio(e.data_inicio ? new Date(e.data_inicio).toISOString().slice(0, 16) : "");
    setDataFim(e.data_fim ? new Date(e.data_fim).toISOString().slice(0, 16) : "");
    setLocal(e.local ?? ""); setTipo(e.tipo ?? "reuniao"); setDialogOpen(true);
  }

  async function handleSave() {
    if (!titulo.trim() || !dataInicio) return;
    setSaving(true);
    const payload = {
      titulo, descricao: descricao || null, data_inicio: new Date(dataInicio).toISOString(),
      data_fim: dataFim ? new Date(dataFim).toISOString() : null,
      local: local || null, tipo,
    };
    if (editId) {
      await supabase.from("area_eventos").update(payload).eq("id", editId);
    } else {
      await supabase.from("area_eventos").insert({ ...payload, area_id: area.id, criado_por: currentUser?.id });
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["area-eventos", area.id] });
    qc.invalidateQueries({ queryKey: ["area-eventos-proximos", area.id] });
    toast.success(editId ? "Evento atualizado!" : "Evento criado!");
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("area_eventos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["area-eventos", area.id] });
    toast.success("Evento excluído!");
  }

  function EventoCard({ e }: { e: Evento }) {
    const Icon = TIPO_ICONS[e.tipo ?? "outro"] ?? Star;
    return (
      <Card>
        <CardContent className="p-4 flex gap-3 items-start">
          <div className="shrink-0 mt-0.5">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium">{e.titulo}</h4>
              {canEdit && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(e.data_inicio), "dd/MM/yy HH:mm", { locale: ptBR })}
              {e.data_fim && ` — ${format(new Date(e.data_fim), "HH:mm")}`}
            </p>
            {e.local && <p className="text-sm text-muted-foreground">📍 {e.local}</p>}
            {e.descricao && <p className="text-sm mt-1">{e.descricao}</p>}
            <Badge variant="outline" className="mt-1 text-xs">{e.tipo ?? "outro"}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Evento
        </Button>
      )}

      {futuros.length > 0 && (
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Próximo Evento</p>
              <h3 className="font-semibold">{futuros[0].titulo}</h3>
              <p className="text-sm">{format(new Date(futuros[0].data_inicio), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {futuros.map(e => <EventoCard key={e.id} e={e} />)}
          </div>
        </>
      )}

      {futuros.length === 0 && passados.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
      )}

      {passados.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Eventos anteriores ({passados.length})
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-2 opacity-60">
            {passados.map(e => <EventoCard key={e.id} e={e} />)}
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data Início</Label><Input type="datetime-local" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
              <div><Label>Data Fim</Label><Input type="datetime-local" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
            </div>
            <div><Label>Local</Label><Input value={local} onChange={e => setLocal(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="oracao">Oração</SelectItem>
                  <SelectItem value="treinamento">Treinamento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
