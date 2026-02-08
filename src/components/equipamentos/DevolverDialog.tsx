import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { format } from "date-fns";

interface Emprestimo {
  id: string;
  equipamento_id: string | null;
  responsavel_nome: string | null;
  data_retirada: string | null;
  estado_saida: string | null;
  foto_saida_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emprestimo: Emprestimo;
  equipamentoNome: string;
  onSuccess: () => void;
}

export function DevolverDialog({ open, onOpenChange, emprestimo, equipamentoNome, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    data_devolucao: new Date().toISOString().slice(0, 16),
    estado_devolucao: "Bom",
    foto_devolucao_url: "",
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
    setForm((f) => ({ ...f, foto_devolucao_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from("equipamento_emprestimos").update({
      devolvido: true,
      data_devolucao: form.data_devolucao,
      estado_devolucao: form.estado_devolucao,
      foto_devolucao_url: form.foto_devolucao_url || null,
      observacoes: form.observacoes || null,
    }).eq("id", emprestimo.id);

    if (!error && emprestimo.equipamento_id) {
      await supabase.from("equipamentos").update({ estado: form.estado_devolucao }).eq("id", emprestimo.equipamento_id);
    }

    setLoading(false);
    if (error) { toast.error("Erro ao registrar devolução"); return; }
    toast.success("Devolução registrada");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver: {equipamentoNome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border p-3 bg-muted/50 space-y-1 text-sm">
            <p><span className="font-medium">Responsável:</span> {emprestimo.responsavel_nome}</p>
            <p><span className="font-medium">Retirada:</span> {emprestimo.data_retirada ? format(new Date(emprestimo.data_retirada), "dd/MM/yyyy HH:mm") : "—"}</p>
            <p><span className="font-medium">Estado na saída:</span> <Badge variant="outline">{emprestimo.estado_saida}</Badge></p>
            {emprestimo.foto_saida_url && <img src={emprestimo.foto_saida_url} alt="Saída" className="w-16 h-16 rounded object-cover" />}
          </div>

          <div>
            <Label>Data de Devolução</Label>
            <Input type="datetime-local" value={form.data_devolucao} onChange={(e) => setForm((f) => ({ ...f, data_devolucao: e.target.value }))} />
          </div>
          <div>
            <Label>Estado na Devolução</Label>
            <Select value={form.estado_devolucao} onValueChange={(v) => setForm((f) => ({ ...f, estado_devolucao: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bom">Bom</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Danificado">Danificado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Foto do estado na devolução (opcional)</Label>
            {form.foto_devolucao_url ? (
              <img src={form.foto_devolucao_url} alt="Devolução" className="w-20 h-20 rounded-md object-cover border" />
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
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Registrando..." : "Confirmar Devolução"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
