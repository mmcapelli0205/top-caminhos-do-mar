import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import type { PedidoOrcamento, CategoriaDespesa } from "@/types/pedidos";
import { STATUS_CONFIG, fmt } from "@/types/pedidos";

interface AreaPedidosProps {
  areaNome: string;
}

const emptyForm = {
  responsavel_id: "",
  responsavel_nome: "",
  categoria: "",
  nome_item: "",
  quantidade: 1,
  valor_unitario_estimado: 0,
  finalidade: "",
};

export default function AreaPedidos({ areaNome }: AreaPedidosProps) {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: pedidos = [] } = useQuery({
    queryKey: ["area-pedidos", areaNome],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos_orcamentos")
        .select("*")
        .eq("area_solicitante", areaNome)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as PedidoOrcamento[];
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-despesas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categorias_despesas")
        .select("id, nome")
        .eq("ativo", true)
        .order("ordem");
      return (data ?? []) as unknown as CategoriaDespesa[];
    },
  });

  const { data: servidores = [] } = useQuery({
    queryKey: ["area-servidores-dropdown", areaNome],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, nome, cargo_area")
        .eq("area_servico", areaNome)
        .order("nome");
      return data ?? [];
    },
  });

  const filtered = pedidos.filter((p) => filtroStatus === "todos" || p.status === filtroStatus);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const servidor = servidores.find((s) => s.id === form.responsavel_id);
      const valorTotal = (form.quantidade || 1) * (form.valor_unitario_estimado || 0);
      const payload = {
        area_solicitante: areaNome,
        responsavel_id: form.responsavel_id || null,
        responsavel_nome: servidor?.nome || form.responsavel_nome || areaNome,
        categoria: form.categoria,
        nome_item: form.nome_item,
        quantidade: form.quantidade || 1,
        valor_unitario_estimado: form.valor_unitario_estimado || 0,
        valor_total_estimado: valorTotal,
        finalidade: form.finalidade || null,
      };
      if (editingId) {
        const { error } = await supabase.from("pedidos_orcamentos").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pedidos_orcamentos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["area-pedidos", areaNome] });
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: editingId ? "Pedido atualizado" : "Pedido criado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (p: PedidoOrcamento) => {
    if (p.status === "comprado") return;
    setEditingId(p.id);
    setForm({
      responsavel_id: p.responsavel_id || "",
      responsavel_nome: p.responsavel_nome,
      categoria: p.categoria,
      nome_item: p.nome_item,
      quantidade: p.quantidade,
      valor_unitario_estimado: p.valor_unitario_estimado || 0,
      finalidade: p.finalidade || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoria: categorias[0]?.nome || "" });
    setDialogOpen(true);
  };

  const statusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.aguardando;
    return <Badge className={`${cfg.color} border`}>{cfg.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Pedido
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</p>
          ) : filtered.map((p) => (
            <Card key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
              <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium truncate flex-1">{p.nome_item}</span>
                  {statusBadge(p.status)}
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  <span>Categoria: {p.categoria}</span>
                  <span>Qtd: {p.quantidade}</span>
                  <span>Estimado: {fmt(p.valor_total_estimado || 0)}</span>
                  <span>{p.data_solicitacao ? format(new Date(p.data_solicitacao), "dd/MM/yy") : "-"}</span>
                </div>
                {p.status !== "comprado" && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost"><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                  </div>
                )}
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
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.nome_item}</TableCell>
                  <TableCell>{p.categoria}</TableCell>
                  <TableCell className="text-right">{p.quantidade}</TableCell>
                  <TableCell className="text-right">{fmt(p.valor_total_estimado || 0)}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell>{p.data_solicitacao ? format(new Date(p.data_solicitacao), "dd/MM/yy") : "-"}</TableCell>
                  <TableCell>
                    {p.status !== "comprado" && (
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
            <DialogDescription>Preencha os dados do pedido de material</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Área Solicitante</Label>
              <Input value={areaNome} readOnly className="bg-muted" />
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={form.responsavel_id} onValueChange={(v) => setForm({ ...form, responsavel_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {servidores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}{s.cargo_area ? ` (${s.cargo_area})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nome do Item</Label><Input value={form.nome_item} onChange={(e) => setForm({ ...form, nome_item: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Quantidade</Label><Input type="number" min={1} value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value) || 1 })} /></div>
              <div><Label>Valor Unitário Estimado</Label><Input type="number" step="0.01" value={form.valor_unitario_estimado || ""} onChange={(e) => setForm({ ...form, valor_unitario_estimado: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <p className="text-sm text-muted-foreground">Total Estimado: {fmt((form.quantidade || 1) * (form.valor_unitario_estimado || 0))}</p>
            <div><Label>Finalidade</Label><Textarea value={form.finalidade} onChange={(e) => setForm({ ...form, finalidade: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.nome_item || !form.categoria}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
