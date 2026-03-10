import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Clock, CheckCircle2, ShoppingCart, FileDown, Trash2, Pencil } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, subDays } from "date-fns";
import type { PedidoOrcamento, CategoriaDespesa } from "@/types/pedidos";
import { STATUS_CONFIG, fmt } from "@/types/pedidos";

const getRowColor = (p: { status: string; is_doado?: boolean | null }) => {
  if (p.status === "aprovado" || p.status === "comprado" || p.is_doado === true) return "text-green-500";
  if (p.status === "aguardando") return "text-yellow-500";
  if (p.status === "reprovado") return "text-red-500";
  return "";
};

export default function AdmPedidosDashboard() {
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const [filtroArea, setFiltroArea] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [selectedPedido, setSelectedPedido] = useState<PedidoOrcamento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PedidoOrcamento | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields for the management modal
  const [editQtd, setEditQtd] = useState<number>(0);
  const [orc1Forn, setOrc1Forn] = useState("");
  const [orc1Val, setOrc1Val] = useState<number>(0);
  const [orc1Link, setOrc1Link] = useState("");
  const [orc2Forn, setOrc2Forn] = useState("");
  const [orc2Val, setOrc2Val] = useState<number>(0);
  const [orc2Link, setOrc2Link] = useState("");
  const [orc3Forn, setOrc3Forn] = useState("");
  const [orc3Val, setOrc3Val] = useState<number>(0);
  const [orc3Link, setOrc3Link] = useState("");
  const [fornAprovado, setFornAprovado] = useState("");
  const [valorPago, setValorPago] = useState<number>(0);
  const [qtdComprada, setQtdComprada] = useState<number>(0);
  const [dataCompra, setDataCompra] = useState("");
  const [motivoReprovacao, setMotivoReprovacao] = useState("");
  const [comprado, setComprado] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [comprovanteUrl, setComprovanteUrl] = useState("");
  const [isDoado, setIsDoado] = useState(false);
  const [doadoPor, setDoadoPor] = useState("");
  const [isPagoPorTerceiro, setIsPagoPorTerceiro] = useState(false);
  const [pagoPor, setPagoPor] = useState("");

  const { data: pedidos = [] } = useQuery({
    queryKey: ["adm-pedidos-todos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos_orcamentos")
        .select("*")
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

  // Stats
  const aguardando = pedidos.filter((p) => p.status === "aguardando").length;
  const emOrcamento = pedidos.filter((p) => p.status === "em_orcamento").length;
  const aprovados = pedidos.filter((p) => p.status === "aprovado").length;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const compradosMes = pedidos.filter((p) => p.status === "comprado" && p.data_compra && new Date(p.data_compra) >= startOfMonth).length;
  const seteDiasAtras = subDays(now, 7);
  const urgentes = pedidos.filter((p) => p.status === "aguardando" && p.data_solicitacao && new Date(p.data_solicitacao) < seteDiasAtras).length;

  const areas = [...new Set(pedidos.map((p) => p.area_solicitante))].sort();
  const filtered = pedidos.filter((p) => {
    if (filtroArea !== "todas" && p.area_solicitante !== filtroArea) return false;
    if (filtroCategoria !== "todas" && p.categoria !== filtroCategoria) return false;
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
    return true;
  });

  const openGestao = (p: PedidoOrcamento) => {
    setSelectedPedido(p);
    setEditMode(false);
    setEditQtd(p.quantidade);
    setOrc1Forn(p.orcamento_1_fornecedor || "");
    setOrc1Val(p.orcamento_1_valor || 0);
    setOrc1Link((p as any).orcamento_1_link || "");
    setOrc2Forn(p.orcamento_2_fornecedor || "");
    setOrc2Val(p.orcamento_2_valor || 0);
    setOrc2Link((p as any).orcamento_2_link || "");
    setOrc3Forn(p.orcamento_3_fornecedor || "");
    setOrc3Val(p.orcamento_3_valor || 0);
    setOrc3Link((p as any).orcamento_3_link || "");
    setFornAprovado(p.fornecedor_aprovado || "");
    setValorPago(p.valor_pago || 0);
    setQtdComprada(p.quantidade_comprada || p.quantidade);
    setDataCompra(p.data_compra || "");
    setMotivoReprovacao(p.motivo_reprovacao || "");
    setComprado(p.comprado || false);
    setComprovanteUrl(p.comprovante_url || p.comprovante_nf_url || "");
    setIsDoado(p.is_doado || false);
    setDoadoPor(p.doado_por || "");
    setIsPagoPorTerceiro(p.is_pago_por_terceiro || false);
    setPagoPor(p.pago_por || "");
    setDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `comprovantes/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("assets").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("assets").getPublicUrl(path);
      setComprovanteUrl(urlData.publicUrl);
      toast({ title: "Comprovante enviado" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const salvarEdicao = useMutation({
    mutationFn: async () => {
      if (!selectedPedido) return;
      const { error } = await supabase.from("pedidos_orcamentos").update({
        quantidade: editQtd,
        orcamento_1_fornecedor: orc1Forn || null,
        orcamento_1_valor: orc1Val || null,
        orcamento_1_link: orc1Link || null,
        orcamento_2_fornecedor: orc2Forn || null,
        orcamento_2_valor: orc2Val || null,
        orcamento_2_link: orc2Link || null,
        orcamento_3_fornecedor: orc3Forn || null,
        orcamento_3_valor: orc3Val || null,
        orcamento_3_link: orc3Link || null,
      }).eq("id", selectedPedido.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      setEditMode(false);
      toast({ title: "Edição salva" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const salvarOrcamentos = useMutation({
    mutationFn: async () => {
      if (!selectedPedido) return;
      const hasOrcamento = orc1Val > 0 || orc2Val > 0 || orc3Val > 0;
      const newStatus = hasOrcamento && selectedPedido.status === "aguardando" ? "em_orcamento" : selectedPedido.status;
      const { error } = await supabase.from("pedidos_orcamentos").update({
        orcamento_1_fornecedor: orc1Forn || null,
        orcamento_1_valor: orc1Val || null,
        orcamento_1_link: orc1Link || null,
        orcamento_2_fornecedor: orc2Forn || null,
        orcamento_2_valor: orc2Val || null,
        orcamento_2_link: orc2Link || null,
        orcamento_3_fornecedor: orc3Forn || null,
        orcamento_3_valor: orc3Val || null,
        orcamento_3_link: orc3Link || null,
        status: newStatus,
      }).eq("id", selectedPedido.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      toast({ title: "Orçamentos salvos" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const aprovar = useMutation({
    mutationFn: async () => {
      if (!selectedPedido) return;
      const { error } = await supabase.from("pedidos_orcamentos").update({ status: "aprovado" }).eq("id", selectedPedido.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      setSelectedPedido((prev) => prev ? { ...prev, status: "aprovado" } : null);
      toast({ title: "Pedido aprovado" });
    },
  });

  const reprovar = useMutation({
    mutationFn: async () => {
      if (!selectedPedido || !motivoReprovacao) return;
      const { error } = await supabase.from("pedidos_orcamentos").update({
        status: "reprovado",
        motivo_reprovacao: motivoReprovacao,
      }).eq("id", selectedPedido.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      setDialogOpen(false);
      toast({ title: "Pedido reprovado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos_orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      setDeleteTarget(null);
      toast({ title: "Pedido excluído" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const marcarComprado = useMutation({
    mutationFn: async () => {
      if (!selectedPedido) return;

      if (isDoado && !doadoPor.trim()) throw new Error("Informe quem doou o item");
      if (isPagoPorTerceiro && !pagoPor.trim()) throw new Error("Informe quem pagou o item");

      const { error: updateErr } = await supabase.from("pedidos_orcamentos").update({
        status: "comprado",
        comprado: true,
        fornecedor_aprovado: fornAprovado || null,
        valor_pago: valorPago || null,
        quantidade_comprada: qtdComprada || null,
        data_compra: dataCompra || null,
        comprovante_url: comprovanteUrl || null,
        migrado_despesas: true,
        is_doado: isDoado,
        doado_por: isDoado ? doadoPor : null,
        is_pago_por_terceiro: isPagoPorTerceiro,
        pago_por: isPagoPorTerceiro ? pagoPor : null,
      }).eq("id", selectedPedido.id);
      if (updateErr) throw updateErr;

      if (isDoado) {
        const { error: doacaoErr } = await supabase.from("doacoes").insert({
          tipo: "material",
          doador: doadoPor,
          valor: selectedPedido.valor_total_estimado || 0,
          pedido_id: selectedPedido.id,
          item_descricao: selectedPedido.nome_item,
          top_id: selectedPedido.top_id,
        });
        if (doacaoErr) throw doacaoErr;
      }

      if (isPagoPorTerceiro) {
        const { error: reembolsoErr } = await supabase.from("reembolsos").insert({
          nome_pagador: pagoPor,
          descricao: selectedPedido.nome_item,
          valor: valorPago || selectedPedido.valor_total_estimado || 0,
          area: selectedPedido.area_solicitante,
          pedido_id: selectedPedido.id,
          top_id: selectedPedido.top_id,
          status: "pendente",
        });
        if (reembolsoErr) throw reembolsoErr;
      }

      if (!isDoado) {
        const { error: insertErr } = await supabase.from("despesas").insert({
          item: selectedPedido.nome_item,
          descricao: selectedPedido.nome_item,
          categoria: selectedPedido.categoria,
          quantidade: qtdComprada || selectedPedido.quantidade,
          valor_unitario: qtdComprada > 0 ? valorPago / qtdComprada : valorPago,
          valor: valorPago,
          fornecedor: fornAprovado || null,
          data_aquisicao: dataCompra || null,
          comprovante_url: comprovanteUrl || null,
          auto_calculado: false,
        });
        if (insertErr) throw insertErr;
      }

      if (selectedPedido.categoria === "Medicamentos") {
        const finalQtd = qtdComprada || selectedPedido.quantidade;
        const { data: existing } = await supabase
          .from("hakuna_estoque_medicamentos")
          .select("id, quantidade")
          .eq("nome", selectedPedido.nome_item)
          .maybeSingle();

        let medId: string | null = null;
        if (existing) {
          medId = existing.id;
          await supabase.from("hakuna_estoque_medicamentos")
            .update({ quantidade: existing.quantidade + finalQtd })
            .eq("id", existing.id);
        } else {
          const { data: inserted } = await supabase.from("hakuna_estoque_medicamentos")
            .insert({
              nome: selectedPedido.nome_item,
              quantidade: finalQtd,
              origem: "compra",
              unidade: "un",
              estoque_minimo: 5,
              pedido_id: selectedPedido.id,
            })
            .select("id")
            .single();
          medId = inserted?.id ?? null;
        }

        await supabase.from("hakuna_estoque_movimentacoes").insert({
          medicamento_id: medId,
          tipo: "entrada",
          quantidade: finalQtd,
          origem_entrada: "compra",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      qc.invalidateQueries({ queryKey: ["fin-doacoes-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-doacoes"] });
      qc.invalidateQueries({ queryKey: ["hk-estoque-medicamentos"] });
      qc.invalidateQueries({ queryKey: ["hk-estoque-movimentacoes"] });
      setDialogOpen(false);
      toast({ title: "Compra registrada!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const statusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.aguardando;
    return <Badge className={`${cfg.color} border`}>{cfg.label}</Badge>;
  };

  const isComprado = selectedPedido?.status === "comprado";
  const isAprovado = selectedPedido?.status === "aprovado";
  const isReprovado = selectedPedido?.status === "reprovado";

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
          <p className="text-2xl font-bold">{aguardando}</p>
          <p className="text-xs text-muted-foreground">Aguardando</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{emOrcamento}</p>
          <p className="text-xs text-muted-foreground">Em Orçamento</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-400" />
          <p className="text-2xl font-bold">{aprovados}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold">{compradosMes}</p>
          <p className="text-xs text-muted-foreground">Comprados (mês)</p>
        </CardContent></Card>
        <Card className={urgentes > 0 ? "border-red-500 animate-pulse" : ""}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${urgentes > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <p className={`text-2xl font-bold ${urgentes > 0 ? "text-red-500" : ""}`}>{urgentes}</p>
            <p className="text-xs text-muted-foreground">Urgentes (&gt;7 dias)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select value={filtroArea} onValueChange={setFiltroArea}>
          <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas áreas</SelectItem>
            {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            {categorias.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</p>
          ) : filtered.map((p) => {
            const color = getRowColor(p);
            return (
              <Card key={p.id} className="cursor-pointer" onClick={() => openGestao(p)}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`font-medium ${color}`}>{p.nome_item}</span>
                      <p className={`text-xs ${color || "text-muted-foreground"}`}>{p.area_solicitante}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {statusBadge(p.status)}
                      {p.status !== "comprado" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className={`grid grid-cols-2 gap-1 text-sm ${color || "text-muted-foreground"}`}>
                    <span>{p.categoria}</span>
                    <span>Qtd: {p.quantidade}</span>
                    <span>{fmt(p.valor_total_estimado || 0)}</span>
                    <span>{p.data_solicitacao ? format(new Date(p.data_solicitacao), "dd/MM/yy") : "-"}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor Estimado</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const color = getRowColor(p);
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openGestao(p)}>
                    <TableCell className={color}>{p.area_solicitante}</TableCell>
                    <TableCell className={color}>{p.nome_item}</TableCell>
                    <TableCell className={color}>{p.categoria}</TableCell>
                    <TableCell className={`text-right ${color}`}>{p.quantidade}</TableCell>
                    <TableCell className={`text-right ${color}`}>{fmt(p.valor_total_estimado || 0)}</TableCell>
                    <TableCell className={color}>{p.responsavel_nome}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className={color}>{p.data_solicitacao ? format(new Date(p.data_solicitacao), "dd/MM/yy") : "-"}</TableCell>
                    <TableCell>
                      {p.status !== "comprado" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Management Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestão do Pedido</DialogTitle>
            <DialogDescription>{selectedPedido?.nome_item} — {selectedPedido?.area_solicitante}</DialogDescription>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-6">
              {/* Section 1: Pedido data */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Dados do Pedido</h4>
                  {!isComprado && !editMode && (
                    <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Área:</span> {selectedPedido.area_solicitante}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {selectedPedido.responsavel_nome}</div>
                  <div><span className="text-muted-foreground">Item:</span> {selectedPedido.nome_item}</div>
                  <div><span className="text-muted-foreground">Categoria:</span> {selectedPedido.categoria}</div>
                  <div>
                    <span className="text-muted-foreground">Quantidade:</span>{" "}
                    {editMode ? (
                      <Input type="number" min={1} value={editQtd} onChange={(e) => setEditQtd(parseInt(e.target.value) || 1)} className="inline-block w-20 h-7 ml-1" />
                    ) : (
                      selectedPedido.quantidade
                    )}
                  </div>
                  <div><span className="text-muted-foreground">Valor Estimado:</span> {fmt(selectedPedido.valor_total_estimado || 0)}</div>
                  {selectedPedido.finalidade && <div className="col-span-2"><span className="text-muted-foreground">Finalidade:</span> {selectedPedido.finalidade}</div>}
                  <div><span className="text-muted-foreground">Status:</span> {statusBadge(selectedPedido.status)}</div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Orcamentos */}
              {!selectedPedido.is_obrigatorio_global && (
                <>
                  <div>
                    <h4 className="font-semibold mb-2">Orçamentos</h4>
                    <div className="space-y-3">
                      {[
                        { label: "1", forn: orc1Forn, setForn: setOrc1Forn, val: orc1Val, setVal: setOrc1Val, link: orc1Link, setLink: setOrc1Link },
                        { label: "2", forn: orc2Forn, setForn: setOrc2Forn, val: orc2Val, setVal: setOrc2Val, link: orc2Link, setLink: setOrc2Link },
                        { label: "3", forn: orc3Forn, setForn: setOrc3Forn, val: orc3Val, setVal: setOrc3Val, link: orc3Link, setLink: setOrc3Link },
                      ].map((o) => (
                        <div key={o.label} className="space-y-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Fornecedor {o.label}</Label>
                              <Input value={o.forn} onChange={(e) => o.setForn(e.target.value)} disabled={isComprado && !editMode} />
                            </div>
                            <div>
                              <Label className="text-xs">Valor TOTAL</Label>
                              <Input type="number" step="0.01" value={o.val || ""} onChange={(e) => o.setVal(parseFloat(e.target.value) || 0)} disabled={isComprado && !editMode} />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Link de compra</Label>
                            <Input value={o.link} onChange={(e) => o.setLink(e.target.value)} placeholder="https://..." disabled={isComprado && !editMode} className="h-8 text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => salvarEdicao.mutate()}>Salvar edição</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                      </div>
                    )}
                    {!editMode && !isComprado && !isReprovado && (
                      <Button size="sm" className="mt-2" onClick={() => salvarOrcamentos.mutate()}>
                        Salvar Orçamentos
                      </Button>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Section 3: Decision & Purchase */}
              <div>
                <h4 className="font-semibold mb-2">Decisão e Compra</h4>

                {!isComprado && !isAprovado && !isReprovado && (
                  <div className="flex gap-2 mb-4">
                    <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => aprovar.mutate()}>
                      Aprovar
                    </Button>
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Motivo da reprovação (obrigatório)" value={motivoReprovacao} onChange={(e) => setMotivoReprovacao(e.target.value)} />
                      <Button variant="destructive" disabled={!motivoReprovacao} onClick={() => reprovar.mutate()}>
                        Reprovar
                      </Button>
                    </div>
                  </div>
                )}

                {isReprovado && selectedPedido.motivo_reprovacao && (
                  <p className="text-sm text-red-400 mb-4">Motivo: {selectedPedido.motivo_reprovacao}</p>
                )}

                {(isAprovado || isComprado) && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Fornecedor Aprovado</Label><Input value={fornAprovado} onChange={(e) => setFornAprovado(e.target.value)} disabled={isComprado} /></div>
                      <div><Label>Valor Pago (R$)</Label><Input type="number" step="0.01" value={valorPago || ""} onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)} disabled={isComprado} /></div>
                      <div><Label>Qtd Comprada</Label><Input type="number" min={1} value={qtdComprada} onChange={(e) => setQtdComprada(parseInt(e.target.value) || 1)} disabled={isComprado} /></div>
                      <div><Label>Data da Compra</Label><Input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} disabled={isComprado} /></div>
                    </div>

                    {!isComprado && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isDoado}
                            onCheckedChange={(v) => { setIsDoado(!!v); if (v) setIsPagoPorTerceiro(false); }}
                            id="doado-check"
                            disabled={isPagoPorTerceiro}
                          />
                          <Label htmlFor="doado-check">Item Doado</Label>
                        </div>
                        {isDoado && (
                          <div>
                            <Label>Doado por</Label>
                            <Input value={doadoPor} onChange={(e) => setDoadoPor(e.target.value)} placeholder="Nome do doador (obrigatório)" />
                          </div>
                        )}
                      </div>
                    )}

                    {!isComprado && (
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isPagoPorTerceiro}
                            onCheckedChange={(v) => { setIsPagoPorTerceiro(!!v); if (v) setIsDoado(false); }}
                            id="terceiro-check"
                            disabled={isDoado}
                          />
                          <Label htmlFor="terceiro-check">Pago por terceiro (gera reembolso)</Label>
                        </div>
                        {isPagoPorTerceiro && (
                          <div>
                            <Label>Pago por</Label>
                            <Input value={pagoPor} onChange={(e) => setPagoPor(e.target.value)} placeholder="Nome de quem pagou (obrigatório)" />
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label>Comprovante/NF</Label>
                      {comprovanteUrl && (
                        <a href={comprovanteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mb-1">
                          <FileDown className="h-3 w-3" /> Ver comprovante
                        </a>
                      )}
                      {!isComprado && (
                        <Input type="file" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                      )}
                      {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                    </div>
                    {!isComprado && (
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox checked={comprado} onCheckedChange={(v) => setComprado(!!v)} id="comprado-check" />
                        <Label htmlFor="comprado-check">Marcar como Comprado</Label>
                      </div>
                    )}
                    {!isComprado && comprado && (
                      <Button onClick={() => marcarComprado.mutate()} disabled={(!valorPago && !isDoado) || uploading || (isDoado && !doadoPor.trim()) || (isPagoPorTerceiro && !pagoPor.trim())}>
                        {isDoado ? "Confirmar Doação" : "Confirmar Compra e Migrar para Despesas"}
                      </Button>
                    )}
                    {isComprado && (
                      <p className="text-sm text-green-400 font-medium">✓ Comprado e migrado para despesas</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item <strong>{deleteTarget?.nome_item}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget?.id && deleteMutation.mutate(deleteTarget.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
