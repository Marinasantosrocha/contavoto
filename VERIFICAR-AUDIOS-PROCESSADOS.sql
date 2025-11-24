-- ==========================================
-- VERIFICAR ÁUDIOS PROCESSADOS E TRANSCRITOS
-- ==========================================
-- Execute no Supabase SQL Editor para ver quais pesquisas foram processadas

-- 1. RESUMO GERAL - Status de transcrição e processamento IA
SELECT 
  COUNT(*) as total_pesquisas,
  COUNT(CASE WHEN audio_url IS NOT NULL THEN 1 END) as com_audio,
  COUNT(CASE WHEN stt_status = 'concluido' THEN 1 END) as transcritas,
  COUNT(CASE WHEN stt_status = 'erro' THEN 1 END) as erro_transcricao,
  COUNT(CASE WHEN stt_status = 'pendente' THEN 1 END) as pendentes_transcricao,
  COUNT(CASE WHEN processamento_ia_status = 'concluido' THEN 1 END) as processadas_ia,
  COUNT(CASE WHEN processamento_ia_status = 'erro' THEN 1 END) as erro_ia,
  COUNT(CASE WHEN processamento_ia_status = 'pendente' THEN 1 END) as pendentes_ia
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date;

-- 2. LISTA DETALHADA - Pesquisas de 16-11-2025 com status completo
SELECT 
  id,
  criado_em,
  audio_url IS NOT NULL as tem_audio,
  stt_status,
  stt_erro,
  CASE 
    WHEN transcricao_completa IS NOT NULL AND transcricao_completa != '' 
    THEN LEFT(transcricao_completa, 50) || '...'
    ELSE NULL 
  END as transcricao_preview,
  processamento_ia_status,
  CASE 
    WHEN respostas_ia IS NOT NULL THEN 'Sim'
    ELSE 'Não'
  END as tem_respostas_ia
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
ORDER BY criado_em DESC;

-- 3. APENAS AS QUE FORAM TRANSCRITAS COM SUCESSO
SELECT 
  id,
  criado_em,
  stt_status,
  processamento_ia_status,
  LENGTH(transcricao_completa) as tamanho_transcricao
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND stt_status = 'concluido'
  AND transcricao_completa IS NOT NULL
ORDER BY criado_em DESC;

-- 4. APENAS AS QUE TIVERAM ERRO NA TRANSCRIÇÃO
SELECT 
  id,
  criado_em,
  stt_status,
  stt_erro,
  audio_url
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND stt_status = 'erro'
ORDER BY criado_em DESC;

-- 5. APENAS AS QUE FORAM PROCESSADAS COM IA COM SUCESSO
SELECT 
  id,
  criado_em,
  stt_status,
  processamento_ia_status,
  respostas_ia IS NOT NULL as tem_respostas_ia
FROM pesquisas
WHERE criado_em >= '2025-11-16'::date 
  AND criado_em < '2025-11-17'::date
  AND audio_url IS NOT NULL
  AND processamento_ia_status = 'concluido'
ORDER BY criado_em DESC;



