import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays } from "date-fns";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CAT_COLORS = [
  "hsl(27 82% 50%)", "hsl(142 70% 45%)", "hsl(210 80% 55%)", "hsl(0 70% 50%)",
  "hsl(45 90% 55%)", "hsl(270 60% 55%)", "hsl(180 60% 45%)", "hsl(330 70% 50%)",
];

export default function AdmFinanceiroDashboard() {
  const { data: participantes = [] } = useQuery({
    queryKey: ["adm-fin-participantes"],
    queryFn: async () => {
      const { data } = await supabase.from("participantes").select("valor_pago, status");
      return data ?? [];
    },
  });

  const { data: servidores = [] } = useQuery({
    queryKey: ["adm-fin-servidores"],
    queryFn: async () => {
      const { data } = await supabase.from("servidores").select("valor_pago");
      return data ?? [];
    },
  });

  const { data: doacoes = [] } = useQuery({
    queryKey: ["adm-fin-doacoes"],
    queryFn: async () => {
      const { data } = await supabase.from("doacoes").select("valor");
      return data ?? [];
    },
  });

  const { data: despesas = [], isLoading } = useQuery({
    queryKey: ["adm-fin-despesas"],
    queryFn: async () => {
      const { data } = await supabase.from("despesas").select("*").eq("auto_calculado", false).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: pedidosPendentes = [] } = useQuery({
    queryKey: ["adm-fin-pedidos-pendentes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos_orcamentos")
        .select("valor_total_estimado, status, data_solicitacao")
        .in("status", ["aguardando", "em_orcamento", "aprovado"]);
      return data ?? [];
    },
  });

  const receitaParticipantes = participantes.reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const receitaServidores = servidores.reduce((s, p) => s + (p.valor_pago ?? 0), 0);
  const receitaDoacoes = doacoes.reduce((s, d) => s + (d.valor ?? 0), 0);
  const receita = receitaParticipantes + receitaServidores + receitaDoacoes;

  const totalDespesas = despesas.reduce((s, d) => s + (d.valor ?? 0), 0);
  const saldo = receita - totalDespesas;

  const totalPedidosPendentes = pedidosPendentes.reduce((s, p) => s + (p.valor_total_estimado ?? 0), 0);
  const budgetComprometido = saldo - totalPedidosPendentes;

  // Despesas por categoria
  const catMap: Record<string, number> = {};
  despesas.forEach((d) => {
    const cat = d.categoria ?? "Outros";
    catMap[cat] = (catMap[cat] ?? 0) + (d.valor ?? 0);
  });
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Últimas 5 despesas
  const ultimasDespesas = despesas.slice(0, 5);

  // Alertas
  const pedidosUrgentes = pedidosPendentes.filter((p) => {
    if (!p.data_solicitacao) return false;
    return differenceInDays(new Date(), new Date(p.data_solicitacao)) > 7;
  });
  const despesasAltas = receita > 0 && totalDespesas / receita > 0.8;

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" /> Dashboard Financeiro
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-green-500">{fmt(receita)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Despesa Total</p>
            <p className="text-lg font-bold text-red-500">{fmt(totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${saldo >= 0 ? "border-l-green-500" : "border-l-red-500"}`}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Saldo {saldo >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </p>
            <p className={`text-lg font-bold ${saldo >= 0 ? "text-green-500" : "text-red-500"}`}>{fmt(saldo)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Pedidos Pend.</p>
            <p className="text-lg font-bold text-amber-500">{fmt(totalPedidosPendentes)}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${budgetComprometido >= 0 ? "border-l-blue-500" : "border-l-red-500"}`}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Budget Comprom.</p>
            <p className={`text-lg font-bold ${budgetComprometido >= 0 ? "text-blue-500" : "text-red-500"}`}>{fmt(budgetComprometido)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(pedidosUrgentes.length > 0 || despesasAltas) && (
        <div className="flex flex-wrap gap-3">
          {pedidosUrgentes.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/10 flex-1 min-w-[200px]">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                <span className="text-sm text-red-400 font-medium">{pedidosUrgentes.length} pedido(s) sem orçamento há mais de 7 dias</span>
              </CardContent>
            </Card>
          )}
          {despesasAltas && (
            <Card className="border-amber-500/50 bg-amber-500/10 flex-1 min-w-[200px]">
              <CardContent className="p-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-400 font-medium">Despesas ultrapassaram 80% da receita</span>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart */}
        {catData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={Object.fromEntries(catData.map((c, i) => [c.name, { label: c.name, color: CAT_COLORS[i % CAT_COLORS.length] }]))}
                className="h-[220px] w-full"
              >
                <BarChart data={catData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(220 10% 55%)", fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Últimas Despesas */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Últimas Despesas</CardTitle>
            <Link to="/financeiro" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {ultimasDespesas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa registrada</p>
            ) : (
              <div className="space-y-2">
                {ultimasDespesas.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.item ?? d.descricao}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{d.categoria ?? "-"}</Badge>
                        <span className="text-xs text-muted-foreground">{d.data_aquisicao ?? "-"}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold ml-2">{fmt(d.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
