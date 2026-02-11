import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopLegendario } from "@/hooks/useRadarLegendarios";

interface Props {
  top: TopLegendario;
}

export function CompartilharWhatsApp({ top }: Props) {
  const handleShare = () => {
    const lines = [
      `🏔️ *${top.numero_top || "TOP"} — ${top.nome_track || "Legendários"}*`,
      top.cidade ? `📍 ${top.cidade}${top.estado ? `, ${top.estado}` : ""}` : "",
      top.data_checkin ? `📅 ${top.data_checkin}` : "",
      top.valor_participante ? `💰 R$ ${top.valor_participante.toFixed(2)}` : "",
      "",
      top.link_participante ? `✅ Participar: ${top.link_participante}` : "",
      top.link_servidor ? `💙 Servir: ${top.link_servidor}` : "",
    ].filter(Boolean).join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-green-400 hover:text-green-300"
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
