CREATE TABLE tirolesa_duplas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id INTEGER REFERENCES familias(id),
  participante_1_id UUID REFERENCES participantes(id),
  participante_2_id UUID REFERENCES participantes(id),
  peso_1 NUMERIC,
  peso_2 NUMERIC,
  peso_total NUMERIC,
  ordem INTEGER,
  status TEXT DEFAULT 'aguardando',
  observacao TEXT,
  top_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tirolesa_duplas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_only" ON tirolesa_duplas
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);