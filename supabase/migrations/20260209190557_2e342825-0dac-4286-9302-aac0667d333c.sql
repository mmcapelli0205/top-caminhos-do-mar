DROP POLICY IF EXISTS "auth_only" ON public.artes_docs;

CREATE POLICY "auth_only" ON public.artes_docs
  AS PERMISSIVE
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);