import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, FileDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type Despesa = Tables<"despesas">;

const CATEGORIAS = [
  "Administrativas", "Juridicas", "Papelaria", "Comunicação", "Equipamentos",
  "Combustível", "Montanha", "Locação da Base", "Banheiros Químicos",
  "Fogos/Decoração", "Fardas", "Gorras", "Patchs", "Pins",
  "Taxa Global", "Taxa Ticket and Go", "Diversos",
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const emptyForm = { item: "", categoria: CATEGORIAS[0], quantidade: 1, valor_unitario: 0, fornecedor: "", data_aquisicao: "", observacoes: "", comprovante_url: "" };

const DespesasSection = () => {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: despesas } = useQuery({
    queryKey: ["fin-despesas-lista"],
    queryFn: async () => {
      const { data } = await supabase.from("despesas").select("*").eq("auto_calculado", false).order("created_at", { ascending: false });
      return (data ?? []) as Despesa[];
    },
  });

  const filtered = (despesas ?? []).filter((d) => {
    if (filtroCategoria !== "todas" && d.categoria !== filtroCategoria) return false;
    if (busca) {
      const s = busca.toLowerCase();
      return (d.item ?? d.descricao).toLowerCase().includes(s) || (d.fornecedor ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  const totalFiltered = filtered.reduce((s, d) => s + (d.valor ?? 0), 0);
  const totalGeral = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `comprovantes/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("assets").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
      setForm((prev) => ({ ...prev, comprovante_url: urlData.publicUrl }));
      toast({ title: "Comprovante enviado" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const valor = (form.quantidade ?? 1) * (form.valor_unitario ?? 0);
      const payload = {
        item: form.item, descricao: form.item, categoria: form.categoria,
        quantidade: form.quantidade, valor_unitario: form.valor_unitario, valor,
        fornecedor: form.fornecedor || null, data_aquisicao: form.data_aquisicao || null,
        observacoes: form.observacoes || null, comprovante_url: form.comprovante_url || null,
        auto_calculado: false,
      };
      if (editingId) {
        const { error } = await supabase.from("despesas").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("despesas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      setDialogOpen(false); setEditingId(null); setForm(emptyForm);
      toast({ title: "Despesa salva" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      toast({ title: "Despesa excluída" });
    },
  });

  const openEdit = (d: Despesa) => {
    setEditingId(d.id);
    setForm({
      item: d.item ?? d.descricao, categoria: d.categoria ?? CATEGORIAS[0],
      quantidade: d.quantidade ?? 1, valor_unitario: d.valor_unitario ?? 0,
      fornecedor: d.fornecedor ?? "", data_aquisicao: d.data_aquisicao ?? "",
      observacoes: d.observacoes ?? "", comprovante_url: d.comprovante_url ?? "",
    });
    setDialogOpen(true);
  };

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Buscar item ou fornecedor..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1" /> Nova Despesa
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</p>
          ) : filtered.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium truncate flex-1">{d.item ?? d.descricao}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">{d.categoria ?? "-"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  <span>Qtd: {d.quantidade ?? 1}</span>
                  <span>Unit: {fmt(d.valor_unitario ?? 0)}</span>
                  <span>Fornecedor: {d.fornecedor ?? "-"}</span>
                  <span>Data: {d.data_aquisicao ?? "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{fmt(d.valor)}</span>
                  <div className="flex gap-1">
                    {d.comprovante_url && (
                      <a href={d.comprovante_url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost"><FileDown className="h-4 w-4" /></Button>
                      </a>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir despesa?")) deleteMutation.mutate(d.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Val. Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Obs</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.item ?? d.descricao}</TableCell>
                  <TableCell>{d.categoria ?? "-"}</TableCell>
                  <TableCell className="text-right">{d.quantidade ?? 1}</TableCell>
                  <TableCell className="text-right">{fmt(d.valor_unitario ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(d.valor)}</TableCell>
                  <TableCell>{d.fornecedor ?? "-"}</TableCell>
                  <TableCell>{d.data_aquisicao ?? "-"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{d.observacoes ?? "-"}</TableCell>
                  <TableCell>
                    {d.comprovante_url ? (
                      <a href={d.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <FileDown className="h-4 w-4" />
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir despesa?")) deleteMutation.mutate(d.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhuma despesa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end gap-6 text-sm">
        {filtroCategoria !== "todas" && <span>Total {filtroCategoria}: <strong>{fmt(totalFiltered)}</strong></span>}
        <span>Total Geral: <strong>{fmt(totalGeral)}</strong></span>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            <DialogDescription>Preencha os dados da despesa</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Item</Label><Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Valor Unitário</Label><Input type="number" step="0.01" value={form.valor_unitario || ""} onChange={(e) => setForm({ ...form, valor_unitario: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Total: {fmt((form.quantidade ?? 1) * (form.valor_unitario ?? 0))}</p>
            <div><Label>Fornecedor</Label><Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></div>
            <div><Label>Data Aquisição</Label><Input type="date" value={form.data_aquisicao} onChange={(e) => setForm({ ...form, data_aquisicao: e.target.value })} /></div>
            <div><Label>Observações</Label><Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            <div>
              <Label>Comprovante</Label>
              {form.comprovante_url && (
                <div className="flex items-center gap-2 mb-2">
                  <a href={form.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><FileDown className="h-3 w-3" /> Ver atual</a>
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, comprovante_url: "" })}>Remover</Button>
                </div>
              )}
              <Input type="file" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
              {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.item || uploading}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DespesasSection;
