-- ============================================
-- FUNÇÃO: Buscar Pesquisas para Dashboard
-- ============================================
-- Esta função busca TODAS as pesquisas sem limite de 1000
-- Aceita filtros: período, cidade e entrevistador
-- Retorna apenas campos necessários para o dashboard

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
  autorizacao_contato boolean,
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
    p.autorizacao_contato,
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

-- ============================================
-- FUNÇÃO AUXILIAR: Buscar Cidades Únicas
-- ============================================
-- Retorna todas as cidades únicas do banco

CREATE OR REPLACE FUNCTION get_cidades_unicas()
RETURNS TABLE (cidade text)
LANGUAGE sql
AS $$
  SELECT DISTINCT p.cidade
  FROM pesquisas p
  WHERE p.cidade IS NOT NULL
  ORDER BY p.cidade;
$$;

-- ============================================
-- FUNÇÃO AUXILIAR: Buscar Entrevistadores Únicos
-- ============================================
-- Retorna todos os entrevistadores únicos do banco
-- Opcionalmente filtrados por cidade e período

CREATE OR REPLACE FUNCTION get_entrevistadores_unicos(
  filtro_periodo text DEFAULT 'todos',
  filtro_cidade text DEFAULT NULL
)
RETURNS TABLE (entrevistador text)
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
      data_inicio := '1970-01-01'::timestamptz;
  END CASE;

  -- Retornar entrevistadores únicos
  RETURN QUERY
  SELECT DISTINCT p.entrevistador
  FROM pesquisas p
  WHERE 
    p.entrevistador IS NOT NULL
    AND p.iniciada_em >= data_inicio
    AND (filtro_cidade IS NULL OR p.cidade = filtro_cidade)
  ORDER BY p.entrevistador;
END;
$$;

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION buscar_pesquisas_dashboard IS 
'Busca todas as pesquisas para o dashboard sem limite de 1000 registros. 
Aceita filtros opcionais de período, cidade e entrevistador.';

COMMENT ON FUNCTION get_cidades_unicas IS 
'Retorna lista de cidades únicas presentes nas pesquisas.';

COMMENT ON FUNCTION get_entrevistadores_unicos IS 
'Retorna lista de entrevistadores únicos, opcionalmente filtrados por período e cidade.';

