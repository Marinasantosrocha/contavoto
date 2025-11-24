-- ============================================
-- FUNÇÃO SIMPLES: Buscar TODAS as pesquisas
-- ============================================
-- Sem filtros - filtros serão aplicados no frontend

DROP FUNCTION IF EXISTS buscar_todas_pesquisas_dashboard();

CREATE OR REPLACE FUNCTION buscar_todas_pesquisas_dashboard()
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
  ORDER BY p.iniciada_em DESC;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_dashboard() TO anon;

-- Testar
SELECT COUNT(*) FROM buscar_todas_pesquisas_dashboard();
SELECT * FROM buscar_todas_pesquisas_dashboard() LIMIT 10;

