import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CORES_EQUIPES, getTextColor } from "@/lib/coresEquipes";

interface AreaAviso {
  id: string;
  titulo: string;
  conteudo: string;
  created_at: string | null;
  area_id: string | null;
  areas: { nome: string; cor: string | null } | null;
}

export default function MuralAvisos() {
  const { data: avisos, isLoading } = useQuery({
    queryKey: ["inicio-avisos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("area_avisos")
        .select("id, titulo, conteudo, created_at, area_id, areas:area_id(nome, cor)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as unknown as AreaAviso[];
    },
  });

  const getAreaColor = (aviso: AreaAviso) => {
    const nome = aviso.areas?.nome ?? "";
    return CORES_EQUIPES[nome] ?? aviso.areas?.cor ?? "#6366f1";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Megaphone className="h-5 w-5 text-primary" />
        <CardTitle className="text-sm font-medium text-muted-foreground">Últimos Avisos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : !avisos?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aviso recente. As equipes podem postar avisos no Portal de Áreas.
          </p>
        ) : (
          avisos.map((aviso) => {
            const cor = getAreaColor(aviso);
            const textColor = getTextColor(cor);
            return (
              <div
                key={aviso.id}
                className="rounded-lg border p-3 space-y-1"
                style={{ borderLeftWidth: 4, borderLeftColor: cor }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">
                    {aviso.titulo}
                  </h4>
                  {aviso.areas?.nome && (
                    <Badge
                      className="text-[10px] shrink-0"
                      style={{ backgroundColor: cor, color: textColor, borderColor: cor }}
                    >
                      {aviso.areas.nome}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{aviso.conteudo}</p>
                {aviso.created_at && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(aviso.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
