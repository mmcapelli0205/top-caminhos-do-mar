import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Últimos Avisos</h3>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : !avisos?.length ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum aviso recente
          </p>
        ) : (
          avisos.map((aviso) => {
            const cor = getAreaColor(aviso);
            const textColor = getTextColor(cor);
            return (
              <div
                key={aviso.id}
                className="rounded-md border border-border p-3 space-y-1"
                style={{ borderLeftWidth: 3, borderLeftColor: cor }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
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
                  <p className="text-[10px] text-muted-foreground/50">
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
      </div>
    </div>
  );
}
