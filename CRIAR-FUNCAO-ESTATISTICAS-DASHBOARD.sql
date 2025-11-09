-- Função para buscar estatísticas do dashboard com filtros
-- Retorna totais gerais e por pesquisador em uma única query

CREATE OR REPLACE FUNCTION buscar_estatisticas_dashboard(
  p_data_inicio TIMESTAMPTZ DEFAULT NULL,
  p_data_fim TIMESTAMPTZ DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_usuario_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_resultado JSON;
BEGIN
  WITH pesquisas_filtradas AS (
    SELECT 
      p.*,
      u.nome as entrevistador
    FROM pesquisas p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    WHERE 
      (p_data_inicio IS NULL OR p.iniciada_em >= p_data_inicio)
      AND (p_data_fim IS NULL OR p.iniciada_em <= p_data_fim)
      AND (p_cidade IS NULL OR p.cidade = p_cidade)
      AND (p_usuario_id IS NULL OR p.usuario_id = p_usuario_id)
  ),
  totais_gerais AS (
    SELECT
      COUNT(*) FILTER (WHERE aceite_participacao IN ('true', 'TRUE', 't', 'T')) as total_aceitas,
      COUNT(*) FILTER (WHERE aceite_participacao IN ('false', 'FALSE', 'f', 'F')) as total_recusadas,
      COUNT(*) FILTER (WHERE aceite_participacao = 'ausente') as total_ausentes,
      COUNT(*) as total_abordagens
    FROM pesquisas_filtradas
  ),
  por_pesquisador AS (
    SELECT
      entrevistador,
      usuario_id,
      COUNT(*) FILTER (WHERE aceite_participacao IN ('true', 'TRUE', 't', 'T')) as aceitas,
      COUNT(*) FILTER (WHERE aceite_participacao IN ('false', 'FALSE', 'f', 'F')) as recusadas,
      COUNT(*) FILTER (WHERE aceite_participacao = 'ausente') as ausentes,
      COUNT(*) as total_entrevistas,
      -- Métricas de produtividade (apenas entrevistas aceitas)
      ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (finalizada_em - iniciada_em)) / 60) FILTER (WHERE aceite_participacao IN ('true', 'TRUE', 't', 'T')), 0)::numeric, 1) as duracao_media_minutos,
      ROUND(AVG(
        EXTRACT(EPOCH FROM (
          iniciada_em - LAG(finalizada_em) OVER (PARTITION BY usuario_id ORDER BY iniciada_em)
        )) / 60
      )::numeric, 1) as intervalo_medio_minutos
    FROM pesquisas_filtradas
    WHERE entrevistador IS NOT NULL
    GROUP BY entrevistador, usuario_id
    HAVING COUNT(*) > 1  -- Apenas pesquisadores com mais de 1 entrevista
    ORDER BY total_entrevistas DESC
  )
  SELECT json_build_object(
    'totais', (SELECT row_to_json(t) FROM totais_gerais t),
    'por_pesquisador', (SELECT json_agg(p) FROM por_pesquisador p)
  ) INTO v_resultado;
  
  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql STABLE;

-- Exemplo de uso:

-- Todos os períodos, todas as cidades, todos os pesquisadores:
-- SELECT buscar_estatisticas_dashboard();

-- Apenas hoje:
-- SELECT buscar_estatisticas_dashboard(
--   CURRENT_DATE::TIMESTAMPTZ,
--   (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ
-- );

-- Última semana, cidade específica:
-- SELECT buscar_estatisticas_dashboard(
--   (CURRENT_DATE - INTERVAL '7 days')::TIMESTAMPTZ,
--   NULL,
--   'Ibiaí'
-- );

-- Pesquisador específico:
-- SELECT buscar_estatisticas_dashboard(
--   NULL,
--   NULL,
--   NULL,
--   1  -- ID do pesquisador
-- );

