import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const CATEGORIAS = ["Som/Áudio", "Vídeo/Projeção", "Iluminação", "Cozinha", "Veículos", "Comunicação", "Outros"];
const ORIGENS = [
  { value: "proprio", label: "Próprio" },
  { value: "emprestado", label: "Emprestado" },
  { value: "alugado", label: "Alugado" },
];
const ESTADOS = ["Bom", "Regular", "Danificado"];

interface Equipamento {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  origem?: string | null;
  proprietario?: string | null;
  quantidade?: number | null;
  estado?: string | null;
  foto_url?: string | null;
  valor_estimado?: number | null;
  observacoes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento?: Equipamento | null;
  onSuccess: () => void;
}

export function EquipamentoFormDialog({ open, onOpenChange, equipamento, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    categoria: "Outros",
    origem: "proprio",
    proprietario: "",
    quantidade: 1,
    estado: "Bom",
    foto_url: "",
    valor_estimado: 0,
    observacoes: "",
  });

  useEffect(() => {
    if (equipamento) {
      setForm({
        nome: equipamento.nome || "",
        descricao: equipamento.descricao || "",
        categoria: equipamento.categoria || "Outros",
        origem: equipamento.origem || "proprio",
        proprietario: equipamento.proprietario || "",
        quantidade: equipamento.quantidade || 1,
        estado: equipamento.estado || "Bom",
        foto_url: equipamento.foto_url || "",
        valor_estimado: equipamento.valor_estimado || 0,
        observacoes: equipamento.observacoes || "",
      });
    } else {
      setForm({
        nome: "", descricao: "", categoria: "Outros", origem: "proprio",
        proprietario: "", quantidade: 1, estado: "Bom", foto_url: "",
        valor_estimado: 0, observacoes: "",
      });
    }
  }, [equipamento, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `equipamentos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("assets").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar foto");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
    setForm((f) => ({ ...f, foto_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setLoading(true);
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao || null,
      categoria: form.categoria,
      origem: form.origem,
      proprietario: form.origem !== "proprio" ? form.proprietario || null : null,
      quantidade: form.quantidade,
      estado: form.estado,
      foto_url: form.foto_url || null,
      valor_estimado: form.valor_estimado || 0,
      observacoes: form.observacoes || null,
    };

    let error;
    if (equipamento) {
      ({ error } = await supabase.from("equipamentos").update(payload).eq("id", equipamento.id));
    } else {
      ({ error } = await supabase.from("equipamentos").insert(payload));
    }
    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar equipamento");
      return;
    }
    toast.success(equipamento ? "Equipamento atualizado" : "Equipamento cadastrado");
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{equipamento ? "Editar Equipamento" : "Novo Equipamento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.origem} onValueChange={(v) => setForm((f) => ({ ...f, origem: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.origem !== "proprio" && (
            <div>
              <Label>Proprietário / Empresa</Label>
              <Input value={form.proprietario} onChange={(e) => setForm((f) => ({ ...f, proprietario: e.target.value }))} placeholder="Nome de quem emprestou ou empresa" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm((f) => ({ ...f, quantidade: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.valor_estimado} onChange={(e) => setForm((f) => ({ ...f, valor_estimado: Number(e.target.value) }))} />
            </div>
          </div>

          <div>
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              {form.foto_url ? (
                <div className="relative">
                  <img src={form.foto_url} alt="Foto" className="w-20 h-20 rounded-md object-cover border" />
                  <button onClick={() => setForm((f) => ({ ...f, foto_url: "" }))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent text-sm">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Enviando..." : "Enviar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
