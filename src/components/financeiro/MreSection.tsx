import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, Search, AlertTriangle } from "lucide-react";
import PriceCell from "./PriceCell";
import type { Tables } from "@/integrations/supabase/types";

type MreItem = Tables<"mre_itens">;

const DEFAULT_ITEMS = [
  { nome: "Miojo (pacote)", obrigatorio: true, quantidade_por_kit: 2 },
  { nome: "Lata de Atum", obrigatorio: true, quantidade_por_kit: 1 },
  { nome: "Snickers (barra)", obrigatorio: true, quantidade_por_kit: 1 },
  { nome: "Balas de Yogurte (unid)", obrigatorio: true, quantidade_por_kit: 6 },
  { nome: "Hidralyse (sachê)", obrigatorio: true, quantidade_por_kit: 1 },
  { nome: "Clube Social (pacote)", obrigatorio: true, quantidade_por_kit: 1 },
  { nome: "Doce de Leite", obrigatorio: true, quantidade_por_kit: 1 },
  { nome: "Outro 1", obrigatorio: false, quantidade_por_kit: 1 },
  { nome: "Outro 2", obrigatorio: false, quantidade_por_kit: 1 },
  { nome: "Outro 3", obrigatorio: false, quantidade_por_kit: 1 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MreSection = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<Partial<MreItem>[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [mercadoNames, setMercadoNames] = useState(["Atacadão", "Mercadão", "Marsil"]);

  const { data: totalParticipantes } = useQuery({
    queryKey: ["fin-participantes-count"],
    queryFn: async () => {
      const { count } = await supabase.from("participantes").select("*", { count: "exact", head: true }).neq("status", "cancelado");
      return count ?? 0;
    },
  });

  const { data: dbItems, isSuccess } = useQuery({
    queryKey: ["fin-mre-itens"],
    queryFn: async () => {
      const { data } = await supabase.from("mre_itens").select("*").order("nome");
      return (data ?? []) as MreItem[];
    },
  });

  // Seed defaults if table empty
  const seedMutation = useMutation({
    mutationFn: async () => {
      const inserts = DEFAULT_ITEMS.map((d) => ({ nome: d.nome, obrigatorio: d.obrigatorio, quantidade_por_kit: d.quantidade_por_kit }));
      const { error } = await supabase.from("mre_itens").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-mre-itens"] });
    },
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
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { nome: "", obrigatorio: false, quantidade_por_kit: 1, preco_atacadao: null, preco_mercadao: null, preco_marsil: null, preco_manual: null, fonte_auto: false }]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.nome) continue;
        if (it.id) {
          await supabase.from("mre_itens").update({
            nome: it.nome, obrigatorio: it.obrigatorio, quantidade_por_kit: it.quantidade_por_kit,
            preco_atacadao: it.preco_atacadao, preco_mercadao: it.preco_mercadao, preco_marsil: it.preco_marsil,
            preco_manual: it.preco_manual, fonte_auto: it.fonte_auto,
          }).eq("id", it.id);
        } else {
          await supabase.from("mre_itens").insert({
            nome: it.nome, obrigatorio: it.obrigatorio ?? false, quantidade_por_kit: it.quantidade_por_kit ?? 1,
            preco_atacadao: it.preco_atacadao, preco_mercadao: it.preco_mercadao, preco_marsil: it.preco_marsil,
            preco_manual: it.preco_manual, fonte_auto: it.fonte_auto,
          });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-mre-itens"] });
      toast({ title: "MRE salvo" });
    },
  });

  const saveDespesaMutation = useMutation({
    mutationFn: async () => {
      const total = items.reduce((s, it) => s + calcTotal(it), 0);
      // Upsert by descricao
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

  const getMinPrice = (it: Partial<MreItem>) => {
    if (it.preco_manual != null) return it.preco_manual;
    const prices = [it.preco_atacadao, it.preco_mercadao, it.preco_marsil].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const calcTotal = (it: Partial<MreItem>) => getMinPrice(it) * (it.quantidade_por_kit ?? 1) * (totalParticipantes ?? 0);

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);
  const custoPorKit = (totalParticipantes ?? 0) > 0 ? custoTotal / (totalParticipantes ?? 1) : 0;

  const hasEmptyPrices = items.some((it) => it.obrigatorio && getMinPrice(it) === 0);

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
              {["preco_atacadao", "preco_mercadao", "preco_marsil"].map((_, mi) => (
                <TableHead key={mi}>
                  <div className="flex items-center gap-1">
                    <Input value={mercadoNames[mi]} onChange={(e) => setMercadoNames(prev => prev.map((n, i) => i === mi ? e.target.value : n))} className="h-7 min-w-[80px] text-xs font-semibold" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => toast({ title: "Webhook não configurado" })}><Search className="h-3 w-3" /></Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right">Menor</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it, i) => (
              <TableRow key={it.id ?? `new-${i}`}>
                <TableCell className="sticky left-0 bg-card z-10">
                  <Input value={it.nome ?? ""} onChange={(e) => updateItem(i, "nome", e.target.value)} className="min-w-[140px]" />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={it.obrigatorio ?? false} onCheckedChange={(v) => updateItem(i, "obrigatorio", !!v)} />
                </TableCell>
                <TableCell>
                  <Input type="number" min={1} value={it.quantidade_por_kit ?? 1} onChange={(e) => updateItem(i, "quantidade_por_kit", parseInt(e.target.value) || 1)} className="w-16 text-center" />
                </TableCell>
                <TableCell><PriceCell value={it.preco_atacadao ?? null} onChange={(v) => updateItem(i, "preco_atacadao", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell><PriceCell value={it.preco_mercadao ?? null} onChange={(v) => updateItem(i, "preco_mercadao", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell><PriceCell value={it.preco_marsil ?? null} onChange={(v) => updateItem(i, "preco_marsil", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell className="text-right font-medium">{fmt(getMinPrice(it))}</TableCell>
                <TableCell className="text-right font-medium">{fmt(calcTotal(it))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={6} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">Custo/Kit</TableCell>
              <TableCell className="text-right">{fmt(custoPorKit)}</TableCell>
            </TableRow>
            <TableRow className="font-bold">
              <TableCell colSpan={6} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">TOTAL MRE</TableCell>
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

export default MreSection;
