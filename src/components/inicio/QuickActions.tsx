import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

const LOGOS_EQUIPES: Record<string, string> = {
  "ADM": "adm.png",
  "Eventos": "eventos.png",
  "Hakuna": "hakunas.png",
  "Intercessão": "intercessao.png",
  "DOC": "intercessao.png",
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
    <Card
      className="cursor-pointer hover:scale-[1.02] transition-all border-border h-full"
      onClick={() => navigate(`/areas/${encodeURIComponent(area)}`)}
    >
      <CardContent className="flex items-center gap-4 p-8">
        {logoFile && !imgError ? (
          <img
            src={`${ASSET_BASE}${logoFile}`}
            alt={area}
            className="h-24 w-24 md:h-32 md:w-32 object-contain shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="h-24 w-24 md:h-32 md:w-32 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-3xl md:text-4xl font-bold" style={{ color: textColor }}>
              {initials}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-lg text-foreground">{area}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Acessar minha área <ChevronRight className="h-4 w-4" />
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
