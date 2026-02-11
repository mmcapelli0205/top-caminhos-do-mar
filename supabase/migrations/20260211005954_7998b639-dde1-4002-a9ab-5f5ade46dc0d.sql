
-- Tabela: tops_legendarios
CREATE TABLE public.tops_legendarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_top TEXT,
  nome_track TEXT,
  cidade TEXT,
  estado TEXT,
  data_checkin DATE,
  data_retorno DATE,
  valor_participante NUMERIC,
  link_participante TEXT,
  valor_servidor NUMERIC,
  link_servidor TEXT,
  link_servidor_enviado_por TEXT,
  link_servidor_encontrado_em TEXT,
  link_servidor_data TIMESTAMP WITH TIME ZONE,
  instagram_base TEXT,
  status TEXT DEFAULT 'aberto',
  origem_dados TEXT,
  data_captura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  destaque BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  top_id UUID REFERENCES public.tops(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tops_legendarios ENABLE ROW LEVEL SECURITY;

-- Leitura publica (anon), escrita autenticado
CREATE POLICY "Leitura publica tops_legendarios"
  ON public.tops_legendarios FOR SELECT
  USING (true);

CREATE POLICY "Escrita autenticada tops_legendarios"
  ON public.tops_legendarios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update autenticado tops_legendarios"
  ON public.tops_legendarios FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete proibido tops_legendarios"
  ON public.tops_legendarios FOR DELETE
  USING (false);

-- Tabela: bases_legendarios
CREATE TABLE public.bases_legendarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_handle TEXT NOT NULL,
  nome TEXT NOT NULL,
  regiao TEXT,
  seguidores INTEGER,
  logo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bases_legendarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica bases_legendarios"
  ON public.bases_legendarios FOR SELECT
  USING (true);

CREATE POLICY "Escrita autenticada bases_legendarios"
  ON public.bases_legendarios FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update autenticado bases_legendarios"
  ON public.bases_legendarios FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete proibido bases_legendarios"
  ON public.bases_legendarios FOR DELETE
  USING (false);

-- Tabela: radar_noticias
CREATE TABLE public.radar_noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumo TEXT,
  fonte_url TEXT,
  fonte_nome TEXT,
  data_publicacao DATE,
  data_captura TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.radar_noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura publica radar_noticias"
  ON public.radar_noticias FOR SELECT
  USING (true);

CREATE POLICY "Escrita autenticada radar_noticias"
  ON public.radar_noticias FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update autenticado radar_noticias"
  ON public.radar_noticias FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete proibido radar_noticias"
  ON public.radar_noticias FOR DELETE
  USING (false);
