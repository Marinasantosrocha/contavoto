-- ============================================
-- FUNÇÃO: Buscar todas as pesquisas para tabela
-- ============================================
-- Retorna todos os dados necessários para a tabela de pesquisas

DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(integer, integer);
DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION buscar_todas_pesquisas_tabela(
  p_periodo text DEFAULT 'todos',
  p_cidade text DEFAULT NULL,
  p_entrevistador text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  cidade text,
  endereco text,
  entrevistador text,
  entrevistador_primeiro_nome text,
  aceite_participacao text,
  nome_entrevistado text,
  data_nascimento text,
  autorizacao_contato text,
  whatsapp text,
  iniciada_em timestamptz
) 
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.cidade,
    p.endereco,
    p.entrevistador,
    -- Extrair apenas o primeiro nome do entrevistador
    SPLIT_PART(p.entrevistador, ' ', 1) as entrevistador_primeiro_nome,
    p.aceite_participacao,
    p.nome_entrevistado,
    p.data_nascimento,
    p.autorizacao_contato::text,
    p.whatsapp,
    p.iniciada_em
  FROM pesquisas p
  WHERE p.aceite_participacao = 'true'  -- Apenas pesquisas aceitas (tipo TEXT)
    -- Filtro de período
    AND (
      p_periodo = 'todos' OR
      (p_periodo = 'hoje' AND DATE(p.iniciada_em) = CURRENT_DATE) OR
      (p_periodo = 'semana' AND p.iniciada_em >= CURRENT_DATE - INTERVAL '7 days') OR
      (p_periodo = 'mes' AND p.iniciada_em >= CURRENT_DATE - INTERVAL '30 days')
    )
    -- Filtro de cidade
    AND (p_cidade IS NULL OR p.cidade = p_cidade)
    -- Filtro de entrevistador
    AND (p_entrevistador IS NULL OR p.entrevistador = p_entrevistador)
  ORDER BY p.iniciada_em DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela(text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela(text, text, text, integer, integer) TO anon;

-- Testar - primeira página (todos os filtros)
SELECT * FROM buscar_todas_pesquisas_tabela('todos', NULL, NULL, 10, 0);

-- Testar - filtro de período (últimos 7 dias)
SELECT * FROM buscar_todas_pesquisas_tabela('semana', NULL, NULL, 10, 0);

-- Testar - filtro de cidade
SELECT * FROM buscar_todas_pesquisas_tabela('todos', 'Ibiaí', NULL, 10, 0);

-- Ver total de registros na tabela
SELECT COUNT(*) as total_pesquisas FROM pesquisas WHERE aceite_participacao = 'true';

