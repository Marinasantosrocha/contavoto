-- FUNÇÃO PARA CALCULAR MÉTRICAS DE PRODUTIVIDADE DOS PESQUISADORES
-- Calcula:
-- 1. Duração média das entrevistas (iniciada_em -> finalizada_em)
-- 2. Intervalo médio entre entrevistas (finalizada_em -> próxima iniciada_em), excluindo > 60min

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
  -- 1. Calcular duração de cada entrevista
  duracoes AS (
    SELECT 
      p.entrevistador,
      EXTRACT(EPOCH FROM (p.finalizada_em - p.iniciada_em)) / 60 AS duracao_minutos
    FROM pesquisas p
    WHERE p.status = 'finalizada'
      AND p.finalizada_em IS NOT NULL
      AND p.iniciada_em IS NOT NULL
  ),
  
  -- 2. Calcular intervalos entre entrevistas consecutivas
  intervalos AS (
    SELECT 
      p.entrevistador,
      p.finalizada_em,
      p.iniciada_em,
      LEAD(p.iniciada_em) OVER (
        PARTITION BY p.entrevistador 
        ORDER BY p.iniciada_em
      ) AS proxima_iniciada,
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
    ORDER BY p.entrevistador, p.iniciada_em
  ),
  
  -- 3. Filtrar intervalos válidos (apenas <= 60 minutos)
  intervalos_validos AS (
    SELECT 
      entrevistador,
      intervalo_minutos
    FROM intervalos
    WHERE intervalo_minutos IS NOT NULL
      AND intervalo_minutos > 0
      AND intervalo_minutos <= 60
  ),
  
  -- 4. Agregar por entrevistador
  metricas AS (
    SELECT 
      d.entrevistador,
      COUNT(d.duracao_minutos)::BIGINT AS total_entrevistas,
      ROUND(AVG(d.duracao_minutos), 1) AS duracao_media_minutos,
      ROUND(AVG(iv.intervalo_minutos), 1) AS intervalo_medio_minutos
    FROM duracoes d
    LEFT JOIN intervalos_validos iv ON d.entrevistador = iv.entrevistador
    GROUP BY d.entrevistador
    HAVING COUNT(d.duracao_minutos) > 0
  )
  
  SELECT * FROM metricas
  ORDER BY total_entrevistas DESC;
$$;

-- Testar a função
SELECT * FROM calcular_produtividade();
