-- CORRIGIR FUNÇÃO DE PRODUTIVIDADE
-- Problema: estava multiplicando contagens devido ao LEFT JOIN
-- Solução: calcular as métricas separadamente e depois juntar

CREATE OR REPLACE FUNCTION calcular_produtividade()
RETURNS TABLE (
  entrevistador TEXT,
  total_entrevistas BIGINT,
  duracao_media_minutos NUMERIC,
  intervalo_medio_minutos NUMERIC
) 
LANGUAGE sql
AS $$
  WITH 
  -- 1. Calcular duração média de cada entrevistador
  metricas_duracao AS (
    SELECT 
      p.entrevistador,
      COUNT(*)::BIGINT AS total_entrevistas,
      ROUND(AVG(EXTRACT(EPOCH FROM (p.finalizada_em - p.iniciada_em)) / 60), 1) AS duracao_media_minutos
    FROM pesquisas p
    WHERE p.status = 'finalizada'
      AND p.finalizada_em IS NOT NULL
      AND p.iniciada_em IS NOT NULL
    GROUP BY p.entrevistador
  ),
  
  -- 2. Calcular intervalos entre entrevistas consecutivas
  intervalos AS (
    SELECT 
      p.entrevistador,
      EXTRACT(EPOCH FROM (
        LEAD(p.iniciada_em) OVER (
          PARTITION BY p.entrevistador 
          ORDER BY p.iniciada_em
        ) - p.finalizada_em
      )) / 60 AS intervalo_minutos
    FROM pesquisas p
    WHERE p.status = 'finalizada'
      AND p.finalizada_em IS NOT NULL
      AND p.iniciada_em IS NOT NULL
  ),
  
  -- 3. Calcular média dos intervalos válidos (apenas <= 60 minutos)
  metricas_intervalo AS (
    SELECT 
      entrevistador,
      ROUND(AVG(intervalo_minutos), 1) AS intervalo_medio_minutos
    FROM intervalos
    WHERE intervalo_minutos IS NOT NULL
      AND intervalo_minutos > 0
      AND intervalo_minutos <= 60
    GROUP BY entrevistador
  )
  
  -- 4. Juntar as duas métricas
  SELECT 
    d.entrevistador,
    d.total_entrevistas,
    d.duracao_media_minutos,
    i.intervalo_medio_minutos
  FROM metricas_duracao d
  LEFT JOIN metricas_intervalo i ON d.entrevistador = i.entrevistador
  ORDER BY d.total_entrevistas DESC;
$$;

-- Testar a função corrigida
SELECT * FROM calcular_produtividade();
