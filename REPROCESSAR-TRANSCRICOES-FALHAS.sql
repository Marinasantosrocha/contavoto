-- Script para reprocessar transcrições e processamentos de áudio que falharam
-- Atualiza o status das pesquisas com erro para que o worker processe novamente

-- 1. Verificar quantas pesquisas falharam
SELECT 
  COUNT(*) as total_falhas,
  COUNT(*) FILTER (WHERE stt_status = 'erro') as falhas_transcricao,
  COUNT(*) FILTER (WHERE processamento_ia_status = 'erro') as falhas_ia
FROM pesquisas
WHERE stt_status = 'erro' OR processamento_ia_status = 'erro';

-- 2. Ver detalhes das falhas (últimas 10)
SELECT 
  id,
  entrevistador,
  cidade,
  iniciada_em,
  stt_status,
  stt_erro,
  processamento_ia_status,
  audio_url
FROM pesquisas
WHERE stt_status = 'erro' OR processamento_ia_status = 'erro'
ORDER BY iniciada_em DESC
LIMIT 10;

-- 3. REPROCESSAR: Resetar status para 'pendente' para que o worker processe novamente
-- ATENÇÃO: Execute apenas se tiver certeza que quer reprocessar todas as falhas

UPDATE pesquisas
SET 
  stt_status = 'pendente',
  stt_erro = NULL,
  processamento_ia_status = 'pendente'
WHERE stt_status = 'erro' OR processamento_ia_status = 'erro';

-- 4. Verificar se foi atualizado
SELECT 
  COUNT(*) as total_pendentes
FROM pesquisas
WHERE stt_status = 'pendente' OR processamento_ia_status = 'pendente';

-- ALTERNATIVA: Reprocessar apenas pesquisas de um período específico
-- UPDATE pesquisas
-- SET 
--   stt_status = 'pendente',
--   stt_erro = NULL,
--   processamento_ia_status = 'pendente'
-- WHERE (stt_status = 'erro' OR processamento_ia_status = 'erro')
--   AND iniciada_em >= '2025-01-01'::timestamptz;

-- ALTERNATIVA: Reprocessar apenas pesquisas de um entrevistador específico
-- UPDATE pesquisas
-- SET 
--   stt_status = 'pendente',
--   stt_erro = NULL,
--   processamento_ia_status = 'pendente'
-- WHERE (stt_status = 'erro' OR processamento_ia_status = 'erro')
--   AND entrevistador = 'Nome do Entrevistador';






