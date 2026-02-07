import {
  Users, FileCheck, AlertTriangle, QrCode,
  UsersRound, DollarSign, LayoutDashboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { LucideIcon } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  inscrito: "hsl(45 90% 55%)",
  confirmado: "hsl(142 70% 45%)",
  cancelado: "hsl(0 70% 50%)",
};

function KpiCard({
  title, value, icon: Icon, borderColor, isLoading,
}: {
  title: string; value: string | number; icon: LucideIcon; borderColor: string; isLoading: boolean;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: borderColor }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5" style={{ color: borderColor }} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const Dashboard = () => {
  const d = useDashboardData();

  const pct = (part: number, total: number) =>
    total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Inscritos"
          value={d.totalInscritos}
          icon={Users}
          borderColor="hsl(27 82% 50%)"
          isLoading={d.isLoading}
        />
        <KpiCard
          title="Contratos Assinados"
          value={`${d.contratosAssinados}/${d.totalInscritos} (${pct(d.contratosAssinados, d.totalInscritos)})`}
          icon={FileCheck}
          borderColor="hsl(142 70% 45%)"
          isLoading={d.isLoading}
        />
        <KpiCard
          title="Ergométricos Pendentes"
          value={d.ergometricosPendentes}
          icon={AlertTriangle}
          borderColor={d.ergometricosPendentes > 0 ? "hsl(0 70% 50%)" : "hsl(220 10% 55%)"}
          isLoading={d.isLoading}
        />
        <KpiCard
          title="Check-ins Realizados"
          value={`${d.checkinsRealizados}/${d.totalInscritos} (${pct(d.checkinsRealizados, d.totalInscritos)})`}
          icon={QrCode}
          borderColor="hsl(210 80% 55%)"
          isLoading={d.isLoading}
        />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Famílias Formadas</CardTitle>
            <UsersRound className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {d.isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">{d.familiasFormadas} famílias</p>
                <p className="text-sm text-muted-foreground">{d.participantesAlocados} participantes alocados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Balanço Financeiro</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {d.isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <p className={`text-2xl font-bold ${d.balanco >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {fmt(d.balanco)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Receita: {fmt(d.receita)} · Despesas: {fmt(d.totalDespesas)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Participantes por Faixa Etária</CardTitle>
          </CardHeader>
          <CardContent>
            {d.isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={{ total: { label: "Participantes", color: "hsl(27 82% 50%)" } }} className="h-[220px] w-full">
                <BarChart data={d.ageData}>
                  <XAxis dataKey="faixa" tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(220 10% 55%)", fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="hsl(27 82% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status dos Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            {d.isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {d.statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(220 10% 55%)"} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
