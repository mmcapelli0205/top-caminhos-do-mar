import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KMZ_PONTOS, KMZ_ROTAS, ICONE_TIPO, COR_DIA, type DiaTipo } from "@/data/kmzData";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

// Fix Leaflet default icons in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const CENTER: [number, number] = [-23.862, -46.462];
const DIAS: { key: DiaTipo; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "d1", label: "D1" },
  { key: "d2", label: "D2" },
  { key: "d3", label: "D3" },
  { key: "d4", label: "D4" },
  { key: "logistica", label: "Log" },
];

function criarIconePonto(emoji: string, cor: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;background:${cor};
      border:2px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.5);
      cursor:pointer;">${emoji}</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function criarIconeEquipe(cor: string, nome: string): L.DivIcon {
  const initials = nome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const textColor = getTextColor(cor);
  return L.divIcon({
    html: `<div style="
      width:30px;height:30px;background:${cor};
      border:2px solid white;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:bold;color:${textColor};
      box-shadow:0 2px 4px rgba(0,0,0,0.5);">${initials}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function criarIconeMinhaPosicao(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:16px;height:16px;background:#3B82F6;
      border:3px solid white;border-radius:50%;
      box-shadow:0 0 0 2px #3B82F6, 0 2px 8px rgba(0,0,0,0.5);"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function CentralizarMapa({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(pos, 15, { duration: 1.2 });
  }, [map, pos]);
  return null;
}

interface KmzLocalizacao {
  id: string;
  usuario_id: string;
  latitude: number;
  longitude: number;
  usuario_nome: string;
  equipe: string;
  cargo: string;
  cor_equipe: string;
  updated_at: string;
}

export default function KmzMapa() {
  const { profile, role } = useAuth();
  const [diaFiltro, setDiaFiltro] = useState<DiaTipo>("todos");
  const [showEquipes, setShowEquipes] = useState(true);
  const [showMinhaPos, setShowMinhaPos] = useState(false);
  const [minhaPos, setMinhaPos] = useState<[number, number] | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showLegenda, setShowLegenda] = useState(false);
  const [centralize, setCentralize] = useState(false);
  const lastSendRef = useRef(0);

  // Detect top_id from active TOP
  const [topId, setTopId] = useState<string | null>(null);
  useEffect(() => {
    const fetchTop = async () => {
      try {
        const { data } = await (supabase as any)
          .from("tops")
          .select("id")
          .eq("ativo", true)
          .limit(1)
          .single();
        if (data?.id) setTopId(data.id as string);
      } catch { /* no active top */ }
    };
    fetchTop();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const isCoordOrDir = useMemo(() => {
    const cargosRastreados = ["coordenacao", "coord02", "coord03", "diretoria"];
    return cargosRastreados.includes(role ?? "");
  }, [role]);

  // GPS watch
  useEffect(() => {
    if (!isCoordOrDir || !showMinhaPos || !topId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMinhaPos(coords);
        const now = Date.now();
        if (isOnline && now - lastSendRef.current > 30_000 && profile) {
          lastSendRef.current = now;
          const equipe = profile.area_preferencia ?? "";
          const cor = CORES_EQUIPES[equipe] ?? "#6366F1";
          await supabase.from("kmz_localizacoes").upsert(
            {
              usuario_id: profile.id,
              top_id: topId,
              latitude: coords[0],
              longitude: coords[1],
              accuracy: pos.coords.accuracy,
              usuario_nome: profile.nome,
              equipe,
              cargo: role ?? "",
              cor_equipe: cor,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "usuario_id,top_id" }
          );
        }
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isCoordOrDir, showMinhaPos, isOnline, topId, profile, role]);

  // Poll other positions
  const { data: localizacoes } = useQuery({
    queryKey: ["kmz_localizacoes", topId],
    queryFn: async (): Promise<KmzLocalizacao[]> => {
      const { data } = await supabase
        .from("kmz_localizacoes")
        .select("*")
        .eq("top_id", topId ?? "")
        .neq("usuario_id", profile?.id ?? "");
      return (data ?? []) as KmzLocalizacao[];
    },
    refetchInterval: 30_000,
    enabled: !!topId && showEquipes && isOnline,
  });
  const locList: KmzLocalizacao[] = localizacoes ?? [];

  const pontosFiltrados = useMemo(() =>
    diaFiltro === "todos" ? KMZ_PONTOS : KMZ_PONTOS.filter((p) => p.dia === diaFiltro),
    [diaFiltro]
  );

  const rotasFiltradas = useMemo(() =>
    diaFiltro === "todos" ? KMZ_ROTAS : KMZ_ROTAS.filter((r) => r.dia === diaFiltro),
    [diaFiltro]
  );

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Status bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-3 py-1 text-xs font-medium ${
          isOnline ? "bg-green-600/90 text-white" : "bg-orange-500/90 text-white"
        }`}
      >
        <span>{isOnline ? "📡 Online — posições ativas" : "📴 Offline — última posição conhecida"}</span>
        {minhaPos && (
          <span className="opacity-80">
            📍 {minhaPos[0].toFixed(5)}, {minhaPos[1].toFixed(5)}
          </span>
        )}
      </div>

      {/* Day filter */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 z-[1000] flex gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1.5">
        {DIAS.map((d) => (
          <button
            key={d.key}
            onClick={() => setDiaFiltro(d.key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              diaFiltro === d.key
                ? "bg-white text-black"
                : "text-white hover:bg-white/20"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <MapContainer
        center={CENTER}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {centralize && minhaPos && (
          <CentralizarMapa
            pos={minhaPos}
          />
        )}

        {/* Routes */}
        {rotasFiltradas.map((rota) => (
          <Polyline
            key={rota.id}
            positions={rota.coordenadas}
            pathOptions={{ color: rota.cor, weight: 4, opacity: 0.85 }}
          >
            <Popup>
              <div className="font-semibold">{rota.nome}</div>
              {rota.distancia && <div className="text-sm text-muted-foreground">{rota.distancia}</div>}
            </Popup>
          </Polyline>
        ))}

        {/* Points */}
        {pontosFiltrados.map((ponto) => {
          const emoji = ICONE_TIPO[ponto.tipo];
          const cor = COR_DIA[ponto.dia] ?? "#6366F1";
          return (
            <Marker
              key={ponto.id}
              position={[ponto.lat, ponto.lng]}
              icon={criarIconePonto(emoji, cor)}
            >
              <Popup>
                <div>
                  <div className="font-semibold text-sm">{emoji} {ponto.nome}</div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    {ponto.dia.toUpperCase()} • {ponto.tipo}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Team positions */}
        {showEquipes &&
          localizacoes.map((loc) => {
            const cor = loc.cor_equipe || CORES_EQUIPES[loc.equipe] || "#6366F1";
            const now = Date.now();
            const updatedAt = new Date(loc.updated_at).getTime();
            const minutosAtras = Math.floor((now - updatedAt) / 60000);
            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={criarIconeEquipe(cor, loc.usuario_nome)}
              >
                <Popup>
                  <div>
                    <div className="font-semibold">{loc.usuario_nome}</div>
                    <div className="text-xs">{loc.equipe} · {loc.cargo}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {minutosAtras === 0 ? "agora" : `há ${minutosAtras}min`}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* My position */}
        {minhaPos && (
          <Marker position={minhaPos} icon={criarIconeMinhaPosicao()}>
            <Popup>
              <div className="font-semibold">Você está aqui</div>
              <div className="text-xs">{profile?.nome}</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-3 right-3 z-[1000] flex items-end justify-between gap-2">
        {/* Legend */}
        <div className="relative">
          <button
            onClick={() => setShowLegenda((v) => !v)}
            className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg border border-white/10"
          >
            Legenda {showLegenda ? "▲" : "▼"}
          </button>
          {showLegenda && (
            <div className="absolute bottom-10 left-0 bg-black/90 backdrop-blur-sm text-white rounded-lg p-3 w-56 border border-white/10">
              <div className="text-xs font-bold mb-2 text-white/60 uppercase tracking-wide">Equipes</div>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {Object.entries(CORES_EQUIPES)
                  .filter(([k]) => !["DOC", "Louvor", "Alimentação"].includes(k))
                  .map(([nome, cor]) => (
                    <div key={nome} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 border border-white/30"
                        style={{ background: cor }}
                      />
                      <span className="text-xs truncate">{nome}</span>
                    </div>
                  ))}
              </div>
              <div className="text-xs font-bold mb-2 text-white/60 uppercase tracking-wide">Pontos</div>
              <div className="space-y-1">
                {[
                  { emoji: "📖", label: "Prédica" },
                  { emoji: "⛺", label: "Acampamento" },
                  { emoji: "🏠", label: "Base" },
                  { emoji: "🚌", label: "Extração/Van" },
                  { emoji: "📍", label: "Ponto geral" },
                ].map(({ emoji, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-xs font-bold mb-1 text-white/60 uppercase tracking-wide">Rotas</div>
                {KMZ_ROTAS.map((r) => (
                  <div key={r.id} className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-4 h-1 rounded shrink-0" style={{ background: r.cor }} />
                    <span className="text-xs">{r.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex flex-col gap-2 items-end">
          {isCoordOrDir && (
            <button
              onClick={() => {
                setShowMinhaPos((v) => {
                  if (!v) setCentralize(true);
                  return !v;
                });
              }}
              className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
                showMinhaPos
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-black/70 border-white/10 text-white backdrop-blur-sm"
              }`}
            >
              📍 {showMinhaPos ? "Comp. ligado" : "Comp. GPS"}
            </button>
          )}
          <button
            onClick={() => setShowEquipes((v) => !v)}
            className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
              showEquipes
                ? "bg-white/20 border-white/30 text-white backdrop-blur-sm"
                : "bg-black/70 border-white/10 text-white/50 backdrop-blur-sm"
            }`}
          >
            👥 Equipes
          </button>
          {minhaPos && (
            <button
              onClick={() => setCentralize((v) => !v)}
              className="bg-black/70 backdrop-blur-sm border border-white/10 text-white text-xs font-medium px-3 py-2 rounded-lg"
            >
              🎯 Centralizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
