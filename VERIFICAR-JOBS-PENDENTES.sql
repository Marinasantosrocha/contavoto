-- Script para verificar e diagnosticar jobs pendentes que não estão sendo processados

-- 1. Ver todos os jobs pendentes ordenados por data
SELECT 
  id,
  pesquisa_id,
  status,
  tentativas,
  created_at,
  updated_at,
  last_error,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_desde_criacao
FROM transcription_jobs
WHERE status = 'pendente'
ORDER BY created_at ASC;

-- 2. Verificar se há jobs "travados" (pendentes há mais de 1 hora sem atualização)
SELECT 
  id,
  pesquisa_id,
  status,
  tentativas,
  created_at,
  updated_at,
  last_error
FROM transcription_jobs
WHERE status = 'pendente'
  AND updated_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;

-- 3. Verificar se as pesquisas correspondentes têm áudio
SELECT 
  tj.id as job_id,
  tj.pesquisa_id,
  tj.status as job_status,
  p.audio_url,
  p.stt_status,
  p.processamento_ia_status,
  p.entrevistador,
  p.iniciada_em
FROM transcription_jobs tj
LEFT JOIN pesquisas p ON tj.pesquisa_id = p.id
WHERE tj.status = 'pendente'
ORDER BY tj.created_at ASC
LIMIT 20;

-- 4. SOLUÇÃO: Resetar jobs que estão travados há mais de 1 hora
-- (Força o worker a tentar novamente)
UPDATE transcription_jobs
SET 
  updated_at = NOW(),
  tentativas = COALESCE(tentativas, 0)
WHERE status = 'pendente'
  AND updated_at < NOW() - INTERVAL '1 hour';

-- 5. Verificar estatísticas gerais
SELECT 
  status,
  COUNT(*) as total,
  AVG(tentativas) as media_tentativas,
  MAX(tentativas) as max_tentativas
FROM transcription_jobs
GROUP BY status
ORDER BY status;






