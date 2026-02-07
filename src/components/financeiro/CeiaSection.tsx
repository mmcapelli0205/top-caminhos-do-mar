import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Save, Search, AlertTriangle } from "lucide-react";
import PriceCell from "./PriceCell";
import type { Tables } from "@/integrations/supabase/types";

type CeiaItem = Tables<"cela_itens">;

const DEFAULT_ITEMS = [
  { nome: "Carne Bovina", percentual: 40, kg_por_pessoa: 0.16 },
  { nome: "Linguiça", percentual: 25, kg_por_pessoa: 0.1 },
  { nome: "Frango", percentual: 20, kg_por_pessoa: 0.08 },
  { nome: "Batata Inglesa", percentual: 15, kg_por_pessoa: 0.06 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtKg = (v: number) => `${v.toFixed(1)} kg`;

const CeiaSection = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Partial<CeiaItem>[]>([]);
  const [margem, setMargem] = useState(10);
  const [seeded, setSeeded] = useState(false);

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
  const totalCarneKg = totalPessoas * 0.4;
  const margemFactor = 1 + margem / 100;

  const { data: dbItems, isSuccess } = useQuery({
    queryKey: ["fin-ceia-itens"],
    queryFn: async () => {
      const { data } = await supabase.from("cela_itens").select("*").order("nome");
      return (data ?? []) as CeiaItem[];
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const inserts = DEFAULT_ITEMS.map((d) => ({ nome: d.nome, percentual: d.percentual, kg_por_pessoa: d.kg_por_pessoa, margem_seguranca: 1.1 }));
      const { error } = await supabase.from("cela_itens").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fin-ceia-itens"] }),
  });

  useEffect(() => {
    if (isSuccess && dbItems && dbItems.length === 0 && !seeded) {
      setSeeded(true);
      seedMutation.mutate();
    }
  }, [isSuccess, dbItems, seeded]);

  useEffect(() => {
    if (dbItems && dbItems.length > 0) {
      setItems(dbItems);
      if (dbItems[0]?.margem_seguranca) setMargem(Math.round((dbItems[0].margem_seguranca - 1) * 100));
    }
  }, [dbItems]);

  const updateItem = useCallback((idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }, []);

  const getMinPrice = (it: Partial<CeiaItem>) => {
    if (it.preco_manual != null) return it.preco_manual;
    const prices = [it.preco_krill, it.preco_swift, it.preco_araujo].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const getKgTotal = (it: Partial<CeiaItem>) => totalPessoas * (it.kg_por_pessoa ?? 0) * margemFactor;
  const calcTotal = (it: Partial<CeiaItem>) => getKgTotal(it) * getMinPrice(it);

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);
  const custoPorPessoa = totalPessoas > 0 ? custoTotal / totalPessoas : 0;

  const hasEmptyPrices = items.some((it) => getMinPrice(it) === 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.nome) continue;
        const payload = {
          nome: it.nome, percentual: it.percentual, kg_por_pessoa: it.kg_por_pessoa,
          preco_krill: it.preco_krill, preco_swift: it.preco_swift, preco_araujo: it.preco_araujo,
          preco_manual: it.preco_manual, margem_seguranca: margemFactor,
        };
        if (it.id) {
          await supabase.from("cela_itens").update(payload).eq("id", it.id);
        } else {
          await supabase.from("cela_itens").insert(payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-ceia-itens"] });
      toast({ title: "Ceia salva" });
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
        <span>Total Carne: <strong>{fmtKg(totalCarneKg)}</strong></span>
        <span className="flex items-center gap-1">
          Margem: <Input type="number" min={0} max={50} value={margem} onChange={(e) => setMargem(parseInt(e.target.value) || 0)} className="w-16 h-7 text-center" />%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Cálculo: 400g/pessoa (carnes + batata assada, sem guarnições)</p>

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
              <TableHead className="sticky left-0 bg-card z-10 min-w-[130px]">Item</TableHead>
              <TableHead className="text-center">%</TableHead>
              <TableHead className="text-right">Kg/pessoa</TableHead>
              <TableHead className="text-right">Kg Total</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">Krill <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast({ title: "Webhook não configurado" })}><Search className="h-3 w-3" /></Button></div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">Swift <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast({ title: "Webhook não configurado" })}><Search className="h-3 w-3" /></Button></div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">M.Araujo <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toast({ title: "Webhook não configurado" })}><Search className="h-3 w-3" /></Button></div>
              </TableHead>
              <TableHead className="text-right">Menor</TableHead>
              <TableHead className="text-right">Total R$</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, i) => (
              <TableRow key={it.id ?? `new-${i}`}>
                <TableCell className="sticky left-0 bg-card z-10 font-medium">{it.nome}</TableCell>
                <TableCell className="text-center">{it.percentual ?? 0}%</TableCell>
                <TableCell className="text-right">{(it.kg_por_pessoa ?? 0).toFixed(3)}</TableCell>
                <TableCell className="text-right">{fmtKg(getKgTotal(it))}</TableCell>
                <TableCell><PriceCell value={it.preco_krill ?? null} onChange={(v) => updateItem(i, "preco_krill", v)} /></TableCell>
                <TableCell><PriceCell value={it.preco_swift ?? null} onChange={(v) => updateItem(i, "preco_swift", v)} /></TableCell>
                <TableCell><PriceCell value={it.preco_araujo ?? null} onChange={(v) => updateItem(i, "preco_araujo", v)} /></TableCell>
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
        <Button onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        <Button variant="secondary" onClick={() => saveDespesaMutation.mutate()}>Salvar como Despesa</Button>
      </div>
    </div>
  );
};

export default CeiaSection;
