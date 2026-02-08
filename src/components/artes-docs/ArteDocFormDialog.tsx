import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { getUser } from "@/lib/auth";

const SUBCATEGORIAS: Record<string, string[]> = {
  "Arte Visual": ["Banner", "Post Instagram", "Post WhatsApp", "Convite", "Crachá", "Certificado", "Outro"],
  "Documento Oficial": ["Contrato", "Termo de Responsabilidade", "Regulamento", "Autorização", "Ficha Médica", "Outro"],
};

type ArteDoc = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria: string;
  subcategoria?: string | null;
  arquivo_url: string;
  tipo_arquivo?: string | null;
  tamanho_bytes?: number | null;
  versao?: number | null;
  tags?: string | null;
  enviado_por?: string | null;
  top_id?: string | null;
};

interface ArteDocFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arteDoc?: ArteDoc | null;
  novaVersaoDe?: ArteDoc | null; // quando criando nova versão
  onSuccess: () => void;
}

export function ArteDocFormDialog({ open, onOpenChange, arteDoc, novaVersaoDe, onSuccess }: ArteDocFormDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Arte Visual");
  const [subcategoria, setSubcategoria] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const isEdit = !!arteDoc && !novaVersaoDe;
  const isNovaVersao = !!novaVersaoDe;

  useEffect(() => {
    if (!open) return;
    if (novaVersaoDe) {
      setNome(novaVersaoDe.nome);
      setDescricao(novaVersaoDe.descricao || "");
      setCategoria(novaVersaoDe.categoria);
      setSubcategoria(novaVersaoDe.subcategoria || "");
      setTags(novaVersaoDe.tags || "");
    } else if (arteDoc) {
      setNome(arteDoc.nome);
      setDescricao(arteDoc.descricao || "");
      setCategoria(arteDoc.categoria);
      setSubcategoria(arteDoc.subcategoria || "");
      setTags(arteDoc.tags || "");
    } else {
      setNome("");
      setDescricao("");
      setCategoria("Arte Visual");
      setSubcategoria("");
      setTags("");
    }
    setFile(null);
  }, [open, arteDoc, novaVersaoDe]);

  const handleSave = async () => {
    if (!nome.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (!isEdit && !file) {
      toast({ title: "Arquivo é obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let arquivo_url = arteDoc?.arquivo_url || "";
      let tipo_arquivo = arteDoc?.tipo_arquivo || "";
      let tamanho_bytes = arteDoc?.tamanho_bytes || 0;

      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `artes-docs/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("assets").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
        arquivo_url = urlData.publicUrl;
        tipo_arquivo = ext;
        tamanho_bytes = file.size;
      }

      const user = getUser();

      if (isNovaVersao && novaVersaoDe) {
        const { error } = await supabase.from("artes_docs").insert({
          nome,
          descricao: descricao || null,
          categoria,
          subcategoria: subcategoria || null,
          arquivo_url,
          tipo_arquivo,
          tamanho_bytes,
          versao: (novaVersaoDe.versao || 1) + 1,
          tags: tags || null,
          enviado_por: user?.nome || null,
          top_id: novaVersaoDe.top_id || null,
        });
        if (error) throw error;
      } else if (isEdit && arteDoc) {
        const { error } = await supabase.from("artes_docs").update({
          nome,
          descricao: descricao || null,
          categoria,
          subcategoria: subcategoria || null,
          ...(file ? { arquivo_url, tipo_arquivo, tamanho_bytes } : {}),
          tags: tags || null,
        }).eq("id", arteDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artes_docs").insert({
          nome,
          descricao: descricao || null,
          categoria,
          subcategoria: subcategoria || null,
          arquivo_url,
          tipo_arquivo,
          tamanho_bytes,
          tags: tags || null,
          enviado_por: user?.nome || null,
        });
        if (error) throw error;
      }

      toast({ title: isNovaVersao ? "Nova versão criada!" : isEdit ? "Arquivo atualizado!" : "Arquivo enviado!" });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNovaVersao ? `Nova Versão — ${novaVersaoDe?.nome}` : isEdit ? "Editar Arquivo" : "Upload de Arquivo"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} disabled={isNovaVersao} />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={(v) => { setCategoria(v); setSubcategoria(""); }} disabled={isNovaVersao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arte Visual">Arte Visual</SelectItem>
                  <SelectItem value="Documento Oficial">Documento Oficial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategoria</Label>
              <Select value={subcategoria} onValueChange={setSubcategoria} disabled={isNovaVersao}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(SUBCATEGORIAS[categoria] || []).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Arquivo {!isEdit && "*"}</Label>
            <input type="file" ref={fileRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div
              className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Clique para selecionar arquivo</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="banner, instagram, TOP1575" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : isNovaVersao ? "Criar Versão" : isEdit ? "Salvar" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
