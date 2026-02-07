import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
  "#14b8a6", "#f97316", "#06b6d4", "#84cc16", "#e11d48",
  "#a855f7", "#22d3ee", "#eab308", "#64748b",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ResumoSection = () => {
  const { data: participantes } = useQuery({
    queryKey: ["fin-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("valor_pago, status");
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

  const receitaInscricoes = (participantes ?? [])
    .filter((p) => p.status !== "cancelado")
    .reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const receitaDoacoes = (doacoes ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);
  const receitaTotal = receitaInscricoes + receitaDoacoes;

  const despesaTotal = (despesas ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);
  const saldo = receitaTotal - despesaTotal;

  // pie data
  const catMap = new Map<string, number>();
  (despesas ?? []).forEach((d) => {
    const cat = d.categoria || "Sem categoria";
    catMap.set(cat, (catMap.get(cat) ?? 0) + (d.valor ?? 0));
  });
  const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const barData = [
    { name: "Receita", valor: receitaTotal },
    { name: "Despesas", valor: despesaTotal },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(receitaTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Despesa Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{fmt(despesaTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

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
