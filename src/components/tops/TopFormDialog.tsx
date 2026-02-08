import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface TopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top?: {
    id: string;
    nome: string;
    local: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    max_participantes: number | null;
    status: string | null;
    observacoes: string | null;
  } | null;
}

const STATUS_OPTIONS = ["Planejamento", "Inscrições Abertas", "Em Andamento", "Finalizado"];

export default function TopFormDialog({ open, onOpenChange, top }: TopFormDialogProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "", local: "", data_inicio: "", data_fim: "",
    max_participantes: 150, status: "Planejamento", observacoes: "",
  });

  useEffect(() => {
    if (top) {
      setForm({
        nome: top.nome, local: top.local || "", data_inicio: top.data_inicio || "",
        data_fim: top.data_fim || "", max_participantes: top.max_participantes || 150,
        status: top.status || "Planejamento", observacoes: (top as any).observacoes || "",
      });
    } else {
      setForm({ nome: "", local: "", data_inicio: "", data_fim: "", max_participantes: 150, status: "Planejamento", observacoes: "" });
    }
  }, [top, open]);

  const handleSave = async () => {
    if (!form.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setLoading(true);
    const payload = {
      nome: form.nome, local: form.local || null,
      data_inicio: form.data_inicio || null, data_fim: form.data_fim || null,
      max_participantes: form.max_participantes, status: form.status,
      observacoes: form.observacoes || null,
    };
    const { error } = top
      ? await supabase.from("tops").update(payload).eq("id", top.id)
      : await supabase.from("tops").insert(payload);
    setLoading(false);
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
    toast({ title: top ? "TOP atualizado" : "TOP criado" });
    qc.invalidateQueries({ queryKey: ["tops"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{top ? "Editar TOP" : "Novo TOP"}</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Caminhos do Mar" /></div>
          <div><Label>Local</Label><Input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data Início</Label><Input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Máx. Participantes</Label><Input type="number" value={form.max_participantes} onChange={e => setForm(f => ({ ...f, max_participantes: Number(e.target.value) }))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
