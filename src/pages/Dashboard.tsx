import {
  Users, UsersRound, Radio, Bell, UserCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import type { LucideIcon } from "lucide-react";

import CountdownSection from "@/components/inicio/CountdownSection";
import QuickActions from "@/components/inicio/QuickActions";
import MuralAvisos from "@/components/inicio/MuralAvisos";
import CalendarioMensal from "@/components/inicio/CalendarioMensal";
import WeatherCard from "@/components/dashboard/WeatherCard";

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
      className={`cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-600/30 ${!isLive ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => isLive && navigate("/top-real-time")}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="relative mb-2">
          <Radio className="h-8 w-8 text-red-500" />
          {isLive && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
        </div>
        <p className="text-xl font-bold">
          <span className="text-foreground">TOP </span>
          <span className="text-green-400">Real-Time</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">Acompanhamento ao vivo</p>
        {isLive ? (
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> AO VIVO
          </span>
        ) : (
          <span className="inline-flex items-center mt-2 text-xs text-muted-foreground">Em breve</span>
        )}
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  const d = useDashboardData();
  const { profile } = useAuth();

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

      {/* Countdown + Card Equipe + TopRealTime */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CountdownSection />
        <QuickActions userEmail={profile?.email ?? null} />
        <TopRealTimeCard />
      </div>

      {/* KPIs simplificados */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Participantes" value={d.totalInscritos} icon={Users} borderColor="hsl(27, 82%, 50%)" isLoading={d.isLoading} />
        <KpiCard title="Total Servidores" value={d.totalServidores} icon={UserCheck} borderColor="hsl(142, 70%, 45%)" isLoading={d.isLoading} />
        <KpiCard title="Famílias Formadas" value={`${d.familiasFormadas} famílias`} icon={UsersRound} borderColor="hsl(270, 60%, 55%)" isLoading={d.isLoading} />
        <KpiCard title="Avisos Recentes" value={d.avisosRecentes} icon={Bell} borderColor="hsl(45, 90%, 55%)" isLoading={d.isLoading} />
      </div>

      {/* Weather */}
      <WeatherCard />

      {/* Avisos + Calendário lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MuralAvisos />
        <CalendarioMensal />
      </div>
    </div>
  );
};

export default Dashboard;
