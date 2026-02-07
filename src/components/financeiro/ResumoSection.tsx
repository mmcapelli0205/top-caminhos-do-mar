import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

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

const ALL_CATEGORIAS = [
  "Administrativas", "Juridicas", "Papelaria", "Comunicação", "Equipamentos",
  "Combustível", "Montanha", "Locação da Base", "Banheiros Químicos",
  "Fogos/Decoração", "Fardas", "Gorras", "Patchs", "Pins",
  "Taxa Global", "Taxa Ticket and Go", "Diversos",
  "MRE", "Ceia do Rei", "Bebidas",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ResumoSection = () => {
  const [ticketPercent, setTicketPercent] = useState(10);
  const [globalPercent, setGlobalPercent] = useState(0);

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

  // Tax calculations — differentiated
  const taxaTicketPart = receitaParticipantes * (ticketPercent / 100);
  const taxaTicketServ = receitaServidores * (ticketPercent / 100);
  const taxaGlobalPart = receitaParticipantes * (globalPercent / 100);
  const totalTaxas = taxaTicketPart + taxaTicketServ + taxaGlobalPart;
  const receitaLiquida = receitaBruta - totalTaxas;

  const despesaTotal = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);
  const saldo = receitaLiquida - despesaTotal;
  const despesaPercent = receitaLiquida > 0 ? (despesaTotal / receitaLiquida * 100).toFixed(1) : "0.0";

  // category map
  const catMap = new Map<string, number>();
  (despesas ?? []).forEach((d) => {
    const cat = d.categoria || "Sem categoria";
    catMap.set(cat, (catMap.get(cat) ?? 0) + (d.valor ?? 0));
  });
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const barData = [
    { name: "Receita Líq.", valor: receitaLiquida },
    { name: "Despesas", valor: despesaTotal },
  ];

  const categoryBadges = ALL_CATEGORIAS
    .map((cat, i) => ({ cat, value: catMap.get(cat) ?? 0, colorIdx: i }))
    .filter((c) => c.value > 0);

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
    doc.text(`Taxa Ticket and Go (${ticketPercent}%) sobre Part+Serv: -${fmt(taxaTicketPart + taxaTicketServ)}`, 18, y); y += 6;
    doc.text(`Taxa Global (${globalPercent}%) sobre Part: -${fmt(taxaGlobalPart)}`, 18, y); y += 6;
    doc.setFontSize(11);
    doc.text(`Receita Líquida: ${fmt(receitaLiquida)}`, 18, y); y += 12;

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

  return (
    <div className="space-y-6">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
        <Button variant="outline" size="sm" onClick={exportPDF}>
          <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
        </Button>
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
            {/* Ticket and Go tax */}
            <div className="flex items-center gap-2 text-sm">
              <span>Taxa Ticket and Go:</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={ticketPercent}
                onChange={(e) => setTicketPercent(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-center text-sm px-1"
              />
              <span>%</span>
              <span className="text-destructive ml-auto">-{fmt(taxaTicketPart + taxaTicketServ)}</span>
            </div>
            {/* Global tax */}
            <div className="flex items-center gap-2 text-sm">
              <span>Taxa Global:</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={globalPercent}
                onChange={(e) => setGlobalPercent(parseFloat(e.target.value) || 0)}
                className="w-16 h-7 text-center text-sm px-1"
              />
              <span>%</span>
              <span className="text-destructive ml-auto">-{fmt(taxaGlobalPart)}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">Global incide apenas sobre participantes</p>
            <p className="text-lg font-bold text-green-600 pt-1">
              Líquida: {fmt(receitaLiquida)}
            </p>
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
              Despesas representam {despesaPercent}% da Receita
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
