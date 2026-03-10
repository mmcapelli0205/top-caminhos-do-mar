import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Save, AlertTriangle, Trash2 } from "lucide-react";
import PriceCell from "./PriceCell";
import type { Tables } from "@/integrations/supabase/types";

type PedidoRow = Tables<"pedidos_orcamentos">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getRowColor = (it: Partial<PedidoRow>) => {
  if (it.status === "aprovado" || it.status === "comprado" || it.is_doado === true) return "text-green-500";
  if (it.status === "aguardando") return "text-yellow-500";
  if (it.status === "reprovado") return "text-red-500";
  return "";
};

const MreSection = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Partial<PedidoRow>[]>([]);
  const [mercadoNames, setMercadoNames] = useState(["Atacadão", "Mercadão", "Marsil"]);
  const [deleteItem, setDeleteItem] = useState<Partial<PedidoRow> | null>(null);

  const { data: totalParticipantes } = useQuery({
    queryKey: ["fin-participantes-count"],
    queryFn: async () => {
      const { count } = await supabase.from("participantes").select("*", { count: "exact", head: true }).neq("status", "cancelado");
      return count ?? 0;
    },
  });

  const { data: dbItems } = useQuery({
    queryKey: ["fin-mre-pedidos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos_orcamentos")
        .select("*")
        .or("categoria.eq.MRE,and(categoria.eq.Bebidas,nome_item.eq.Sudrat (Soro em Pó))")
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

  const getMinPrice = (it: Partial<PedidoRow>) => {
    const prices = [it.orcamento_1_valor, it.orcamento_2_valor, it.orcamento_3_valor].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const calcTotal = (it: Partial<PedidoRow>) => getMinPrice(it) * (it.quantidade ?? 1) * (totalParticipantes ?? 0);

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);
  const custoPorKit = (totalParticipantes ?? 0) > 0 ? custoTotal / (totalParticipantes ?? 1) : 0;

  const hasEmptyPrices = items.some((it) => it.is_obrigatorio_global && getMinPrice(it) === 0);

  const saveItemMutation = useMutation({
    mutationFn: async (it: Partial<PedidoRow>) => {
      if (!it.id) return;
      await supabase.from("pedidos_orcamentos").update({
        orcamento_1_valor: it.orcamento_1_valor,
        orcamento_2_valor: it.orcamento_2_valor,
        orcamento_3_valor: it.orcamento_3_valor,
        orcamento_1_link: it.orcamento_1_link,
        orcamento_2_link: it.orcamento_2_link,
        orcamento_3_link: it.orcamento_3_link,
        orcamento_1_fornecedor: it.orcamento_1_fornecedor,
        orcamento_2_fornecedor: it.orcamento_2_fornecedor,
        orcamento_3_fornecedor: it.orcamento_3_fornecedor,
        quantidade: it.quantidade,
        is_obrigatorio_global: it.is_obrigatorio_global,
      }).eq("id", it.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-mre-pedidos"] });
    },
  });

  const handleBlurSave = useCallback((idx: number) => {
    const it = items[idx];
    if (it?.id) saveItemMutation.mutate(it);
  }, [items, saveItemMutation]);

  const enviarAprovacaoMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.id) continue;
        await supabase.from("pedidos_orcamentos").update({
          status: "aguardando",
        }).eq("id", it.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-mre-pedidos"] });
      toast({ title: "Itens enviados para aprovação ADM" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pedidos_orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-mre-pedidos"] });
      setDeleteItem(null);
      toast({ title: "Item excluído" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const saveDespesaMutation = useMutation({
    mutationFn: async () => {
      const total = items.reduce((s, it) => s + calcTotal(it), 0);
      const { data: existing } = await supabase.from("despesas").select("id").eq("descricao", "MRE Kit Alimentação").eq("auto_calculado", true).maybeSingle();
      if (existing) {
        await supabase.from("despesas").update({ valor: total, categoria: "MRE" }).eq("id", existing.id);
      } else {
        await supabase.from("despesas").insert({ descricao: "MRE Kit Alimentação", valor: total, categoria: "MRE", auto_calculado: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      toast({ title: "Despesa MRE salva" });
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Total Participantes: <strong>{totalParticipantes ?? 0}</strong></p>

      {hasEmptyPrices && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-600">Alguns itens obrigatórios estão sem preço preenchido</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 min-w-[150px]">Item</TableHead>
              <TableHead className="text-center">Obrig.</TableHead>
              <TableHead className="text-center">Qtd/Kit</TableHead>
              {[0, 1, 2].map((mi) => (
                <TableHead key={mi}>
                  <Input
                    value={mercadoNames[mi]}
                    onChange={(e) => setMercadoNames(prev => prev.map((n, i) => i === mi ? e.target.value : n))}
                    className="h-7 min-w-[80px] text-xs font-semibold"
                  />
                </TableHead>
              ))}
              <TableHead className="text-right">Menor</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, i) => {
              const rowColor = getRowColor(it);
              const orc1Key = "orcamento_1_valor" as const;
              const orc2Key = "orcamento_2_valor" as const;
              const orc3Key = "orcamento_3_valor" as const;

              return (
                <TableRow key={it.id ?? `new-${i}`}>
                  <TableCell className={`sticky left-0 bg-card z-10 font-medium ${rowColor}`}>
                    {it.nome_item ?? ""}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={it.is_obrigatorio_global ?? false}
                      onCheckedChange={(v) => updateItem(i, "is_obrigatorio_global", !!v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={it.quantidade ?? 1}
                      onChange={(e) => updateItem(i, "quantidade", parseInt(e.target.value) || 1)}
                      className={`w-16 text-center ${rowColor}`}
                    />
                  </TableCell>
                  {/* Orçamento 1 */}
                  <TableCell>
                    <div className="space-y-1">
                      <PriceCell value={it.orcamento_1_valor ?? null} onChange={(v) => updateItem(i, orc1Key, v)} />
                      <Input
                        value={it.orcamento_1_link ?? ""}
                        onChange={(e) => updateItem(i, "orcamento_1_link", e.target.value)}
                        placeholder="Link de compra (opcional)"
                        className="h-6 text-xs"
                      />
                    </div>
                  </TableCell>
                  {/* Orçamento 2 */}
                  <TableCell>
                    <div className="space-y-1">
                      <PriceCell value={it.orcamento_2_valor ?? null} onChange={(v) => updateItem(i, orc2Key, v)} />
                      <Input
                        value={it.orcamento_2_link ?? ""}
                        onChange={(e) => updateItem(i, "orcamento_2_link", e.target.value)}
                        placeholder="Link de compra (opcional)"
                        className="h-6 text-xs"
                      />
                    </div>
                  </TableCell>
                  {/* Orçamento 3 */}
                  <TableCell>
                    <div className="space-y-1">
                      <PriceCell value={it.orcamento_3_valor ?? null} onChange={(v) => updateItem(i, orc3Key, v)} />
                      <Input
                        value={it.orcamento_3_link ?? ""}
                        onChange={(e) => updateItem(i, "orcamento_3_link", e.target.value)}
                        placeholder="Link de compra (opcional)"
                        className="h-6 text-xs"
                      />
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${rowColor}`}>{fmt(getMinPrice(it))}</TableCell>
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
              <TableCell colSpan={6} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">Custo/Kit</TableCell>
              <TableCell className="text-right">{fmt(custoPorKit)}</TableCell>
              <TableCell />
            </TableRow>
            <TableRow className="font-bold">
              <TableCell colSpan={6} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">TOTAL MRE</TableCell>
              <TableCell className="text-right">{fmt(custoTotal)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        <Button variant="secondary" onClick={() => saveDespesaMutation.mutate()}>Salvar como Despesa</Button>
      </div>

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

export default MreSection;
