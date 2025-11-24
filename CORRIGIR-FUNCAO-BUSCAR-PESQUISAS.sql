-- ============================================
-- CORRIGIR FUNÇÃO: buscar_pesquisas_dashboard
-- ============================================
-- Problema: autorizacao_contato está como TEXT, não BOOLEAN
-- Solução: Fazer CAST para os tipos corretos

DROP FUNCTION IF EXISTS buscar_pesquisas_dashboard(text, text, text);

CREATE OR REPLACE FUNCTION buscar_pesquisas_dashboard(
  filtro_periodo text DEFAULT 'todos',
  filtro_cidade text DEFAULT NULL,
  filtro_entrevistador text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  aceite_participacao text,
  cidade text,
  entrevistador text,
  autorizacao_contato text,  -- Mudado de boolean para text
  iniciada_em timestamptz,
  bairro text,
  motivo_recusa text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  data_inicio timestamptz;
BEGIN
  -- Definir data de início baseada no período
  CASE filtro_periodo
    WHEN 'hoje' THEN
      data_inicio := date_trunc('day', now());
    WHEN 'semana' THEN
      data_inicio := now() - interval '7 days';
    WHEN 'mes' THEN
      data_inicio := now() - interval '30 days';
    ELSE
      data_inicio := '1970-01-01'::timestamptz; -- Todas as pesquisas
  END CASE;

  -- Retornar pesquisas filtradas
  RETURN QUERY
  SELECT 
    p.id,
    p.aceite_participacao,
    p.cidade,
    p.entrevistador,
    p.autorizacao_contato::text,  -- Cast para text
    p.iniciada_em,
    p.bairro,
    p.motivo_recusa
  FROM pesquisas p
  WHERE 
    p.iniciada_em >= data_inicio
    AND (filtro_cidade IS NULL OR p.cidade = filtro_cidade)
    AND (filtro_entrevistador IS NULL OR p.entrevistador = filtro_entrevistador)
  ORDER BY p.iniciada_em DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_pesquisas_dashboard(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_pesquisas_dashboard(text, text, text) TO anon;

-- Testar
SELECT * FROM buscar_pesquisas_dashboard('todos', NULL, NULL) LIMIT 5;

