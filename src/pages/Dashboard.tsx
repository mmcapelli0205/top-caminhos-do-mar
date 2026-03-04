import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, UsersRound, UserCheck, Radio, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

import CountdownSection from "@/components/inicio/CountdownSection";
import WeatherCard from "@/components/dashboard/WeatherCard";
import CalendarioMensal from "@/components/inicio/CalendarioMensal";

const ESCUDO_URL =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/Logo%20Caminhos%20do%20Mar%20Correto%20.png";

const LOGOS_EQUIPES: Record<string, string> = {
  ADM: "adm.png",
  Eventos: "eventos.png",
  Hakuna: "hakunas.png",
  Intercessão: "intercessao.png",
  Louvor: "intercessao.png",
  Logística: "logistica.png",
  Mídia: "midia.png",
  Comunicação: "midia.png",
  Segurança: "seguranca.png",
  Voz: "voz.png",
};
const ASSET_BASE =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";

/* ── Dashboard ────────────────────────────────────── */
const Dashboard = () => {
  const d = useDashboardData();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  // Fetch area data for logged-in user
  const { data: servidor } = useQuery({
    queryKey: ["dash-area", profile?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico")
        .eq("email", profile!.email)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  const areaName = servidor?.area_servico ?? null;

  const { data: areaData } = useQuery({
    queryKey: ["dash-area-info", areaName],
    queryFn: async () => {
      const { data } = await supabase
        .from("areas")
        .select("logo_url, cor, nome")
        .eq("nome", areaName!)
        .maybeSingle();
      return data;
    },
    enabled: !!areaName,
  });

  const areaCor = areaData?.cor ?? CORES_EQUIPES[areaName ?? ""] ?? "#6366f1";
  const areaLogoUrl = areaData?.logo_url
    ?? (areaName && LOGOS_EQUIPES[areaName] ? `${ASSET_BASE}${LOGOS_EQUIPES[areaName]}` : null);
  const areaInitials = areaName
    ? areaName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  const kpis = [
    { label: "SERVIDORES", value: d.totalServidores, color: "#F97316" },
    { label: "PARTICIPANTES", value: d.totalInscritos, color: "#A855F7" },
    { label: "FAMÍLIAS", value: d.familiasFormadas, color: "#EC4899" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">

      {/* ── HEADER ── */}
      <div className="text-center py-2">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          TOP #1575 — Caminhos do Mar
        </p>
        <p className="text-[10px] text-muted-foreground/40">02 – 05 Abril 2026</p>
      </div>

      {/* ── AREA SUPERIOR: 2 cols desktop, 1 col mobile ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="relative flex flex-col items-center gap-5 py-6">
          {/* AHU background text */}
          <span
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[180px] md:text-[12vw] font-black select-none pointer-events-none z-0 leading-none"
            style={{ color: "rgba(255,255,255,0.04)" }}
          >
            A H U
          </span>

          {/* Escudo Caminhos do Mar */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <img
              src={ESCUDO_URL}
              alt="Caminhos do Mar"
              className="h-[120px] w-auto object-contain"
            />
            <p className="text-sm font-bold text-foreground">TOP 1575</p>
            <p className="text-xs font-semibold" style={{ color: "#F97316" }}>
              Caminhos do Mar
            </p>
          </div>

          {/* Escudo da Área do Usuário */}
          {areaName && (
            <div
              className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => navigate(`/areas/${encodeURIComponent(areaName)}`)}
            >
              <div
                className="w-[130px] h-[130px] rounded-full flex items-center justify-center"
                style={{
                  border: `4px solid ${areaCor}`,
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                {areaLogoUrl && !imgError ? (
                  <img
                    src={areaLogoUrl}
                    alt={areaName}
                    className="w-[90px] h-[90px] object-contain rounded-full"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span
                    className="text-3xl font-bold"
                    style={{ color: getTextColor(areaCor) }}
                  >
                    {areaInitials}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-foreground">{areaName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-orange-400 transition-colors">
                Acessar minha área <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          )}

          {/* KPI counters */}
          <div className="relative z-10 flex gap-3 w-full max-w-sm">
            {kpis.map((k) => (
              <Card
                key={k.label}
                className="flex-1 border-white/[0.06] bg-white/[0.05] overflow-hidden"
              >
                <div className="h-[3px]" style={{ backgroundColor: k.color }} />
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {k.label}
                  </p>
                  {d.isLoading ? (
                    <Skeleton className="h-7 w-12 mx-auto mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
                      {k.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col items-center gap-5 py-6">
          {/* AMOR HONRA UNIDADE */}
          <div className="text-center">
            {["AMOR", "HONRA", "UNIDADE"].map((w) => (
              <p
                key={w}
                className="leading-tight"
                style={{
                  color: "#F97316",
                  fontSize: "clamp(28px, 3vw, 42px)",
                  fontWeight: 800,
                  letterSpacing: "6px",
                  textTransform: "uppercase" as const,
                  lineHeight: 1.2,
                }}
              >
                {w}
              </p>
            ))}
          </div>

          {/* Countdown */}
          <CountdownSection />

          {/* TOP Real Time button */}
          <button
            onClick={() => navigate("/top-real-time")}
            className="w-full max-w-sm group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:from-emerald-500/20 hover:via-emerald-500/10 transition-all duration-300 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/30 group-hover:ring-emerald-500/50 transition-all">
                  <Radio className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-400 tracking-wide">TOP REAL TIME</p>
                  <p className="text-[10px] text-emerald-400/50 font-medium">
                    Monitoramento ao vivo do evento
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <svg
                  className="h-4 w-4 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── AREA INFERIOR: Weather + Calendar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WeatherCard />
        <CalendarioMensal />
      </div>
    </div>
  );
};

export default Dashboard;
