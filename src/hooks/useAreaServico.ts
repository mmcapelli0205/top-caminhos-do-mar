import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAreaServico() {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["area-servico", profile?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("area_servico, cargo_area")
        .eq("email", profile!.email)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  return {
    areaServico: data?.area_servico ?? null,
    cargoArea: data?.cargo_area ?? null,
    isLoading,
  };
}
