-- ============================================
-- FUNÇÃO: Buscar todas as pesquisas para tabela
-- ============================================
-- Retorna todos os dados necessários para a tabela de pesquisas

DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(integer, integer);

CREATE OR REPLACE FUNCTION buscar_todas_pesquisas_tabela(
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
LANGUAGE sql
AS $$
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
  WHERE p.aceite_participacao = 'true'  -- Apenas pesquisas aceitas (tipo TEXT)
  ORDER BY p.iniciada_em DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela(integer, integer) TO anon;

-- Testar - primeira página
SELECT * FROM buscar_todas_pesquisas_tabela(100, 0);

-- Ver total de registros na tabela
SELECT COUNT(*) as total_pesquisas FROM pesquisas;

