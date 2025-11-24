-- ============================================
-- FUNÇÃO: Buscar todas as pesquisas para tabela
-- ============================================
-- Retorna TODOS os dados (SEM LIMITE) para a tabela de pesquisas
-- Filtros e paginação serão aplicados no front-end

-- IMPORTANTE: Remover TODAS as versões antigas da função
DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela() CASCADE;
DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(integer, integer) CASCADE;
DROP FUNCTION IF EXISTS buscar_todas_pesquisas_tabela(text, text, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS buscar_pesquisas_tabela_filtros(text, text, text, integer, integer) CASCADE;

CREATE OR REPLACE FUNCTION buscar_todas_pesquisas_tabela()
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
STABLE
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
  ORDER BY p.iniciada_em DESC;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela() TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_todas_pesquisas_tabela() TO anon;

-- Testar - buscar todas as pesquisas aceitas
SELECT COUNT(*) as total_retornado FROM buscar_todas_pesquisas_tabela();

-- Ver as primeiras 10 pesquisas
SELECT * FROM buscar_todas_pesquisas_tabela() LIMIT 10;

-- Ver total de pesquisas aceitas na tabela
SELECT COUNT(*) as total_pesquisas_aceitas FROM pesquisas WHERE aceite_participacao = 'true';

