import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRadarNoticias } from "@/hooks/useRadarLegendarios";

export function RadarNoticiasSection() {
  const { data: noticias, isLoading } = useRadarNoticias();

  if (isLoading) return null;
  if (!noticias?.length) return null;

  return (
    <div className="space-y-3">
      {noticias.map((n) => (
        <Card key={n.id} className="bg-[#2d2d2d] border-[#c9a84c]/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Newspaper className="h-5 w-5 text-[#c9a84c] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h4 className="text-white text-sm font-medium">{n.titulo}</h4>
                {n.resumo && (
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                    {n.resumo}
                  </p>
                )}
                {n.fonte_url && (
                  <a
                    href={n.fonte_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-xs mt-1 inline-flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {n.fonte_nome || "Ver fonte"}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
