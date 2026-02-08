import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pin, Pencil, Trash2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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
type Aviso = Tables<"area_avisos">;
type Comentario = Tables<"area_comentarios">;

interface Props {
  area: Area;
  canEdit: boolean;
  canComment: boolean;
  currentUser: TopUser | null;
}

export default function AreaMural({ area, canEdit, canComment, currentUser }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [fixado, setFixado] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: avisos = [] } = useQuery({
    queryKey: ["area-avisos", area.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_avisos")
        .select("*")
        .eq("area_id", area.id)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false });
      return (data ?? []) as Aviso[];
    },
  });

  function openNew() {
    setEditId(null); setTitulo(""); setConteudo(""); setFixado(false); setDialogOpen(true);
  }

  function openEdit(a: Aviso) {
    setEditId(a.id); setTitulo(a.titulo); setConteudo(a.conteudo); setFixado(a.fixado ?? false); setDialogOpen(true);
  }

  async function handleSave() {
    if (!titulo.trim() || !conteudo.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("area_avisos").update({ titulo, conteudo, fixado, updated_at: new Date().toISOString() }).eq("id", editId);
    } else {
      await supabase.from("area_avisos").insert({
        area_id: area.id,
        titulo, conteudo, fixado,
        autor_id: currentUser?.id,
        autor_nome: currentUser?.nome,
      });
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["area-avisos", area.id] });
    toast.success(editId ? "Aviso atualizado!" : "Aviso criado!");
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("area_comentarios").delete().eq("aviso_id", id);
    await supabase.from("area_avisos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["area-avisos", area.id] });
    toast.success("Aviso excluído!");
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Aviso
        </Button>
      )}

      {avisos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p>}

      {avisos.map(a => (
        <Card key={a.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {a.fixado && <Badge variant="secondary"><Pin className="h-3 w-3 mr-1" />Fixado</Badge>}
                <h3 className="font-semibold">{a.titulo}</h3>
              </div>
              {canEdit && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{a.conteudo}</p>
            <p className="text-xs text-muted-foreground">
              Por {a.autor_nome ?? "—"} em {a.created_at ? format(new Date(a.created_at), "dd/MM/yy HH:mm", { locale: ptBR }) : ""}
            </p>
            <ComentariosSection avisoId={a.id} canComment={canComment} currentUser={currentUser} />
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={conteudo} onChange={e => setConteudo(e.target.value)} rows={5} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="fixado" checked={fixado} onCheckedChange={v => setFixado(!!v)} />
              <Label htmlFor="fixado">Fixar no topo</Label>
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

function ComentariosSection({ avisoId, canComment, currentUser }: {
  avisoId: string; canComment: boolean; currentUser: TopUser | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");

  const { data: comentarios = [] } = useQuery({
    queryKey: ["area-comentarios", avisoId],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_comentarios")
        .select("*")
        .eq("aviso_id", avisoId)
        .order("created_at", { ascending: true });
      return (data ?? []) as Comentario[];
    },
  });

  async function handleEnviar() {
    if (!texto.trim()) return;
    await supabase.from("area_comentarios").insert({
      aviso_id: avisoId,
      conteudo: texto,
      autor_id: currentUser?.id,
      autor_nome: currentUser?.nome,
    });
    setTexto("");
    qc.invalidateQueries({ queryKey: ["area-comentarios", avisoId] });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          {comentarios.length} comentário{comentarios.length !== 1 ? "s" : ""}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {comentarios.map(c => (
          <div key={c.id} className="bg-muted/50 rounded p-2">
            <p className="text-sm">{c.conteudo}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {c.autor_nome} • {c.created_at ? format(new Date(c.created_at), "dd/MM HH:mm") : ""}
            </p>
          </div>
        ))}
        {canComment && (
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar comentário..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEnviar()}
              className="text-sm"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleEnviar}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
