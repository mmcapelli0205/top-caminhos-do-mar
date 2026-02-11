import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TopLegendario {
  id: string;
  numero_top: string | null;
  nome_track: string | null;
  cidade: string | null;
  estado: string | null;
  data_checkin: string | null;
  data_retorno: string | null;
  valor_participante: number | null;
  link_participante: string | null;
  valor_servidor: number | null;
  link_servidor: string | null;
  link_servidor_enviado_por: string | null;
  link_servidor_encontrado_em: string | null;
  link_servidor_data: string | null;
  instagram_base: string | null;
  status: string | null;
  origem_dados: string | null;
  data_captura: string | null;
  destaque: boolean | null;
  ativo: boolean | null;
  top_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BaseLegendarios {
  id: string;
  instagram_handle: string;
  nome: string;
  regiao: string | null;
  seguidores: number | null;
  logo_url: string | null;
  ativo: boolean | null;
  created_at: string | null;
}

export interface RadarNoticia {
  id: string;
  titulo: string;
  resumo: string | null;
  fonte_url: string | null;
  fonte_nome: string | null;
  data_publicacao: string | null;
  data_captura: string | null;
}

export function useTopLegendarios() {
  return useQuery({
    queryKey: ["tops_legendarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tops_legendarios" as any)
        .select("*")
        .eq("ativo", true)
        .order("data_checkin", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TopLegendario[];
    },
  });
}

export function useBasesLegendarios() {
  return useQuery({
    queryKey: ["bases_legendarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bases_legendarios" as any)
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as BaseLegendarios[];
    },
  });
}

export function useRadarNoticias() {
  return useQuery({
    queryKey: ["radar_noticias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("radar_noticias" as any)
        .select("*")
        .order("data_captura", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as RadarNoticia[];
    },
  });
}

export function useRastrearTops() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "radar-rastrear",
        { body: { source: "manual" } }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tops_legendarios"] });
      queryClient.invalidateQueries({ queryKey: ["radar_noticias"] });
    },
  });
}

export function useEnviarLinkServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      topId,
      link,
      enviadoPor,
    }: {
      topId: string;
      link: string;
      enviadoPor: string;
    }) => {
      const { error } = await supabase
        .from("tops_legendarios" as any)
        .update({
          link_servidor: link,
          link_servidor_enviado_por: enviadoPor,
          link_servidor_data: new Date().toISOString(),
        } as any)
        .eq("id", topId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tops_legendarios"] });
    },
  });
}
