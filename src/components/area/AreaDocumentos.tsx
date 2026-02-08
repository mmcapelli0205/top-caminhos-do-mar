import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Image, Table2, File, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import type { TopUser } from "@/lib/auth";

type Area = Tables<"areas">;
type Documento = Tables<"area_documentos">;

const TIPO_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  excel: Table2,
};

function getFileIcon(tipo: string | null) {
  if (!tipo) return File;
  if (tipo.includes("pdf")) return FileText;
  if (tipo.includes("image") || tipo.includes("png") || tipo.includes("jpg") || tipo.includes("jpeg")) return Image;
  if (tipo.includes("sheet") || tipo.includes("excel") || tipo.includes("csv")) return Table2;
  return File;
}

interface Props {
  area: Area;
  canEdit: boolean;
  currentUser: TopUser | null;
}

export default function AreaDocumentos({ area, canEdit, currentUser }: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterTipo, setFilterTipo] = useState("todos");

  const { data: documentos = [] } = useQuery({
    queryKey: ["area-documentos", area.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("area_documentos")
        .select("*")
        .eq("area_id", area.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Documento[];
    },
  });

  const filtered = filterTipo === "todos"
    ? documentos
    : documentos.filter(d => {
        const t = d.tipo_arquivo ?? "";
        if (filterTipo === "pdf") return t.includes("pdf");
        if (filterTipo === "image") return t.includes("image") || t.includes("png") || t.includes("jpg");
        if (filterTipo === "excel") return t.includes("sheet") || t.includes("excel") || t.includes("csv");
        return true;
      });

  async function handleUpload() {
    if (!file || !nome.trim()) return;
    setSaving(true);
    const ext = file.name.split(".").pop();
    const path = `areas/${area.id}/docs/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("assets").upload(path, file);
    if (uploadErr) { toast.error("Erro no upload"); setSaving(false); return; }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);

    await supabase.from("area_documentos").insert({
      area_id: area.id,
      nome,
      descricao: descricao || null,
      arquivo_url: urlData.publicUrl,
      tipo_arquivo: file.type,
      tamanho_bytes: file.size,
      enviado_por: currentUser?.id,
      enviado_por_nome: currentUser?.nome,
    });

    setSaving(false);
    qc.invalidateQueries({ queryKey: ["area-documentos", area.id] });
    toast.success("Documento enviado!");
    setDialogOpen(false);
    setNome(""); setDescricao(""); setFile(null);
  }

  async function handleDelete(doc: Documento) {
    await supabase.from("area_documentos").delete().eq("id", doc.id);
    qc.invalidateQueries({ queryKey: ["area-documentos", area.id] });
    toast.success("Documento excluído!");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="image">Imagens</SelectItem>
            <SelectItem value="excel">Planilhas</SelectItem>
          </SelectContent>
        </Select>
        {canEdit && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Upload
          </Button>
        )}
      </div>

      {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum documento.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(doc => {
          const Icon = getFileIcon(doc.tipo_arquivo);
          return (
            <Card key={doc.id}>
              <CardContent className="p-4 flex gap-3">
                <Icon className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.nome}</p>
                  {doc.descricao && <p className="text-xs text-muted-foreground truncate">{doc.descricao}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.enviado_por_nome} • {doc.created_at ? format(new Date(doc.created_at), "dd/MM/yy") : ""}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                      <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" /> Baixar
                      </a>
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div><Label>Descrição</Label><Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} /></div>
            <div><Label>Arquivo</Label><Input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpload} disabled={saving || !file}>{saving ? "Enviando..." : "Enviar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
