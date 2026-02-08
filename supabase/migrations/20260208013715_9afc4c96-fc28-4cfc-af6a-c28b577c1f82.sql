
DROP POLICY IF EXISTS "Acesso total artes_docs" ON public.artes_docs;

CREATE POLICY "Acesso total artes_docs"
ON public.artes_docs
FOR ALL
USING (true)
WITH CHECK (true);
