-- Script para excluir jobs com erro da tabela transcription_jobs
-- Isso permite que o trigger crie novos jobs quando as pesquisas forem atualizadas

-- 1. Verificar quantos jobs serão excluídos
SELECT 
  status,
  COUNT(*) as total
FROM transcription_jobs
WHERE status = 'erro';

-- 2. Ver alguns exemplos de jobs que serão excluídos (últimos 10)
SELECT 
  id,
  pesquisa_id,
  status,
  tentativas,
  last_error,
  created_at
FROM transcription_jobs
WHERE status = 'erro'
ORDER BY created_at DESC
LIMIT 10;

-- 3. EXCLUIR todos os jobs com erro
-- ATENÇÃO: Isso vai apagar permanentemente os registros!
DELETE FROM transcription_jobs
WHERE status = 'erro';

-- 4. Verificar quantos jobs restaram
SELECT 
  status,
  COUNT(*) as total
FROM transcription_jobs
GROUP BY status
ORDER BY status;

-- 5. Agora você precisa criar novos jobs para essas pesquisas
-- O trigger deve criar automaticamente quando você atualizar o stt_status
-- OU você pode criar manualmente:

-- Inserir novos jobs para pesquisas que têm áudio mas não têm job pendente/ok
INSERT INTO transcription_jobs (pesquisa_id, status, tentativas, created_at, updated_at)
SELECT 
  p.id,
  'pendente',
  0,
  NOW(),
  NOW()
FROM pesquisas p
WHERE p.audio_url IS NOT NULL
  AND p.stt_status IN ('pendente', 'erro')
  AND NOT EXISTS (
    SELECT 1 FROM transcription_jobs tj 
    WHERE tj.pesquisa_id = p.id 
    AND tj.status IN ('pendente', 'processando', 'ok')
  );

-- 6. Verificar quantos jobs foram criados
SELECT 
  status,
  COUNT(*) as total
FROM transcription_jobs
GROUP BY status
ORDER BY status;






