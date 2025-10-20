-- ===================================
-- CONFIGURAÇÃO DE FOTOS DE USUÁRIOS
-- ===================================

-- Passo 1: Adicionar coluna foto_url na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_url TEXT;

COMMENT ON COLUMN usuarios.foto_url IS 'URL da foto de perfil do usuário no Supabase Storage';

-- Passo 2: Criar políticas de acesso ao Storage (bucket 'avatars')
-- IMPORTANTE: Você deve criar o bucket 'avatars' manualmente no painel do Supabase
-- Storage > New Bucket > Name: "avatars" > Public: TRUE

-- Deletar políticas antigas se existirem (para evitar conflito)
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Fotos públicas para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas fotos" ON storage.objects;

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permitir leitura pública das fotos
CREATE POLICY "Fotos públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir que usuários atualizem fotos
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir que usuários deletem fotos
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND column_name = 'foto_url';
