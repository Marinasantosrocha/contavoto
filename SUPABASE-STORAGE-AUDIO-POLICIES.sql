-- Policies para bucket 'audio-pesquisa'
-- Execute no Supabase SQL Editor

-- Criar bucket se não existir
insert into storage.buckets (id, name, public)
values ('audio-pesquisa', 'audio-pesquisa', true)
on conflict (id) do nothing;

-- Remover políticas antigas com mesmo nome (idempotente)
DROP POLICY IF EXISTS "Upload anon (apenas audio-pesquisa)" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública (audio-pesquisa)" ON storage.objects;

-- Permitir INSERT para role anon apenas no bucket 'audio-pesquisa'
CREATE POLICY "Upload anon (apenas audio-pesquisa)"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'audio-pesquisa');

-- Permitir SELECT público no bucket
CREATE POLICY "Leitura pública (audio-pesquisa)"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-pesquisa');
