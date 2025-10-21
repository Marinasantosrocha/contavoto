-- ============================================
-- CRIAR BUCKET PARA ARMAZENAR ÁUDIOS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- para criar o bucket de storage para áudios
-- ============================================

-- 1. Criar o bucket (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-pesquisas',
  'audio-pesquisas',
  true,  -- público para facilitar acesso
  52428800,  -- 50MB de limite por arquivo
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas de acesso (RLS)

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Todos podem ler áudios" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar" ON storage.objects;

-- Permitir upload para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-pesquisas');

-- Permitir leitura pública
CREATE POLICY "Todos podem ler áudios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-pesquisas');

-- Permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-pesquisas');

-- Permitir deletar para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-pesquisas');

-- ============================================
-- VERIFICAR SE FOI CRIADO CORRETAMENTE
-- ============================================

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'audio-pesquisas';

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%audio%';
