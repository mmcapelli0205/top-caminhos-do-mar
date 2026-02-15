import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileDown, FilterX, ArrowUpDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import jsPDF from "jspdf";
import Papa from "papaparse";
import type { Tables } from "@/integrations/supabase/types";

type Despesa = Tables<"despesas">;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  onBack: () => void;
}

type SortKey = "item" | "categoria" | "quantidade" | "valor_unitario" | "valor" | "fornecedor" | "data_aquisicao";

export default function RelatorioConsolidado({ onBack }: Props) {
  const isMobile = useIsMobile();
  const [filtroCategoria, setFiltroCategoria] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("categoria");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: despesas = [] } = useQuery({
    queryKey: ["relatorio-despesas"],
    queryFn: async () => {
      const { data } = await supabase.from("despesas").select("*").eq("auto_calculado", false).order("created_at", { ascending: false });
      return (data ?? []) as Despesa[];
    },
  });

  const categorias = useMemo(() => [...new Set(despesas.map((d) => d.categoria ?? "Outros"))].sort(), [despesas]);

  const filtered = useMemo(() => {
    let result = despesas;
    if (filtroCategoria.length > 0) result = result.filter((d) => filtroCategoria.includes(d.categoria ?? "Outros"));
    if (valorMin) result = result.filter((d) => d.valor >= parseFloat(valorMin));
    if (valorMax) result = result.filter((d) => d.valor <= parseFloat(valorMax));
    if (dataInicio) result = result.filter((d) => (d.data_aquisicao ?? "") >= dataInicio);
    if (dataFim) result = result.filter((d) => (d.data_aquisicao ?? "") <= dataFim);

    return [...result].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [despesas, filtroCategoria, valorMin, valorMax, dataInicio, dataFim, sortKey, sortDir]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, Despesa[]> = {};
    filtered.forEach((d) => {
      const cat = d.categoria ?? "Outros";
      if (!map[cat]) map[cat] = [];
      map[cat].push(d);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const totalGeral = filtered.reduce((s, d) => s + (d.valor ?? 0), 0);

  // Category summary for footer
  const catSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((d) => {
      const cat = d.categoria ?? "Outros";
      map[cat] = (map[cat] ?? 0) + (d.valor ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const clearFilters = () => {
    setFiltroCategoria([]);
    setValorMin("");
    setValorMax("");
    setDataInicio("");
    setDataFim("");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Relatório Consolidado de Despesas - TOP 1575", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 28);
    doc.text(`Total de itens: ${filtered.length} | Total: ${fmt(totalGeral)}`, 14, 34);

    let y = 44;
    doc.setFontSize(8);
    const headers = ["Item", "Categoria", "Qtd", "Val.Unit.", "Total", "Fornecedor", "Data"];
    const colWidths = [60, 35, 15, 25, 25, 45, 25];
    headers.forEach((h, i) => {
      const x = 14 + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
      doc.setFont("helvetica", "bold");
      doc.text(h, x, y);
    });
    y += 6;

    doc.setFont("helvetica", "normal");
    filtered.forEach((d) => {
      if (y > 190) { doc.addPage(); y = 20; }
      const row = [
        (d.item ?? d.descricao).substring(0, 30),
        (d.categoria ?? "-").substring(0, 18),
        String(d.quantidade ?? 1),
        fmt(d.valor_unitario ?? 0),
        fmt(d.valor),
        (d.fornecedor ?? "-").substring(0, 22),
        d.data_aquisicao ?? "-",
      ];
      row.forEach((val, i) => {
        const x = 14 + colWidths.slice(0, i).reduce((s, w) => s + w, 0);
        doc.text(val, x, y);
      });
      y += 5;
    });

    doc.save("relatorio-despesas-top1575.pdf");
  };

  const exportCSV = () => {
    const rows = filtered.map((d) => ({
      Item: d.item ?? d.descricao,
      Categoria: d.categoria ?? "-",
      Quantidade: d.quantidade ?? 1,
      "Valor Unitário": d.valor_unitario ?? 0,
      "Valor Total": d.valor,
      Fornecedor: d.fornecedor ?? "-",
      "Data Compra": d.data_aquisicao ?? "-",
      Observações: d.observacoes ?? "",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-despesas-top1575.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(sortKeyName)}>
      <span className="flex items-center gap-1">
        {label} <ArrowUpDown className="h-3 w-3" />
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Relatório Consolidado de Despesas - TOP 1575</h2>
          <p className="text-xs text-muted-foreground">
            Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")} · {filtered.length} itens · Total: {fmt(totalGeral)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Categoria</p>
              <Select value={filtroCategoria[0] ?? "todas"} onValueChange={(v) => setFiltroCategoria(v === "todas" ? [] : [v])}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor mín.</p>
              <Input type="number" placeholder="0" value={valorMin} onChange={(e) => setValorMin(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valor máx.</p>
              <Input type="number" placeholder="∞" value={valorMax} onChange={(e) => setValorMax(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Data de</p>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Data até</p>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}><FilterX className="h-4 w-4 mr-1" /> Limpar</Button>
              <Button variant="outline" size="sm" onClick={exportPDF}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
              <Button variant="outline" size="sm" onClick={exportCSV}><FileDown className="h-4 w-4 mr-1" /> CSV</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isMobile ? (
        <div className="space-y-3">
          {grouped.map(([cat, items]) => (
            <div key={cat}>
              <div className="bg-primary/10 rounded px-3 py-2 mb-2 flex justify-between items-center">
                <span className="font-bold text-sm">{cat}</span>
                <span className="text-sm font-bold">{fmt(items.reduce((s, d) => s + d.valor, 0))}</span>
              </div>
              {items.map((d) => (
                <Card key={d.id} className="mb-2">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{d.item ?? d.descricao}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mt-1">
                      <span>Qtd: {d.quantidade ?? 1}</span>
                      <span>Unit: {fmt(d.valor_unitario ?? 0)}</span>
                      <span>Fornecedor: {d.fornecedor ?? "-"}</span>
                      <span>Data: {d.data_aquisicao ?? "-"}</span>
                    </div>
                    <p className="text-right font-bold text-sm mt-1">{fmt(d.valor)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Item" sortKeyName="item" />
                <SortHeader label="Categoria" sortKeyName="categoria" />
                <SortHeader label="Qtd" sortKeyName="quantidade" />
                <SortHeader label="Val. Unit." sortKeyName="valor_unitario" />
                <SortHeader label="Total" sortKeyName="valor" />
                <SortHeader label="Fornecedor" sortKeyName="fornecedor" />
                <SortHeader label="Data Compra" sortKeyName="data_aquisicao" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {grouped.map(([cat, items]) => {
                const subtotal = items.reduce((s, d) => s + d.valor, 0);
                return (
                  <> 
                    <TableRow key={`cat-${cat}`} className="bg-primary/10">
                      <TableCell colSpan={4} className="font-bold text-sm">{cat}</TableCell>
                      <TableCell className="text-right font-bold text-sm">{fmt(subtotal)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                    {items.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.item ?? d.descricao}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{d.categoria ?? "-"}</Badge></TableCell>
                        <TableCell className="text-right">{d.quantidade ?? 1}</TableCell>
                        <TableCell className="text-right">{fmt(d.valor_unitario ?? 0)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(d.valor)}</TableCell>
                        <TableCell>{d.fornecedor ?? "-"}</TableCell>
                        <TableCell>{d.data_aquisicao ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4}>TOTAL GERAL</TableCell>
                  <TableCell className="text-right">{fmt(totalGeral)}</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              )}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer - Category Summary */}
      {catSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Resumo por Categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {catSummary.map(([cat, total]) => (
                <div key={cat} className="flex justify-between bg-muted/30 rounded px-3 py-2">
                  <span className="text-sm">{cat}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{fmt(total)}</span>
                    <span className="text-xs text-muted-foreground ml-1">({totalGeral > 0 ? ((total / totalGeral) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
