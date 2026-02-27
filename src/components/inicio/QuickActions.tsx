import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight } from "lucide-react";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

const LOGOS_EQUIPES: Record<string, string> = {
  "ADM": "adm.png",
  "Eventos": "eventos.png",
  "Hakuna": "hakunas.png",
  "Intercessão": "intercessao.png",
  "Louvor": "intercessao.png",
  "Logística": "logistica.png",
  "Mídia": "midia.png",
  "Comunicação": "midia.png",
  "Segurança": "seguranca.png",
  "Voz": "voz.png",
};

const ASSET_BASE = "https://ilknzgupnswyeynwpovj.supabase.co/storage/v1/object/public/assets/";

interface Props {
  userEmail: string | null;
}

export default function QuickActions({ userEmail }: Props) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const { data: servidor } = useQuery({
    queryKey: ["quick-action-area", userEmail],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico")
        .eq("email", userEmail!)
        .maybeSingle();
      return data;
    },
    enabled: !!userEmail,
  });

  const area = servidor?.area_servico;
  if (!area) return null;

  const logoFile = LOGOS_EQUIPES[area];
  const bgColor = CORES_EQUIPES[area] || "#6B7280";
  const textColor = getTextColor(bgColor);
  const initials = area.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="cursor-pointer group flex flex-col items-center justify-center text-center gap-2 py-4"
      onClick={() => navigate(`/areas/${encodeURIComponent(area)}`)}
    >
      {/* Logo imponente */}
      <div className="relative">
        {logoFile && !imgError ? (
          <img
            src={`${ASSET_BASE}${logoFile}`}
            alt={area}
            className="h-24 w-24 md:h-28 md:w-28 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="h-24 w-24 md:h-28 md:w-28 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-3xl font-bold" style={{ color: textColor }}>
              {initials}
            </span>
          </div>
        )}
        {/* Glow sutil atrás do logo */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20 -z-10"
          style={{ backgroundColor: bgColor }}
        />
      </div>

      <p className="font-bold text-lg text-foreground group-hover:text-orange-400 transition-colors">
        {area}
      </p>
      <p className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-orange-400/70 transition-colors">
        Acessar minha área <ChevronRight className="h-3 w-3" />
      </p>
    </div>
  );
}
