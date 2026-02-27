import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown, BarChart3, Check } from "lucide-react";
import jsPDF from "jspdf";
import RelatorioConsolidado from "./RelatorioConsolidado";
import { toast } from "sonner";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
  "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#e11d48",
  "#a855f7", "#22d3ee", "#eab308", "#64748b",
  "#059669", "#dc2626", "#7c3aed",
];

const BADGE_COLORS = [
  "bg-blue-100 text-blue-800", "bg-red-100 text-red-800", "bg-amber-100 text-amber-800",
  "bg-yellow-100 text-yellow-800", "bg-emerald-100 text-emerald-800", "bg-indigo-100 text-indigo-800",
  "bg-pink-100 text-pink-800", "bg-violet-100 text-violet-800", "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800", "bg-cyan-100 text-cyan-800", "bg-lime-100 text-lime-800",
  "bg-rose-100 text-rose-800", "bg-purple-100 text-purple-800", "bg-sky-100 text-sky-800",
  "bg-yellow-100 text-yellow-700", "bg-slate-100 text-slate-800",
  "bg-green-100 text-green-800", "bg-fuchsia-100 text-fuchsia-800", "bg-stone-100 text-stone-800",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Config keys
const KEY_TAXA_TICKET = "taxa_ticket_and_go_valor";
const KEY_TAXA_GLOBAL = "taxa_global_percentual";
const KEY_TAXA_TOP = "taxa_top_valor";
const KEY_RECEITA_REAL = "receita_real_valor";

const ResumoSection = () => {
  const queryClient = useQueryClient();
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // Load persisted configs
  const { data: configs } = useQuery({
    queryKey: ["configuracoes-financeiras"],
    queryFn: async () => {
      const { data } = await supabase
        .from("configuracoes_financeiras")
        .select("chave, valor");
      return data ?? [];
    },
  });

  const getConfigVal = useCallback((key: string, fallback: number) => {
    const found = configs?.find((c) => c.chave === key);
    return found?.valor ?? fallback;
  }, [configs]);

  const [taxaTicketVal, setTaxaTicketVal] = useState<number>(0);
  const [globalPercent, setGlobalPercent] = useState<number>(0);
  const [taxaTopVal, setTaxaTopVal] = useState<number>(4125);
  const [receitaRealVal, setReceitaRealVal] = useState<number>(0);

  // Sync state from DB
  useEffect(() => {
    if (configs) {
      setTaxaTicketVal(getConfigVal(KEY_TAXA_TICKET, 0));
      setGlobalPercent(getConfigVal(KEY_TAXA_GLOBAL, 0));
      setTaxaTopVal(getConfigVal(KEY_TAXA_TOP, 4125));
      setReceitaRealVal(getConfigVal(KEY_RECEITA_REAL, 0));
    }
  }, [configs, getConfigVal]);

  // Upsert mutation
  const upsertConfig = useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: number }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("configuracoes_financeiras")
        .select("id")
        .eq("chave", chave)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("configuracoes_financeiras")
          .update({ valor, updated_at: new Date().toISOString() })
          .eq("chave", chave);
      } else {
        await supabase
          .from("configuracoes_financeiras")
          .insert({ chave, valor });
      }
    },
    onSuccess: (_, { chave }) => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-financeiras"] });
      setSavedKeys((prev) => ({ ...prev, [chave]: true }));
      setTimeout(() => setSavedKeys((prev) => ({ ...prev, [chave]: false })), 2000);
    },
    onError: () => {
      toast.error("Erro ao salvar configuração");
    },
  });

  const saveField = (chave: string, valor: number) => {
    upsertConfig.mutate({ chave, valor });
  };

  const handleKeyDown = (e: React.KeyboardEvent, chave: string, valor: number) => {
    if (e.key === "Enter") {
      saveField(chave, valor);
      (e.target as HTMLInputElement).blur();
    }
  };

  const { data: participantes } = useQuery({
    queryKey: ["fin-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("valor_pago, status");
      return data ?? [];
    },
  });

  const { data: servidores } = useQuery({
    queryKey: ["fin-servidores-resumo"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("valor_pago, status");
      return data ?? [];
    },
  });

  const { data: doacoes } = useQuery({
    queryKey: ["fin-doacoes"],
    queryFn: async () => {
      const { data } = await supabase.from("doacoes").select("valor");
      return data ?? [];
    },
  });

  const { data: despesas } = useQuery({
    queryKey: ["fin-despesas-resumo"],
    queryFn: async () => {
      const { data } = await supabase.from("despesas").select("valor, categoria");
      return data ?? [];
    },
  });

  // Revenue calculations
  const receitaParticipantes = (participantes ?? [])
    .filter((p) => p.status !== "cancelado")
    .reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const receitaServidores = (servidores ?? [])
    .reduce((s, p) => s + ((p as any).valor_pago ?? 0), 0);
  const receitaDoacoes = (doacoes ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);
  const receitaBruta = receitaParticipantes + receitaServidores + receitaDoacoes;

  // Tax calculations
  const taxaGlobalCalc = receitaParticipantes * (globalPercent / 100);
  const totalTaxas = taxaTicketVal + taxaGlobalCalc + taxaTopVal;
  const receitaLiquida = receitaBruta - totalTaxas;

  // Saldo: use Receita Real if set, otherwise Receita Líquida
  const despesaTotal = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);
  const receitaBase = receitaRealVal > 0 ? receitaRealVal : receitaLiquida;
  const saldo = receitaBase - despesaTotal;
  const despesaPercent = receitaBase > 0 ? (despesaTotal / receitaBase * 100).toFixed(1) : "0.0";

  // Diferença
  const diferenca = receitaLiquida - receitaRealVal;

  // category map
  const catMap = new Map<string, number>();
  (despesas ?? []).forEach((d) => {
    const cat = d.categoria || "Sem categoria";
    catMap.set(cat, (catMap.get(cat) ?? 0) + (d.valor ?? 0));
  });
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const barData = [
    { name: "Receita Base", valor: receitaBase },
    { name: "Despesas", valor: despesaTotal },
  ];

  const categoryBadges = pieData.map((d, i) => ({
    cat: d.name,
    value: d.value,
    colorIdx: i,
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text("TOP Caminhos do Mar #1575 | 02 a 05 de Abril de 2026", 14, y);
    y += 12;

    doc.setFontSize(12);
    doc.text("RECEITA", 14, y); y += 8;
    doc.setFontSize(10);
    doc.text(`Inscrições Participantes: ${fmt(receitaParticipantes)}`, 18, y); y += 6;
    doc.text(`Inscrições Servidores: ${fmt(receitaServidores)}`, 18, y); y += 6;
    doc.text(`Doações: ${fmt(receitaDoacoes)}`, 18, y); y += 6;
    doc.text(`Total Bruto: ${fmt(receitaBruta)}`, 18, y); y += 6;
    doc.text(`Taxa Ticket and Go: -${fmt(taxaTicketVal)}`, 18, y); y += 6;
    doc.text(`Taxa Global (${globalPercent}%) sobre Part: -${fmt(taxaGlobalCalc)}`, 18, y); y += 6;
    doc.text(`Taxa do TOP: -${fmt(taxaTopVal)}`, 18, y); y += 6;
    doc.setFontSize(11);
    doc.text(`Receita Líquida: ${fmt(receitaLiquida)}`, 18, y); y += 6;
    if (receitaRealVal > 0) {
      doc.text(`Receita Real: ${fmt(receitaRealVal)}`, 18, y); y += 6;
    }
    y += 6;

    doc.setFontSize(12);
    doc.text("DESPESAS POR CATEGORIA", 14, y); y += 8;
    doc.setFontSize(10);
    categoryBadges.forEach((c) => {
      doc.text(`${c.cat}: ${fmt(c.value)}`, 18, y); y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 4;
    doc.setFontSize(11);
    doc.text(`Total Despesas: ${fmt(despesaTotal)}`, 18, y); y += 12;

    doc.setFontSize(13);
    const prefix = saldo >= 0 ? "+" : "";
    doc.text(`RESULTADO FINAL: ${prefix}${fmt(saldo)}`, 14, y);

    doc.save("balanco-financeiro-top1575.pdf");
  };

  const SavedIndicator = ({ configKey }: { configKey: string }) => {
    if (!savedKeys[configKey]) return null;
    return <span className="text-green-500 text-xs flex items-center gap-0.5 ml-1 animate-in fade-in"><Check className="h-3 w-3" /> Salvo</span>;
  };

  if (showRelatorio) {
    return <RelatorioConsolidado onBack={() => setShowRelatorio(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRelatorio(true)}>
            <BarChart3 className="h-4 w-4 mr-1" /> Relatório Consolidado
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Receita Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">Total Bruto: <span className="font-medium">{fmt(receitaBruta)}</span></p>
            <p className="text-xs text-muted-foreground">
              Part: {fmt(receitaParticipantes)} | Serv: {fmt(receitaServidores)} | Doações: {fmt(receitaDoacoes)}
            </p>

            {/* Taxa Ticket and Go — R$ fixo */}
            <div className="flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap">Taxa Ticket and Go: R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={taxaTicketVal}
                onChange={(e) => setTaxaTicketVal(parseFloat(e.target.value) || 0)}
                onBlur={() => saveField(KEY_TAXA_TICKET, taxaTicketVal)}
                onKeyDown={(e) => handleKeyDown(e, KEY_TAXA_TICKET, taxaTicketVal)}
                className="w-28 h-7 text-center text-sm px-1"
              />
              <span className="text-destructive ml-auto whitespace-nowrap">-{fmt(taxaTicketVal)}</span>
              <SavedIndicator configKey={KEY_TAXA_TICKET} />
            </div>

            {/* Taxa Global — % sobre participantes */}
            <div className="flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap">Taxa Global:</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={globalPercent}
                onChange={(e) => setGlobalPercent(parseFloat(e.target.value) || 0)}
                onBlur={() => saveField(KEY_TAXA_GLOBAL, globalPercent)}
                onKeyDown={(e) => handleKeyDown(e, KEY_TAXA_GLOBAL, globalPercent)}
                className="w-16 h-7 text-center text-sm px-1"
              />
              <span>%</span>
              <span className="text-destructive ml-auto whitespace-nowrap">-{fmt(taxaGlobalCalc)}</span>
              <SavedIndicator configKey={KEY_TAXA_GLOBAL} />
            </div>
            <p className="text-xs text-muted-foreground italic">Global incide apenas sobre participantes (senderistas)</p>

            {/* Taxa do TOP — R$ fixo */}
            <div className="flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap">Taxa do TOP: R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={taxaTopVal}
                onChange={(e) => setTaxaTopVal(parseFloat(e.target.value) || 0)}
                onBlur={() => saveField(KEY_TAXA_TOP, taxaTopVal)}
                onKeyDown={(e) => handleKeyDown(e, KEY_TAXA_TOP, taxaTopVal)}
                className="w-28 h-7 text-center text-sm px-1"
              />
              <span className="text-destructive ml-auto whitespace-nowrap">-{fmt(taxaTopVal)}</span>
              <SavedIndicator configKey={KEY_TAXA_TOP} />
            </div>

            <hr className="border-border my-1" />

            {/* Receita Líquida */}
            <p className="text-lg font-bold text-green-600 pt-1">
              Líquida: {fmt(receitaLiquida)}
            </p>

            {/* Receita Real */}
            <div className="flex items-center gap-2 text-sm">
              <span className="whitespace-nowrap font-medium text-green-600">Receita Real: R$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={receitaRealVal}
                onChange={(e) => setReceitaRealVal(parseFloat(e.target.value) || 0)}
                onBlur={() => saveField(KEY_RECEITA_REAL, receitaRealVal)}
                onKeyDown={(e) => handleKeyDown(e, KEY_RECEITA_REAL, receitaRealVal)}
                className="w-32 h-7 text-center text-sm px-1"
              />
              <SavedIndicator configKey={KEY_RECEITA_REAL} />
            </div>

            {/* Diferença */}
            {receitaRealVal > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="whitespace-nowrap font-medium">Diferença:</span>
                {diferenca === 0 ? (
                  <span className="text-green-600 font-medium">{fmt(0)} ✓</span>
                ) : diferenca > 0 ? (
                  <span className="text-amber-500 font-medium">{fmt(diferenca)} a verificar</span>
                ) : (
                  <span className="text-green-600 font-medium">Recebeu {fmt(Math.abs(diferenca))} a mais que o calculado</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Despesa Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Despesa Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{fmt(despesaTotal)}</p>
          </CardContent>
        </Card>

        {/* Saldo Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(saldo)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Base: {receitaRealVal > 0 ? "Receita Real" : "Receita Líquida"} — Despesas representam {despesaPercent}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma despesa registrada</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {categoryBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {categoryBadges.map((c) => (
                  <Badge
                    key={c.cat}
                    variant="outline"
                    className={`${BADGE_COLORS[c.colorIdx % BADGE_COLORS.length]} border-0`}
                  >
                    {c.cat}: {fmt(c.value)}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Receita vs Despesa</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumoSection;
