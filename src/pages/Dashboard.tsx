import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Radio } from "lucide-react";
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
  Diretoria: "Logo%20Caminhos%20do%20Mar%20Correto%20.png",
};
const ASSET_BASE =
  "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";

const Dashboard = () => {
  const d = useDashboardData();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

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
  const areaLogoUrl =
    areaData?.logo_url ??
    (areaName && LOGOS_EQUIPES[areaName]
      ? `${ASSET_BASE}${LOGOS_EQUIPES[areaName]}`
      : null);
  const areaInitials = areaName
    ? areaName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  const kpis = [
    { label: "SERVIDORES", value: d.totalServidores, color: "#F97316" },
    { label: "PARTICIPANTES", value: d.totalInscritos, color: "#A855F7" },
    { label: "FAMÍLIAS", value: d.familiasFormadas, color: "#EC4899" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 px-2">
      {/* HEADER */}
      <div className="text-center py-2">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          TOP #1575 — Caminhos do Mar
        </p>
        <p className="text-[10px] text-muted-foreground/40">02 – 05 Abril 2026</p>
      </div>

      {/* ÁREA PRINCIPAL — 3 colunas desktop, 1 coluna mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
        {/* ═══ COLUNA ESQUERDA ═══ */}
        <div className="flex flex-col items-center gap-4 py-6">
          {/* AHU — elemento normal, não absolute */}
          <p
            className="text-[120px] font-black select-none leading-none tracking-[0.15em] mb-5"
            style={{ color: "rgba(255,255,255,0.06)" }}
          >
            AHU
          </p>

          {/* KPI cards empilhados */}
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            {kpis.map((k) => (
              <Card
                key={k.label}
                className="border-white/[0.06] bg-white/[0.05] overflow-hidden"
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

        {/* ═══ COLUNA CENTRAL ═══ */}
        <div className="flex flex-col items-center gap-4 py-6">
          {/* Escudo Caminhos do Mar */}
          <img
            src={ESCUDO_URL}
            alt="Caminhos do Mar"
            className="h-[120px] w-auto object-contain"
          />
          <div className="text-center -mt-2">
            <p className="text-sm font-bold text-foreground">TOP 1575</p>
            <p className="text-xs font-semibold" style={{ color: "#F97316" }}>
              Caminhos do Mar
            </p>
          </div>

          {/* Escudo da Área */}
          {areaName && (
            <div
              className="flex flex-col items-center gap-2 cursor-pointer group"
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
        </div>

        {/* ═══ COLUNA DIREITA ═══ */}
        <div className="flex flex-col items-start gap-5 py-6">
          {/* AMOR HONRA UNIDADE — elementos normais, text-align left */}
          <div className="select-none mb-2">
            {["AMOR", "HONRA", "UNIDADE"].map((w) => (
              <p
                key={w}
                className="text-[60px] font-black tracking-[6px] uppercase leading-tight"
                style={{ color: "rgba(255,255,255,0.06)" }}
              >
                {w}
              </p>
            ))}
          </div>

          {/* Contagem regressiva */}
          <CountdownSection />

          {/* TOP Real Time */}
          <button
            onClick={() => navigate("/top-real-time")}
            className="w-full max-w-sm group overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent hover:from-emerald-500/20 hover:via-emerald-500/10 transition-all duration-300 p-4"
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
                <ChevronRight className="h-4 w-4 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ÁREA INFERIOR — 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WeatherCard />
        <CalendarioMensal />
      </div>
    </div>
  );
};

export default Dashboard;
