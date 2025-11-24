-- Script para excluir jobs duplicados na tabela transcription_jobs
-- Mantém apenas o job mais recente para cada pesquisa_id

-- 1. Verificar quantas pesquisas têm jobs duplicados
SELECT 
  pesquisa_id,
  COUNT(*) as total_jobs,
  array_agg(status) as status_list,
  array_agg(id) as job_ids
FROM transcription_jobs
GROUP BY pesquisa_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 2. Ver estatísticas de duplicação
SELECT 
  COUNT(DISTINCT pesquisa_id) as pesquisas_com_duplicatas,
  COUNT(*) as total_jobs_duplicados,
  COUNT(*) - COUNT(DISTINCT pesquisa_id) as jobs_a_excluir
FROM transcription_jobs
WHERE pesquisa_id IN (
  SELECT pesquisa_id 
  FROM transcription_jobs 
  GROUP BY pesquisa_id 
  HAVING COUNT(*) > 1
);

-- 3. EXCLUIR jobs duplicados, mantendo apenas o mais recente para cada pesquisa_id
-- ATENÇÃO: Isso vai apagar permanentemente os jobs mais antigos!

DELETE FROM transcription_jobs
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      pesquisa_id,
      ROW_NUMBER() OVER (PARTITION BY pesquisa_id ORDER BY created_at DESC) as rn
    FROM transcription_jobs
  ) t
  WHERE rn > 1
);

-- 4. Verificar se ainda há duplicatas (deve retornar 0)
SELECT 
  pesquisa_id,
  COUNT(*) as total_jobs
FROM transcription_jobs
GROUP BY pesquisa_id
HAVING COUNT(*) > 1;

-- 5. Verificar estatísticas finais
SELECT 
  status,
  COUNT(*) as total,
  COUNT(DISTINCT pesquisa_id) as pesquisas_unicas
FROM transcription_jobs
GROUP BY status
ORDER BY status;






