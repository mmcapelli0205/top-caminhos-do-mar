import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  equipamentoNome: string;
  onSuccess: () => void;
}

export function EmprestarDialog({ open, onOpenChange, equipamentoId, equipamentoNome, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    responsavel_nome: "",
    data_retirada: new Date().toISOString().slice(0, 16),
    estado_saida: "Bom",
    foto_saida_url: "",
    observacoes: "",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `equipamentos/emprestimos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, file);
    if (error) { toast.error("Erro ao enviar foto"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
    setForm((f) => ({ ...f, foto_saida_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.responsavel_nome.trim()) { toast.error("Responsável é obrigatório"); return; }
    setLoading(true);

    const { error: empError } = await supabase.from("equipamento_emprestimos").insert({
      equipamento_id: equipamentoId,
      responsavel_nome: form.responsavel_nome.trim(),
      data_retirada: form.data_retirada,
      estado_saida: form.estado_saida,
      foto_saida_url: form.foto_saida_url || null,
      observacoes: form.observacoes || null,
      devolvido: false,
    });

    if (!empError) {
      await supabase.from("equipamentos").update({ estado: form.estado_saida }).eq("id", equipamentoId);
    }

    setLoading(false);
    if (empError) { toast.error("Erro ao registrar empréstimo"); return; }
    toast.success("Empréstimo registrado");
    onOpenChange(false);
    setForm({ responsavel_nome: "", data_retirada: new Date().toISOString().slice(0, 16), estado_saida: "Bom", foto_saida_url: "", observacoes: "" });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Emprestar: {equipamentoNome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Responsável *</Label>
            <Input value={form.responsavel_nome} onChange={(e) => setForm((f) => ({ ...f, responsavel_nome: e.target.value }))} placeholder="Nome do responsável" />
          </div>
          <div>
            <Label>Data de Retirada</Label>
            <Input type="datetime-local" value={form.data_retirada} onChange={(e) => setForm((f) => ({ ...f, data_retirada: e.target.value }))} />
          </div>
          <div>
            <Label>Estado na Saída</Label>
            <Select value={form.estado_saida} onValueChange={(v) => setForm((f) => ({ ...f, estado_saida: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bom">Bom</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Foto do estado na saída (opcional)</Label>
            {form.foto_saida_url ? (
              <img src={form.foto_saida_url} alt="Saída" className="w-20 h-20 rounded-md object-cover border" />
            ) : (
              <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent text-sm w-fit">
                <Upload className="h-4 w-4" />
                {uploading ? "Enviando..." : "Enviar foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Registrando..." : "Confirmar Empréstimo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
