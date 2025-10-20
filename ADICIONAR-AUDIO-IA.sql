-- ===================================
-- CONFIGURAÇÃO DE ÁUDIO + IA
-- ===================================

-- Passo 1: Adicionar colunas na tabela pesquisas

-- Campos de aceite/recusa de participação
ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS aceite_participacao BOOLEAN;

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;

-- Campos de áudio e processamento IA
ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS audio_duracao INTEGER;

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS transcricao_completa TEXT;

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS processamento_ia_status VARCHAR(50) DEFAULT 'pendente';

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS processamento_ia_confianca JSONB;

ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS perguntas_feitas JSONB;

-- Comentários
COMMENT ON COLUMN pesquisas.aceite_participacao IS 'TRUE = aceitou participar | FALSE = recusou | NULL = ainda não perguntado';
COMMENT ON COLUMN pesquisas.motivo_recusa IS 'Motivo da recusa (preenchido quando aceite_participacao = FALSE)';
COMMENT ON COLUMN pesquisas.audio_url IS 'URL do áudio completo da pesquisa no Supabase Storage';
COMMENT ON COLUMN pesquisas.audio_duracao IS 'Duração do áudio em segundos';
COMMENT ON COLUMN pesquisas.transcricao_completa IS 'Transcrição completa do áudio (Web Speech API)';
COMMENT ON COLUMN pesquisas.processamento_ia_status IS 'Status do processamento IA: pendente, processando, concluido, erro';
COMMENT ON COLUMN pesquisas.processamento_ia_confianca IS 'Confiança da IA por campo: {campo_id: 0-100}';
COMMENT ON COLUMN pesquisas.perguntas_feitas IS 'Perguntas que foram marcadas como feitas: {campo_id: true/false}';

-- Passo 2: Criar bucket 'pesquisas-audio' no Supabase Storage
-- IMPORTANTE: Você deve criar o bucket manualmente no painel do Supabase
-- Storage > New Bucket > Name: "pesquisas-audio" > Public: TRUE

-- Passo 3: Criar políticas de acesso ao Storage (bucket 'pesquisas-audio')

-- Deletar políticas antigas se existirem
DROP POLICY IF EXISTS "Upload de áudios de pesquisa" ON storage.objects;
DROP POLICY IF EXISTS "Leitura pública de áudios de pesquisa" ON storage.objects;
DROP POLICY IF EXISTS "Deletar áudios de pesquisa" ON storage.objects;

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Upload de áudios de pesquisa"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pesquisas-audio');

-- Permitir leitura pública dos áudios
CREATE POLICY "Leitura pública de áudios de pesquisa"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pesquisas-audio');

-- Permitir que usuários autenticados deletem
CREATE POLICY "Deletar áudios de pesquisa"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pesquisas-audio');

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pesquisas' 
AND column_name IN ('aceite_participacao', 'motivo_recusa', 'audio_url', 'audio_duracao', 'transcricao_completa', 'processamento_ia_status', 'processamento_ia_confianca', 'perguntas_feitas');

-- Query de exemplo para ver pesquisas processadas
-- SELECT id, endereco, audio_url, transcricao_completa, processamento_ia_status 
-- FROM pesquisas 
-- WHERE processamento_ia_status = 'concluido' 
-- LIMIT 10;
