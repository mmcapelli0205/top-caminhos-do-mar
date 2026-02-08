
CREATE POLICY "Allow public upload to assets bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Allow public read from assets bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Allow public update in assets bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'assets');

CREATE POLICY "Allow public delete from assets bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'assets');
