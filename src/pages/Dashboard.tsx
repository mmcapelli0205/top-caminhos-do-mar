import {
  Users, UsersRound, Bell, UserCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
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

/* ── KPI Card ─────────────────────────────────────── */
function KpiCard({
  title, value, icon: Icon, color, isLoading,
}: {
  title: string; value: string | number; icon: LucideIcon; color: string; isLoading: boolean;
}) {
  return (
    <Card className="border-white/[0.06] overflow-hidden relative group hover:border-white/[0.12] transition-all duration-200 bg-white/[0.02]">
      {/* Left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ backgroundColor: color }} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            )}
          </div>
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color + "12" }}
          >
            <Icon className="h-[18px] w-[18px]" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Dashboard ────────────────────────────────────── */
const Dashboard = () => {
  const d = useDashboardData();
  const { profile, role } = useAuth();
  const isServidor = isServidorComum(role ?? profile?.cargo ?? null);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ─ HERO: Logo + Nome ─ */}
      <div className="flex flex-col items-center text-center gap-1.5 pt-2">
        <img
          src="https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/logo.png"
          alt="Caminhos do Mar"
          className="h-20 w-20 md:h-24 md:w-24 object-contain"
        />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">TOP Manager</h1>
          <p className="text-xs font-semibold text-orange-500/90">TOP 1575 — Caminhos do Mar</p>
        </div>
      </div>

      {/* ─ ROW: Countdown | Equipe Logo | Countdown acts together ─ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <CountdownSection />

        {/* Central: Logo da Equipe do Servidor */}
        <QuickActions userEmail={profile?.email ?? null} />

        {/* Right: Weather compacto no lugar do antigo TOP Real-Time */}
        <WeatherCard />
      </div>

      {/* ─ KPIs ─ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Participantes" value={d.totalInscritos} icon={Users} color="#E8731A" isLoading={d.isLoading} />
        <KpiCard title="Servidores" value={d.totalServidores} icon={UserCheck} color="#22C55E" isLoading={d.isLoading} />
        <KpiCard title="Famílias" value={d.familiasFormadas} icon={UsersRound} color="#A855F7" isLoading={d.isLoading} />
        <KpiCard title="Avisos" value={d.avisosRecentes} icon={Bell} color="#3B82F6" isLoading={d.isLoading} />
      </div>

      {/* ─ Avisos + Calendário ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MuralAvisos />
        <CalendarioMensal />
      </div>
    </div>
  );
};

export default Dashboard;
