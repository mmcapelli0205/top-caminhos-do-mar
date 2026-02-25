import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getPermissaoAba,
  PERMISSOES_DIRETOR_ESPIRITUAL,
  type CargoArea,
  type NivelPermissao,
} from "@/lib/permissoes";

export function usePermissoes(areaNome: string) {
  const { profile, role } = useAuth();

  const { data: area, isLoading: loadingArea } = useQuery({
    queryKey: ["area-permissoes", areaNome],
    queryFn: async () => {
      const { data } = await supabase
        .from("areas")
        .select("id, coordenador_id, coordenador_02_id, coordenador_03_id, flutuante_01_id, flutuante_02_id, flutuante_03_id, expert_id")
        .eq("nome", areaNome)
        .maybeSingle();
      return data;
    },
    enabled: !!areaNome,
  });

  const { data: servidor, isLoading: loadingServidor } = useQuery({
    queryKey: ["servidor-logado", profile?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from("servidores")
        .select("id, cargo_area, area_servico")
        .eq("email", profile!.email)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.email,
  });

  function getCargoNaArea(): CargoArea {
    if (role === "diretoria") return "diretoria";
    if (!area || !servidor) return "servidor";

    const sid = servidor.id;
    if (area.coordenador_id === sid) return "coord_01";
    if (area.coordenador_02_id === sid) return "coord_02";
    if (area.coordenador_03_id === sid) return "coord_03";
    const areaAny = area as any;
    if (areaAny.flutuante_01_id === sid) return "coord_01";
    if (areaAny.flutuante_02_id === sid) return "coord_02";
    if (areaAny.flutuante_03_id === sid) return "coord_03";
    if (areaAny.expert_id === sid) return "coord_01";

    return "servidor";
  }

  const cargo = getCargoNaArea();
  const isDiretorEspiritual = servidor?.cargo_area === "Diretor Espiritual";

  function getPermissao(aba: string): NivelPermissao {
    if (isDiretorEspiritual) {
      return (PERMISSOES_DIRETOR_ESPIRITUAL as Record<string, NivelPermissao>)[aba] ?? "V";
    }
    return getPermissaoAba(areaNome, cargo, aba);
  }

  return {
    cargo,
    getPermissao,
    isDiretoria: role === "diretoria",
    isDiretorEspiritual,
    isLoading: loadingArea || loadingServidor,
  };
}
