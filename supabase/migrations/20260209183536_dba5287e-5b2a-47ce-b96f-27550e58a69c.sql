DROP POLICY IF EXISTS "auth_only" ON tirolesa_duplas;

CREATE POLICY "auth_only" ON tirolesa_duplas
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);