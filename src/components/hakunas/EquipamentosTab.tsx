import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableRow, TableHead, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Save } from "lucide-react";
import PriceCell from "@/components/financeiro/PriceCell";
import type { Tables } from "@/integrations/supabase/types";

type Equip = Tables<"hakuna_equipamentos">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function EquipamentosTab() {
  const qc = useQueryClient();
  const [items, setItems] = useState<Partial<Equip>[]>([]);
  const [fornecedores, setFornecedores] = useState(["Shopmed", "Cirúrgica Express", "Farmácia Popular"]);

  const { data: dbItems } = useQuery({
    queryKey: ["hk-equipamentos"],
    queryFn: async () => {
      const { data } = await supabase.from("hakuna_equipamentos").select("*").order("nome");
      return (data ?? []) as Equip[];
    },
  });

  useEffect(() => {
    if (dbItems && dbItems.length > 0) setItems(dbItems);
  }, [dbItems]);

  const updateItem = useCallback((idx: number, field: string, value: any) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { nome: "", quantidade: 1, situacao: "comprar", preco_loja1: null, preco_loja2: null, preco_loja3: null, preco_manual: null }]);
  };

  const getMinPrice = (it: Partial<Equip>) => {
    if (it.preco_manual != null) return it.preco_manual;
    const prices = [it.preco_loja1, it.preco_loja2, it.preco_loja3].filter((p): p is number => p != null);
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const calcTotal = (it: Partial<Equip>) => it.situacao === "comprar" ? getMinPrice(it) * (it.quantidade ?? 1) : 0;

  const custoTotal = items.reduce((s, it) => s + calcTotal(it), 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const it of items) {
        if (!it.nome) continue;
        const payload = {
          nome: it.nome, quantidade: it.quantidade, situacao: it.situacao, cedido_por: it.cedido_por,
          preco_loja1: it.preco_loja1, preco_loja2: it.preco_loja2, preco_loja3: it.preco_loja3,
          preco_manual: it.preco_manual, fonte_auto: it.fonte_auto,
        };
        if (it.id) {
          await supabase.from("hakuna_equipamentos").update(payload).eq("id", it.id);
        } else {
          await supabase.from("hakuna_equipamentos").insert(payload);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hk-equipamentos"] });
      toast({ title: "Equipamentos salvos" });
    },
  });

  const saveDespesaMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await supabase.from("despesas").select("id").eq("descricao", "Kit Médico - Equipamentos").eq("auto_calculado", true).maybeSingle();
      if (existing) {
        await supabase.from("despesas").update({ valor: custoTotal, categoria: "Equipamentos Médicos" }).eq("id", existing.id);
      } else {
        await supabase.from("despesas").insert({ descricao: "Kit Médico - Equipamentos", valor: custoTotal, categoria: "Equipamentos Médicos", auto_calculado: true });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin-despesas-lista"] });
      qc.invalidateQueries({ queryKey: ["fin-despesas-resumo"] });
      toast({ title: "Despesa Equipamentos salva" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card z-10 min-w-[150px]">Item</TableHead>
              <TableHead className="text-center w-16">Qtd</TableHead>
              <TableHead className="w-32">Situação</TableHead>
              <TableHead className="w-28">Cedido por</TableHead>
              {fornecedores.map((f, i) => (
                <TableHead key={i}>
                  <Input value={f} onChange={(e) => setFornecedores((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))} className="h-7 min-w-[80px] text-xs font-semibold" />
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
                <TableCell>
                  <Input type="number" min={1} value={it.quantidade ?? 1} onChange={(e) => updateItem(i, "quantidade", parseInt(e.target.value) || 1)} className="w-16 text-center" />
                </TableCell>
                <TableCell>
                  <Select value={it.situacao ?? "comprar"} onValueChange={(v) => updateItem(i, "situacao", v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprar"><Badge variant="destructive" className="text-xs">Comprar</Badge></SelectItem>
                      <SelectItem value="em_estoque"><Badge variant="default" className="text-xs">Em Estoque</Badge></SelectItem>
                      <SelectItem value="cedido"><Badge variant="secondary" className="text-xs">Cedido</Badge></SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {it.situacao === "cedido" ? (
                    <Input value={it.cedido_por ?? ""} onChange={(e) => updateItem(i, "cedido_por", e.target.value)} placeholder="Nome" className="min-w-[80px]" />
                  ) : "—"}
                </TableCell>
                <TableCell><PriceCell value={it.preco_loja1 ?? null} onChange={(v) => updateItem(i, "preco_loja1", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell><PriceCell value={it.preco_loja2 ?? null} onChange={(v) => updateItem(i, "preco_loja2", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell><PriceCell value={it.preco_loja3 ?? null} onChange={(v) => updateItem(i, "preco_loja3", v)} isAuto={!!it.fonte_auto} /></TableCell>
                <TableCell className="text-right font-medium">{fmt(getMinPrice(it))}</TableCell>
                <TableCell className="text-right font-medium">{fmt(calcTotal(it))}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold border-t-2">
              <TableCell colSpan={7} className="sticky left-0 bg-card z-10" />
              <TableCell className="text-right">TOTAL</TableCell>
              <TableCell className="text-right">{fmt(custoTotal)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Adicionar Equipamento</Button>
        <Button onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        <Button variant="secondary" onClick={() => saveDespesaMutation.mutate()}>Salvar como Despesa</Button>
      </div>
    </div>
  );
}
