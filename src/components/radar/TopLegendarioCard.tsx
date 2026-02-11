import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Clock, MapPin, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TopLegendario } from "@/hooks/useRadarLegendarios";

interface Props {
  top: TopLegendario;
  onAjudeEncontrar: (top: TopLegendario) => void;
}

export function TopLegendarioCard({ top, onAjudeEncontrar }: Props) {
  const diasRestantes = top.data_checkin
    ? differenceInDays(parseISO(top.data_checkin), new Date())
    : null;

  const dataFormatada = top.data_checkin
    ? format(parseISO(top.data_checkin), "dd MMM yyyy", { locale: ptBR })
    : null;

  const statusColor =
    top.status === "aberto"
      ? "bg-green-600"
      : top.status === "esgotado"
      ? "bg-red-600"
      : "bg-gray-600";

  return (
    <Card className="bg-[#2d2d2d] border-[#c9a84c]/30 hover:border-[#c9a84c]/60 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            {top.numero_top && (
              <span className="text-3xl font-extrabold text-[#c9a84c]">
                {top.numero_top}
              </span>
            )}
            <h3 className="text-lg font-semibold text-white mt-1">
              {top.nome_track || "Track desconhecida"}
            </h3>
          </div>
          <Badge className={`${statusColor} text-white text-xs`}>
            {top.status || "aberto"}
          </Badge>
        </div>

        {(top.cidade || top.estado) && (
          <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {[top.cidade, top.estado].filter(Boolean).join(", ")}
            </span>
          </div>
        )}

        {dataFormatada && (
          <div className="flex items-center gap-1 text-gray-400 text-sm mb-3">
            <Clock className="h-3.5 w-3.5" />
            <span>{dataFormatada}</span>
            {diasRestantes !== null && diasRestantes > 0 && (
              <span className="ml-2 text-orange-400 font-medium">
                {diasRestantes}d restantes
              </span>
            )}
          </div>
        )}

        {top.valor_participante && (
          <p className="text-sm text-gray-300 mb-3">
            Participante:{" "}
            <span className="text-green-400 font-semibold">
              R$ {top.valor_participante.toFixed(2)}
            </span>
          </p>
        )}

        <div className="flex gap-2 mt-4">
          {top.link_participante ? (
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open(top.link_participante!, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              PARTICIPAR
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-green-600/50 text-green-400"
              disabled
            >
              Sem link
            </Button>
          )}

          {top.link_servidor ? (
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(top.link_servidor!, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              SERVIR
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-blue-600/50 text-blue-400"
              onClick={() => onAjudeEncontrar(top)}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Ajude a encontrar
            </Button>
          )}
        </div>

        {top.link_servidor_enviado_por && (
          <p className="text-xs text-gray-500 mt-2">
            Link de servidor enviado por: {top.link_servidor_enviado_por}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
