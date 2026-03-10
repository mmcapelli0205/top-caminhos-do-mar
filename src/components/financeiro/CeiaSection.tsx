import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Save, AlertTriangle, SendHorizonal, Gift, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PedidoRow = Tables<"pedidos_orcamentos">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getRowColor = (it: Partial<PedidoRow>) => {
  if (it.status === "aprovado" || it.status === "comprado" || it.is_doado === true) return "text-green-500";
  if (it.status === "aguardando") return "text-yellow-500";
  if (it.status === "reprovado") return "text-red-500";
  return "";
};

const CeiaSection = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Partial<PedidoRow>[]>([]);
  const [deleteItem, setDeleteItem] = useState<Partial<PedidoRow> | null>(null);

  // Donation modal state
  const [doacaoModalOpen, setDoacaoModalOpen] = useState(false);
  const [doacaoIdx, setDoacaoIdx] = useState<number | null>(null);
  const [doacaoNome, setDoacaoNome] = useState("");
  const [doacaoValor, setDoacaoValor] = useState("");
  const [doacaoQtd, setDoacaoQtd] = useState("");
  const [doacaoError, setDoacaoError] = useState("");

  const { data: totalParticipantes } = useQuery({
    queryKey: ["fin-participantes-count"],
    queryFn: async () => {
      const { count } = await supabase.from("participantes").select("*", { count: "exact", head: true }).neq("status", "cancelado");
      return count ?? 0;
    },
  });

  const { data: totalServidores } = useQuery({
    queryKey: ["fin-servidores-count"],
    queryFn: async () => {
      const { count } = await supabase.from("servidores").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const totalPessoas = (totalParticipantes ?? 0) + (totalServidores ?? 0);

  const { data: dbItems } = useQuery({
    queryKey: ["fin-ceia-pedidos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos_orcamentos")
        .select("*")
        .eq("categoria", "Ceia do Rei")
        .order("nome_item");
      return (data ?? []) as PedidoRow[];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (dbItems && dbItems.length > 0) setItems(dbItems);
  }, [dbItems]);

  const updateItem = useCallback((idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }, []);

  const calcTotal = (it: Partial<PedidoRow>) => {
    const kg = (it.kg_compra as number | null) ?? 0;
    const unitPrice = it.valor_unitario_estimado ?? 0;
    return kg * unitPrice;
  };

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);
  const custoPorPessoa = totalPessoas > 0 ? custoTotal / totalPessoas : 0;

  const openDoacaoModal = (idx: number) => {
    const it = items[idx];
    setDoacaoIdx(idx);
    setDoacaoNome(it.doado_por ?? "");
    setDoacaoValor(it.valor_total_estimado ? String(it.valor_total_estimado) : "");
    setDoacaoQtd(it.quantidade ? String(it.quantidade) : "");
    setDoacaoError("");
    setDoacaoModalOpen(true);
  };

  const saveDoacaoMutation = useMutation({
    mutationFn: async () => {
      if (!doacaoNome.trim() || !doacaoValor.trim() || !doacaoQtd.trim()) {
        throw new Error("Preencha todos os campos obrigatórios");
      }
      const idx = doacaoIdx!;
      const it = items[idx];
      if (!it.id) throw new Error("Item sem ID");

      const valorNum = parseFloat(doacaoValor);
      const qtdNum = parseFloat(doacaoQtd);
      if (isNaN(valorNum) || valorNum <= 0) throw new Error("Valor inválido");
      if (isNaN(qtdNum) || qtdNum <= 0) throw new Error("Quantidade inválida");

      await supabase.from("pedidos_orcamentos").update({
        is_doado: true,
        doado_por: doacaoNome.trim(),
        valor_total_estimado: valorNum,
        quantidade: qtdNum,
      }).eq("id", it.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-pedidos"] });
      qc.invalidateQueries({ queryKey: ["fin-pedidos-doados"] });
      setDoacaoModalOpen(false);
      toast({ title: "Doação registrada" });
    },
    onError: (err: Error) => {
      setDoacaoError(err.message);
    },
  });

  const removeDoacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("pedidos_orcamentos").update({
        is_doado: false,
        doado_por: null,
      }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-pedidos"] });
      qc.invalidateQueries({ queryKey: ["fin-pedidos-doados"] });
      toast({ title: "Doação removida" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos_orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-pedidos"] });
      setDeleteItem(null);
      toast({ title: "Item excluído" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.id) continue;
        await supabase.from("pedidos_orcamentos").update({
          kg_compra: it.kg_compra,
          valor_unitario_estimado: it.valor_unitario_estimado,
        }).eq("id", it.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-pedidos"] });
      toast({ title: "Ceia salva" });
    },
  });

  const enviarAprovacaoMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.id) continue;
        await supabase.from("pedidos_orcamentos").update({
          kg_compra: it.kg_compra,
          valor_unitario_estimado: it.valor_unitario_estimado,
          status: "aguardando",
        }).eq("id", it.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-pedidos"] });
      toast({ title: "Itens enviados para aprovação ADM" });
    },
  });

  const saveDespesaMutation = useMutation({
    mutationFn: async () => {
      const total = items.reduce((s, it) => s + calcTotal(it), 0);
      const { data: existing } = await supabase.from("despesas").select("id").eq("descricao", "Ceia do Rei - Churrasco").eq("auto_calculado", true).maybeSingle();
      if (existing) {
        await supabase.from("despesas").update({ valor: total, categoria: "Ceia do Rei" }).eq("id", existing.id);
      } else {
        await supabase.from("despesas").insert({ descricao: "Ceia do Rei - Churrasco", valor: total, categoria: "Ceia do Rei", auto_calculado: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      toast({ title: "Despesa Ceia salva" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total Pessoas: <strong>{totalPessoas}</strong></span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Item</TableHead>
              <TableHead className="text-center">Doação</TableHead>
              <TableHead className="text-center">Valor Unit. (R$/kg)</TableHead>
              <TableHead className="text-center">Qtd. Comprada</TableHead>
              <TableHead className="text-right">Total R$</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, i) => {
              const rowColor = getRowColor(it);

              return (
                <TableRow key={it.id ?? `new-${i}`}>
                  <TableCell className={`sticky left-0 bg-card z-10 font-medium ${rowColor}`}>
                    <div className="flex flex-col">
                      <span>{it.nome_item ?? ""}</span>
                      {it.is_doado && it.doado_por && (
                        <span className="text-xs text-green-500">
                          <Gift className="inline h-3 w-3 mr-1" />
                          Doado por {it.doado_por}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={it.is_doado ?? false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          openDoacaoModal(i);
                        } else if (it.id) {
                          removeDoacaoMutation.mutate(it.id);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.valor_unitario_estimado ?? ""}
                      onChange={(e) => updateItem(i, "valor_unitario_estimado", parseFloat(e.target.value) || null)}
                      className={`w-28 ml-auto text-center ${rowColor}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      value={(it.kg_compra as number | null) ?? ""}
                      onChange={(e) => updateItem(i, "kg_compra", parseFloat(e.target.value) || null)}
                      className={`w-28 ml-auto text-center ${rowColor}`}
                    />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${rowColor}`}>{fmt(calcTotal(it))}</TableCell>
                  <TableCell>
                    {it.status !== "comprado" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(it)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={3} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">Por Pessoa</TableCell>
              <TableCell className="text-right">{fmt(custoPorPessoa)}</TableCell>
              <TableCell />
            </TableRow>
            <TableRow className="font-bold">
              <TableCell colSpan={3} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">TOTAL</TableCell>
              <TableCell className="text-right">{fmt(custoTotal)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => saveMutation.mutate()}>
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
        <Button variant="outline" onClick={() => enviarAprovacaoMutation.mutate()}>
          <SendHorizonal className="h-4 w-4 mr-1" /> Enviar para Aprovação
        </Button>
        <Button variant="secondary" onClick={() => saveDespesaMutation.mutate()}>
          Salvar como Despesa
        </Button>
      </div>

      {/* Donation Modal */}
      <Dialog open={doacaoModalOpen} onOpenChange={setDoacaoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Doação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {doacaoIdx !== null && (
              <p className="text-sm text-muted-foreground">
                Item: <strong>{items[doacaoIdx]?.nome_item}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Label>Nome do Doador *</Label>
              <Input value={doacaoNome} onChange={(e) => setDoacaoNome(e.target.value)} placeholder="Nome completo do doador" />
            </div>
            <div className="space-y-2">
              <Label>Valor Real ou Aproximado (R$) *</Label>
              <Input type="number" min={0} step="0.01" value={doacaoValor} onChange={(e) => setDoacaoValor(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Quantidade Doada *</Label>
              <Input type="number" min={0} step="0.1" value={doacaoQtd} onChange={(e) => setDoacaoQtd(e.target.value)} placeholder="Ex: 5" />
            </div>
            {doacaoError && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{doacaoError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDoacaoModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveDoacaoMutation.mutate()}>Salvar Doação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item <strong>{deleteItem?.nome_item}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItem?.id && deleteMutation.mutate(deleteItem.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CeiaSection;
