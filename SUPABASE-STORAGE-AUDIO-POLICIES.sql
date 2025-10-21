-- Policies para bucket 'audio-pesquisa'
-- Execute no Supabase SQL Editor

-- Criar bucket se não existir
insert into storage.buckets (id, name, public)
values ('audio-pesquisa', 'audio-pesquisa', true)
on conflict (id) do nothing;

-- Remover políticas antigas com mesmo nome (idempotente)
DROP POLICY IF EXISTS "Upload anon (apenas audio-pesquisa)" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública (audio-pesquisa)" ON storage.objects;
DROP POLICY IF EXISTS "Atualizar objetos (audio-pesquisa)" ON storage.objects;
DROP POLICY IF EXISTS "Deletar objetos (audio-pesquisa)" ON storage.objects;

-- Permitir INSERT para role anon apenas no bucket 'audio-pesquisa'
CREATE POLICY "Upload anon (apenas audio-pesquisa)"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audio-pesquisa');

-- Permitir SELECT público no bucket
CREATE POLICY "Leitura pública (audio-pesquisa)"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-pesquisa');

-- Permitir UPDATE (ex.: upsert via supabase.storage.from(...).upload(path, file, { upsert: true }))
CREATE POLICY "Atualizar objetos (audio-pesquisa)"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'audio-pesquisa')
WITH CHECK (bucket_id = 'audio-pesquisa');

-- Opcional: permitir DELETE no bucket (útil para sobrescrever/limpar itens). Mantenha se necessário.
CREATE POLICY "Deletar objetos (audio-pesquisa)"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'audio-pesquisa');
