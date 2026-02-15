-- Allow authenticated users to delete from hakuna_estoque_medicamentos
DROP POLICY IF EXISTS "delete_hakuna_estoque_med" ON public.hakuna_estoque_medicamentos;
CREATE POLICY "delete_hakuna_estoque_med"
  ON public.hakuna_estoque_medicamentos
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete from hakuna_estoque_movimentacoes
DROP POLICY IF EXISTS "delete_hakuna_mov" ON public.hakuna_estoque_movimentacoes;
CREATE POLICY "delete_hakuna_mov"
  ON public.hakuna_estoque_movimentacoes
  FOR DELETE
  USING (auth.uid() IS NOT NULL);