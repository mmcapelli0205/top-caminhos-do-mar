import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Search, AlertTriangle } from "lucide-react";
import PriceCell from "./PriceCell";

interface BebidaItem {
  id?: string;
  nome: string;
  quantidade_por_pessoa: number | null;
  preco_mercado1: number | null;
  preco_mercado2: number | null;
  preco_mercado3: number | null;
  preco_manual: number | null;
  top_id?: string | null;
}

const DEFAULT_ITEMS: Omit<BebidaItem, "id">[] = [
  { nome: "Água (unid)", quantidade_por_pessoa: 2, preco_mercado1: null, preco_mercado2: null, preco_mercado3: null, preco_manual: null },
  { nome: "Refrigerante (L)", quantidade_por_pessoa: 0.5, preco_mercado1: null, preco_mercado2: null, preco_mercado3: null, preco_manual: null },
  { nome: "Leite (L)", quantidade_por_pessoa: 0.3, preco_mercado1: null, preco_mercado2: null, preco_mercado3: null, preco_manual: null },
  { nome: "Isotônico (unid)", quantidade_por_pessoa: 1, preco_mercado1: null, preco_mercado2: null, preco_mercado3: null, preco_manual: null },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BebidasSection = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<BebidaItem[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [mercadoNames, setMercadoNames] = useState(["Mercado 1", "Mercado 2", "Mercado 3"]);

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

  const { data: dbItems, isSuccess } = useQuery({
    queryKey: ["fin-bebidas-itens"],
    queryFn: async () => {
      const { data } = await supabase.from("bebidas_itens").select("*").order("nome");
      return (data ?? []) as BebidaItem[];
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const inserts = DEFAULT_ITEMS.map((d) => ({ nome: d.nome, quantidade_por_pessoa: d.quantidade_por_pessoa }));
      const { error } = await supabase.from("bebidas_itens").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-bebidas-itens"] }),
  });

  useEffect(() => {
    if (isSuccess && dbItems && dbItems.length === 0 && !seeded) {
      setSeeded(true);
      seedMutation.mutate();
    }
  }, [isSuccess, dbItems, seeded]);

  useEffect(() => {
    if (dbItems && dbItems.length > 0) setItems(dbItems);
  }, [dbItems]);

  const updateItem = useCallback((idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { nome: "", quantidade_por_pessoa: 1, preco_mercado1: null, preco_mercado2: null, preco_mercado3: null, preco_manual: null }]);
  };

  const getMinPrice = (it: BebidaItem) => {
    if (it.preco_manual != null) return it.preco_manual;
    const prices = [it.preco_mercado1, it.preco_mercado2, it.preco_mercado3].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const calcTotal = (it: BebidaItem) => getMinPrice(it) * (it.quantidade_por_pessoa ?? 0) * totalPessoas;

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);
  const custoPorPessoa = totalPessoas > 0 ? custoTotal / totalPessoas : 0;

  const hasEmptyPrices = items.some((it) => getMinPrice(it) === 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.nome) continue;
        const payload = {
          nome: it.nome,
          quantidade_por_pessoa: it.quantidade_por_pessoa,
          preco_mercado1: it.preco_mercado1,
          preco_mercado2: it.preco_mercado2,
          preco_mercado3: it.preco_mercado3,
          preco_manual: it.preco_manual,
        };
        if (it.id) {
          await supabase.from("bebidas_itens").update(payload).eq("id", it.id);
        } else {
          await supabase.from("bebidas_itens").insert(payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-bebidas-itens"] });
      toast({ title: "Bebidas salvas" });
    },
  });

  const saveDespesaMutation = useMutation({
    mutationFn: async () => {
      const total = items.reduce((s, it) => s + calcTotal(it), 0);
      const { data: existing } = await supabase.from("despesas").select("id").eq("descricao", "Bebidas").eq("auto_calculado", true).maybeSingle();
      if (existing) {
        await supabase.from("despesas").update({ valor: total, categoria: "Bebidas" }).eq("id", existing.id);
      } else {
        await supabase.from("despesas").insert({ descricao: "Bebidas", valor: total, categoria: "Bebidas", auto_calculado: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      toast({ title: "Despesa Bebidas salva" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total Pessoas: <strong>{totalPessoas}</strong></span>
      </div>

      {hasEmptyPrices && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-600">Alguns itens estão sem preço preenchido</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 min-w-[150px]">Item</TableHead>
              <TableHead className="text-center">Qtd/Pessoa</TableHead>
              <TableHead className="text-right">Qtd Total</TableHead>
              {[0, 1, 2].map((mi) => (
                <TableHead key={mi}>
                  <div className="flex items-center gap-1">
                    <Input value={mercadoNames[mi]} onChange={(e) => setMercadoNames((prev) => prev.map((n, i) => (i === mi ? e.target.value : n)))} className="h-7 min-w-[80px] text-xs font-semibold" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => toast({ title: "Webhook não configurado" })}>
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right">Menor</TableHead>
              <TableHead className="text-right">Total R$</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, i) => (
              <TableRow key={it.id ?? `new-${i}`}>
                <TableCell className="sticky left-0 bg-card z-10">
                  <Input value={it.nome ?? ""} onChange={(e) => updateItem(i, "nome", e.target.value)} className="min-w-[140px]" />
                </TableCell>
                <TableCell>
                  <Input type="number" min={0} step="0.1" value={it.quantidade_por_pessoa ?? 0} onChange={(e) => updateItem(i, "quantidade_por_pessoa", parseFloat(e.target.value) || 0)} className="w-20 text-center" />
                </TableCell>
                <TableCell className="text-right">{((it.quantidade_por_pessoa ?? 0) * totalPessoas).toFixed(0)}</TableCell>
                <TableCell><PriceCell value={it.preco_mercado1 ?? null} onChange={(v) => updateItem(i, "preco_mercado1", v)} /></TableCell>
                <TableCell><PriceCell value={it.preco_mercado2 ?? null} onChange={(v) => updateItem(i, "preco_mercado2", v)} /></TableCell>
                <TableCell><PriceCell value={it.preco_mercado3 ?? null} onChange={(v) => updateItem(i, "preco_mercado3", v)} /></TableCell>
                <TableCell className="text-right font-medium">{fmt(getMinPrice(it))}</TableCell>
                <TableCell className="text-right font-medium">{fmt(calcTotal(it))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={7} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">Por Pessoa</TableCell>
              <TableCell className="text-right">{fmt(custoPorPessoa)}</TableCell>
            </TableRow>
            <TableRow className="font-bold">
              <TableCell colSpan={7} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">TOTAL</TableCell>
              <TableCell className="text-right">{fmt(custoTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Adicionar Item</Button>
        <Button onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        <Button variant="secondary" onClick={() => saveDespesaMutation.mutate()}>Salvar como Despesa</Button>
      </div>
    </div>
  );
};

export default BebidasSection;
