
CREATE TABLE public.bebidas_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  quantidade_por_pessoa NUMERIC DEFAULT 0,
  preco_mercado1 NUMERIC,
  preco_mercado2 NUMERIC,
  preco_mercado3 NUMERIC,
  preco_manual NUMERIC,
  top_id UUID REFERENCES public.tops(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bebidas_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total bebidas_itens" ON public.bebidas_itens FOR ALL USING (true) WITH CHECK (true);
