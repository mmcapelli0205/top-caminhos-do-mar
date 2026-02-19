
-- Tabela de aceite do Termo de Responsabilidade da Tirolesa
CREATE TABLE IF NOT EXISTS tirolesa_termo_aceite (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  top_id UUID,
  status TEXT NOT NULL DEFAULT 'pendente',
  registrado_por UUID,
  registrado_por_nome TEXT,
  aceito_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participante_id, top_id)
);

ALTER TABLE tirolesa_termo_aceite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_termo" ON tirolesa_termo_aceite
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_all_termo" ON tirolesa_termo_aceite
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela de configuração da Tirolesa (texto do termo + grupos de famílias)
CREATE TABLE IF NOT EXISTS tirolesa_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  top_id UUID,
  texto_termo TEXT DEFAULT 'Eu, participante, declaro estar ciente dos riscos da atividade de tirolesa e autorizo minha participação mediante avaliação física prévia. Declaro que fui informado sobre as restrições de peso e condições de saúde necessárias para a prática segura da atividade.',
  grupos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tirolesa_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_config" ON tirolesa_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_all_config" ON tirolesa_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Adicionar colunas desceu/desceu_em na tabela tirolesa_duplas
ALTER TABLE tirolesa_duplas ADD COLUMN IF NOT EXISTS desceu BOOLEAN DEFAULT FALSE;
ALTER TABLE tirolesa_duplas ADD COLUMN IF NOT EXISTS desceu_em TIMESTAMPTZ;
