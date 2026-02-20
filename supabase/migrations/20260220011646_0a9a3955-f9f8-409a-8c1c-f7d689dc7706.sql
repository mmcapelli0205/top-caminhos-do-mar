-- Permitir leitura anônima de tops para buscar o top_id ativo (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tops' AND policyname = 'anon_select_tops'
  ) THEN
    EXECUTE 'CREATE POLICY "anon_select_tops" ON public.tops FOR SELECT TO anon USING (true)';
  END IF;
END $$;