-- ============================================
-- FUNÇÃO: Buscar pesquisas para tabela COM FILTROS
-- ============================================
-- Retorna pesquisas aceitas com filtros de período, cidade e entrevistadora

DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(integer, integer);
DROP FUNCTION IF EXISTS buscar_pesquisas_tabela_filtros(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION buscar_pesquisas_tabela_filtros(
  p_periodo text DEFAULT 'todos',
  p_cidade text DEFAULT NULL,
  p_entrevistadora text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  data_pesquisa timestamptz,
  cidade text,
  endereco text,
  entrevistadora text,
  nome_entrevistado text,
  data_nascimento text,
  autorizacao_contato text,
  whatsapp text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_data_inicio timestamptz;
BEGIN
  -- Calcular data de início baseado no período
  CASE p_periodo
    WHEN 'hoje' THEN
      v_data_inicio := CURRENT_DATE;
    WHEN 'semana' THEN
      v_data_inicio := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'mes' THEN
      v_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    ELSE
      v_data_inicio := NULL; -- 'todos' = sem filtro de data
  END CASE;

  RETURN QUERY
  SELECT 
    p.id,
    p.iniciada_em as data_pesquisa,
    p.cidade,
    p.endereco,
    -- Extrair apenas o primeiro nome do entrevistador
    COALESCE(NULLIF(SPLIT_PART(p.entrevistador, ' ', 1), ''), p.entrevistador) as entrevistadora,
    p.nome_entrevistado,
    p.data_nascimento,
    p.autorizacao_contato::text,
    p.whatsapp
  FROM pesquisas p
  WHERE p.aceite_participacao = 'true'  -- Apenas pesquisas aceitas
    -- Filtro de período
    AND (v_data_inicio IS NULL OR p.iniciada_em >= v_data_inicio)
    -- Filtro de cidade
    AND (p_cidade IS NULL OR p.cidade = p_cidade)
    -- Filtro de entrevistadora (compara com nome completo do entrevistador)
    AND (p_entrevistadora IS NULL OR p.entrevistador ILIKE p_entrevistadora || '%')
  ORDER BY p.iniciada_em DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_pesquisas_tabela_filtros(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_pesquisas_tabela_filtros(text, text, text, integer, integer) TO anon;

-- Testar - todas as pesquisas
SELECT * FROM buscar_pesquisas_tabela_filtros('todos', NULL, NULL, 10, 0);

-- Testar - filtro de período (últimos 7 dias)
SELECT * FROM buscar_pesquisas_tabela_filtros('semana', NULL, NULL, 10, 0);

-- Testar - filtro de cidade
SELECT * FROM buscar_pesquisas_tabela_filtros('todos', 'Ibiaí', NULL, 10, 0);

-- Testar - filtro de entrevistadora (primeiro nome)
SELECT * FROM buscar_pesquisas_tabela_filtros('todos', NULL, 'Maria', 10, 0);

