-- ============================================
-- FUNÇÃO COM PAGINAÇÃO: Buscar pesquisas
-- ============================================
-- Aceita limit e offset para buscar em lotes

DROP FUNCTION IF EXISTS buscar_todas_pesquisas_dashboard();
DROP FUNCTION IF EXISTS buscar_pesquisas_paginadas(integer, integer);

CREATE OR REPLACE FUNCTION buscar_pesquisas_paginadas(
  p_limit integer DEFAULT 1000,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  aceite_participacao text,
  cidade text,
  entrevistador text,
  autorizacao_contato text,
  iniciada_em timestamptz,
  bairro text,
  motivo_recusa text
) 
LANGUAGE sql
AS $$
  SELECT 
    p.id,
    p.aceite_participacao,
    p.cidade,
    p.entrevistador,
    p.autorizacao_contato::text,
    p.iniciada_em,
    p.bairro,
    p.motivo_recusa
  FROM pesquisas p
  ORDER BY p.iniciada_em DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_pesquisas_paginadas(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_pesquisas_paginadas(integer, integer) TO anon;

-- Testar - primeira página
SELECT COUNT(*) FROM buscar_pesquisas_paginadas(1000, 0);

-- Testar - segunda página
SELECT COUNT(*) FROM buscar_pesquisas_paginadas(1000, 1000);

-- Ver total de registros na tabela
SELECT COUNT(*) as total_pesquisas FROM pesquisas;

