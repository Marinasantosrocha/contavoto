-- ==========================================
-- VERIFICAR PESQUISAS QUE AINDA NÃO FORAM REPROCESSADAS
-- ==========================================
-- Execute no Supabase SQL Editor

-- 1. RESUMO: Quantas ainda faltam processar
SELECT 
  COUNT(*) as total_com_audio,
  COUNT(CASE WHEN stt_status != 'concluido' OR stt_status IS NULL THEN 1 END) as faltam_transcrever,
  COUNT(CASE WHEN stt_status = 'concluido' AND (processamento_ia_status != 'concluido' OR processamento_ia_status IS NULL) THEN 1 END) as faltam_processar_ia,
  COUNT(CASE WHEN stt_status = 'concluido' AND processamento_ia_status = 'concluido' THEN 1 END) as ja_processadas
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL;

-- 2. LISTA DETALHADA: Pesquisas que ainda precisam ser transcritas
SELECT 
  id,
  criado_em,
  audio_url,
  stt_status,
  stt_erro,
  processamento_ia_status,
  CASE 
    WHEN stt_status != 'concluido' OR stt_status IS NULL THEN 'Pendente transcrição'
    WHEN stt_status = 'erro' THEN 'Erro na transcrição'
    WHEN stt_status = 'processando' THEN 'Processando transcrição'
    ELSE 'Status desconhecido'
  END as status_descricao
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND (stt_status != 'concluido' OR stt_status IS NULL)
ORDER BY criado_em DESC;

-- 3. LISTA DETALHADA: Pesquisas transcritas mas que ainda precisam processamento IA
SELECT 
  id,
  criado_em,
  stt_status,
  processamento_ia_status,
  CASE 
    WHEN processamento_ia_status IS NULL THEN 'Pendente processamento IA'
    WHEN processamento_ia_status = 'pendente' THEN 'Pendente processamento IA'
    WHEN processamento_ia_status = 'erro' THEN 'Erro no processamento IA'
    WHEN processamento_ia_status = 'processando' THEN 'Processando IA'
    ELSE 'Status desconhecido'
  END as status_descricao
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND stt_status = 'concluido'
  AND (processamento_ia_status != 'concluido' OR processamento_ia_status IS NULL)
ORDER BY criado_em DESC;

-- 4. TODAS AS QUE AINDA PRECISAM SER REPROCESSADAS (transcrição OU IA)
SELECT 
  id,
  criado_em,
  stt_status,
  stt_erro,
  processamento_ia_status,
  CASE 
    WHEN stt_status != 'concluido' OR stt_status IS NULL THEN 'Precisa transcrição'
    WHEN stt_status = 'concluido' AND (processamento_ia_status != 'concluido' OR processamento_ia_status IS NULL) THEN 'Precisa processamento IA'
    ELSE 'Processada'
  END as o_que_falta
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND (
    stt_status != 'concluido' 
    OR stt_status IS NULL
    OR (stt_status = 'concluido' AND (processamento_ia_status != 'concluido' OR processamento_ia_status IS NULL))
  )
ORDER BY criado_em DESC;

-- 5. APENAS AS QUE TIVERAM ERRO E PRECISAM SER REPROCESSADAS
SELECT 
  id,
  criado_em,
  stt_status,
  stt_erro,
  processamento_ia_status,
  observacoes_ia
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND (stt_status = 'erro' OR processamento_ia_status = 'erro')
ORDER BY criado_em DESC;

