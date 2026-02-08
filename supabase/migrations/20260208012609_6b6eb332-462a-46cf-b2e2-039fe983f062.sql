
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Outros',
  ADD COLUMN IF NOT EXISTS origem text DEFAULT 'proprio',
  ADD COLUMN IF NOT EXISTS proprietario text,
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'bom',
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS observacoes text;
