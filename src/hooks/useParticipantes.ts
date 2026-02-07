import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Participante = Tables<"participantes">;
export type Familia = Tables<"familias">;

export function useParticipantes() {
  const participantesQuery = useQuery({
    queryKey: ["participantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participantes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Participante[];
    },
  });

  const familiasQuery = useQuery({
    queryKey: ["familias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("familias")
        .select("*")
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as Familia[];
    },
  });

  const familiaMap = new Map<number, number>();
  familiasQuery.data?.forEach((f) => {
    familiaMap.set(f.id, f.numero);
  });

  return {
    participantes: participantesQuery.data ?? [],
    familiaMap,
    familias: familiasQuery.data ?? [],
    isLoading: participantesQuery.isLoading || familiasQuery.isLoading,
    error: participantesQuery.error || familiasQuery.error,
  };
}
