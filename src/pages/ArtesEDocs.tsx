import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Plus, Search, Download, Pencil, CopyPlus, Trash2, FileText, File, LayoutGrid, List, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArteDocFormDialog } from "@/components/artes-docs/ArteDocFormDialog";
import { ArteDocPreviewDialog } from "@/components/artes-docs/ArteDocPreviewDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const SUBCATEGORIAS: Record<string, string[]> = {
  "Arte Visual": ["Banner", "Post Instagram", "Post WhatsApp", "Convite", "Crachá", "Certificado", "Outro"],
  "Documento Oficial": ["Contrato", "Termo de Responsabilidade", "Regulamento", "Autorização", "Ficha Médica", "Outro"],
};

const IMAGE_EXTS = ["png", "jpg", "jpeg", "svg", "webp", "gif"];

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
  created_at?: string | null;
};

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(tipo: string | null | undefined): boolean {
  return IMAGE_EXTS.includes((tipo || "").toLowerCase());
}

const ArtesEDocs = () => {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("todos");
  const [viewMode, setViewMode] = useState("grid");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<ArteDoc | null>(null);
  const [novaVersaoDe, setNovaVersaoDe] = useState<ArteDoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ArteDoc | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<ArteDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["artes-docs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artes_docs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ArteDoc[];
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["artes-docs"] });

  const subcatOptions = filtroCategoria !== "todos" ? SUBCATEGORIAS[filtroCategoria] || [] : [];

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filtroCategoria !== "todos" && d.categoria !== filtroCategoria) return false;
      if (filtroSubcategoria !== "todos" && d.subcategoria !== filtroSubcategoria) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const matchNome = d.nome.toLowerCase().includes(q);
        const matchTags = (d.tags || "").toLowerCase().includes(q);
        if (!matchNome && !matchTags) return false;
      }
      return true;
    });
  }, [docs, filtroCategoria, filtroSubcategoria, busca]);

  const handlePreview = (doc: ArteDoc) => {
    if (isImage(doc.tipo_arquivo)) {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    } else if (doc.tipo_arquivo?.toLowerCase() === "pdf") {
      window.open(doc.arquivo_url, "_blank");
    } else {
      window.open(doc.arquivo_url, "_blank");
    }
  };

  const handleDownload = (doc: ArteDoc) => {
    const a = document.createElement("a");
    a.href = doc.arquivo_url;
    a.download = doc.nome;
    a.target = "_blank";
    a.click();
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("artes_docs").delete().eq("id", deleteDoc.id);
      if (error) throw error;
      toast({ title: "Arquivo excluído" });
      refetch();
      setDeleteOpen(false);
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (doc: ArteDoc) => {
    setEditDoc(doc);
    setNovaVersaoDe(null);
    setFormOpen(true);
  };

  const openNovaVersao = (doc: ArteDoc) => {
    setEditDoc(null);
    setNovaVersaoDe(doc);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditDoc(null);
    setNovaVersaoDe(null);
    setFormOpen(true);
  };

  const catBadgeClass = (cat: string) =>
    cat === "Arte Visual" ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Artes & Docs</h1>
          <Badge variant="secondary">{docs.length}</Badge>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou tag..." className="pl-9" />
        </div>
        <Select value={filtroCategoria} onValueChange={(v) => { setFiltroCategoria(v); setFiltroSubcategoria("todos"); }}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas categorias</SelectItem>
            <SelectItem value="Arte Visual">Arte Visual</SelectItem>
            <SelectItem value="Documento Oficial">Documento Oficial</SelectItem>
          </SelectContent>
        </Select>
        {subcatOptions.length > 0 && (
          <Select value={filtroSubcategoria} onValueChange={setFiltroSubcategoria}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Subcategoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas subcategorias</SelectItem>
              {subcatOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} size="sm">
          <ToggleGroupItem value="grid" aria-label="Grid"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="lista" aria-label="Lista"><List className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum arquivo encontrado</div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => (
            <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div
                className="h-40 bg-muted flex items-center justify-center cursor-pointer"
                onClick={() => handlePreview(doc)}
              >
                {isImage(doc.tipo_arquivo) ? (
                  <img src={doc.arquivo_url} alt={doc.nome} className="w-full h-full object-cover" />
                ) : doc.tipo_arquivo?.toLowerCase() === "pdf" ? (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <File className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-medium text-sm truncate" title={doc.nome}>{doc.nome}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge className={catBadgeClass(doc.categoria)}>{doc.categoria}</Badge>
                  {doc.subcategoria && <Badge variant="outline">{doc.subcategoria}</Badge>}
                  {(doc.versao || 1) > 1 && <Badge variant="secondary">v{doc.versao}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {doc.enviado_por && `Por ${doc.enviado_por}`}
                  {doc.created_at && ` em ${format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}`}
                </div>
                <div className="text-xs text-muted-foreground">{formatSize(doc.tamanho_bytes)}</div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Download" onClick={() => handleDownload(doc)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" onClick={() => handlePreview(doc)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(doc)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Nova Versão" onClick={() => openNovaVersao(doc)}>
                    <CopyPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Excluir" onClick={() => { setDeleteDoc(doc); setDeleteOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead className="text-center">Versão</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => handlePreview(doc)}>{doc.nome}</TableCell>
                  <TableCell><Badge className={catBadgeClass(doc.categoria)}>{doc.categoria}</Badge></TableCell>
                  <TableCell>{doc.subcategoria || "—"}</TableCell>
                  <TableCell className="text-center">{doc.versao || 1}</TableCell>
                  <TableCell>{doc.enviado_por || "—"}</TableCell>
                  <TableCell>{doc.created_at ? format(new Date(doc.created_at), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell>{formatSize(doc.tamanho_bytes)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Download" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(doc)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Nova Versão" onClick={() => openNovaVersao(doc)}><CopyPlus className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" title="Excluir" onClick={() => { setDeleteDoc(doc); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <ArteDocFormDialog open={formOpen} onOpenChange={setFormOpen} arteDoc={editDoc} novaVersaoDe={novaVersaoDe} onSuccess={refetch} />

      {previewDoc && (
        <ArteDocPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} imageUrl={previewDoc.arquivo_url} nome={previewDoc.nome} />
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir arquivo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{deleteDoc?.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtesEDocs;
