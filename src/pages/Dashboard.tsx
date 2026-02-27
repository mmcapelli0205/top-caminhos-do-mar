import {
  Users, UsersRound, Bell, UserCheck, Radio,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { isServidorComum } from "@/lib/auth";
import type { LucideIcon } from "lucide-react";

import CountdownSection from "@/components/inicio/CountdownSection";
import QuickActions from "@/components/inicio/QuickActions";
import MuralAvisos from "@/components/inicio/MuralAvisos";
import CalendarioMensal from "@/components/inicio/CalendarioMensal";
import WeatherCard from "@/components/dashboard/WeatherCard";

/* ── Notion-style KPI Card ── */
function KpiCard({
  title, value, icon: Icon, accentColor, isLoading,
}: {
  title: string; value: string | number; icon: LucideIcon; accentColor: string; isLoading: boolean;
}) {
  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
      )}
    </div>
  );
}

/* ── TOP Real Time Card ── */
function TopRealTimeCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLive = new Date() >= new Date("2026-04-02") || searchParams.get("debug") === "true";

  return (
    <div
      className={`group cursor-pointer rounded-lg border border-border bg-card p-6 transition-all hover:bg-accent/50 flex flex-col items-center justify-center text-center h-full ${
        !isLive ? "opacity-40 pointer-events-none" : ""
      }`}
      onClick={() => isLive && navigate("/top-real-time")}
    >
      <div className="relative mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <Radio className="h-6 w-6 text-emerald-400" />
        </div>
        {isLive && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 animate-pulse ring-2 ring-card" />
        )}
      </div>
      <p className="text-lg font-semibold">
        <span className="text-foreground">TOP </span>
        <span className="text-emerald-400">Real-Time</span>
      </p>
      <p className="text-sm text-muted-foreground mt-1">Acompanhamento ao vivo</p>
      {isLive ? (
        <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> AO VIVO
        </span>
      ) : (
        <span className="inline-flex items-center mt-3 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          Em breve
        </span>
      )}
    </div>
  );
}

/* ── Dashboard ── */
const Dashboard = () => {
  const d = useDashboardData();
  const { profile, role } = useAuth();
  const isServidor = isServidorComum(role ?? profile?.cargo ?? null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        <img
          src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="Caminhos do Mar"
          className="h-36 w-36 object-contain drop-shadow-lg"
        />
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">TOP Manager</h1>
          <p className="text-base font-medium text-primary mt-1">TOP 1575 — Caminhos do Mar</p>
        </div>
      </div>

      {/* ── Countdown + Card Equipe + TopRealTime ── */}
      <div className={`grid grid-cols-1 ${isServidor ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4`}>
        <CountdownSection />
        <QuickActions userEmail={profile?.email ?? null} />
        {!isServidor && <TopRealTimeCard />}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard title="Participantes" value={d.totalInscritos} icon={Users} accentColor="#E8731A" isLoading={d.isLoading} />
        <KpiCard title="Servidores" value={d.totalServidores} icon={UserCheck} accentColor="#22c55e" isLoading={d.isLoading} />
        <KpiCard title="Famílias" value={`${d.familiasFormadas}`} icon={UsersRound} accentColor="#a855f7" isLoading={d.isLoading} />
        <KpiCard title="Avisos" value={d.avisosRecentes} icon={Bell} accentColor="#eab308" isLoading={d.isLoading} />
      </div>

      {/* ── Weather ── */}
      <WeatherCard />

      {/* ── Avisos + Calendário ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MuralAvisos />
        <CalendarioMensal />
      </div>
    </div>
  );
};

export default Dashboard;
