import {
  Users, FileCheck, AlertTriangle, QrCode,
  UsersRound, Radio,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import type { LucideIcon } from "lucide-react";

import CountdownSection from "@/components/inicio/CountdownSection";
import QuickActions from "@/components/inicio/QuickActions";
import MuralAvisos from "@/components/inicio/MuralAvisos";
import CalendarioMensal from "@/components/inicio/CalendarioMensal";

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

function TopRealTimeCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLive = new Date() >= new Date("2026-04-02") || searchParams.get("debug") === "true";

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${!isLive ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => isLive && navigate("/top-real-time")}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">TOP Real Time</CardTitle>
        <div className="relative">
          <Radio className="h-5 w-5 text-red-500" />
          {isLive && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-bold text-foreground">Acompanhamento ao vivo</p>
        {isLive ? (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> AO VIVO
          </span>
        ) : (
          <span className="inline-flex items-center mt-1 text-xs text-muted-foreground">Em breve</span>
        )}
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  const d = useDashboardData();
  const { profile } = useAuth();

  const pct = (part: number, total: number) =>
    total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;

  return (
    <div className="space-y-6">
      {/* Header centralizado */}
      <div className="flex flex-col items-center text-center gap-3">
        <img
          src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="Caminhos do Mar"
          className="h-32 w-32 object-contain"
        />
        <h1 className="text-4xl font-bold text-foreground">TOP Manager</h1>
        <p className="text-xl font-semibold text-orange-500">TOP 1575 — Caminhos do Mar</p>
      </div>

      {/* Countdown + Card Equipe lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CountdownSection />
        <QuickActions userEmail={profile?.email ?? null} />
        <TopRealTimeCard />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard title="Total Inscritos" value={d.totalInscritos} icon={Users} borderColor="hsl(27 82% 50%)" isLoading={d.isLoading} />
        <KpiCard title="Contratos Assinados" value={`${d.contratosAssinados}/${d.totalInscritos} (${pct(d.contratosAssinados, d.totalInscritos)})`} icon={FileCheck} borderColor="hsl(142 70% 45%)" isLoading={d.isLoading} />
        <KpiCard title="Ergométricos Pendentes" value={d.ergometricosPendentes} icon={AlertTriangle} borderColor={d.ergometricosPendentes > 0 ? "hsl(0 70% 50%)" : "hsl(220 10% 55%)"} isLoading={d.isLoading} />
        <KpiCard title="Check-ins Realizados" value={`${d.checkinsRealizados}/${d.totalInscritos} (${pct(d.checkinsRealizados, d.totalInscritos)})`} icon={QrCode} borderColor="hsl(210 80% 55%)" isLoading={d.isLoading} />
        <KpiCard title="Famílias Formadas" value={`${d.familiasFormadas} famílias`} icon={UsersRound} borderColor="hsl(270 60% 55%)" isLoading={d.isLoading} />
      </div>

      {/* Avisos + Calendário lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MuralAvisos />
        <CalendarioMensal />
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status dos Participantes</CardTitle>
          </CardHeader>
          <CardContent>
            {d.isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={Object.fromEntries(d.statusData.map(s => [s.name, { label: s.name, color: STATUS_COLORS[s.name] ?? "hsl(220 10% 55%)" }]))} className="h-[220px] w-full">
                <PieChart>
                  <Pie data={d.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {d.statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "hsl(220 10% 55%)"} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
