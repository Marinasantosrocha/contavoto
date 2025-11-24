-- Script para reprocessar jobs de transcrição que falharam
-- Atualiza o status dos jobs para 'pendente' para que o worker processe novamente

-- 1. Verificar quantos jobs falharam
SELECT 
  status,
  COUNT(*) as total
FROM transcription_jobs
GROUP BY status
ORDER BY status;

-- 2. Ver detalhes dos jobs com erro (últimos 20)
SELECT 
  id,
  pesquisa_id,
  status,
  error_message,
  created_at,
  updated_at
FROM transcription_jobs
WHERE status = 'erro'
ORDER BY created_at DESC
LIMIT 20;

-- 3. REPROCESSAR: Resetar status para 'pendente' para que o worker processe novamente
-- ATENÇÃO: Execute apenas se tiver certeza que quer reprocessar todos os jobs com erro

UPDATE transcription_jobs
SET 
  status = 'pendente',
  error_message = NULL,
  attempts = 0,
  updated_at = NOW()
WHERE status = 'erro';

-- 4. Verificar quantos jobs ficaram pendentes
SELECT 
  status,
  COUNT(*) as total
FROM transcription_jobs
GROUP BY status
ORDER BY status;

-- ALTERNATIVA: Reprocessar apenas jobs de um período específico
-- UPDATE transcription_jobs
-- SET 
--   status = 'pendente',
--   error_message = NULL,
--   attempts = 0,
--   updated_at = NOW()
-- WHERE status = 'erro'
--   AND created_at >= '2025-01-01'::timestamptz;

-- ALTERNATIVA: Reprocessar apenas 1 job específico (para teste)
-- UPDATE transcription_jobs
-- SET 
--   status = 'pendente',
--   error_message = NULL,
--   attempts = 0,
--   updated_at = NOW()
-- WHERE id = 'UUID_DO_JOB_AQUI'
--   AND status = 'erro';






