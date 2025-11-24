-- ============================================
-- FUNÇÕES: Buscar opções de filtros para tabela
-- ============================================

-- Função para buscar todas as cidades únicas (apenas pesquisas aceitas)
DROP FUNCTION IF EXISTS buscar_cidades_pesquisas_aceitas();

CREATE OR REPLACE FUNCTION buscar_cidades_pesquisas_aceitas()
RETURNS TABLE (cidade text)
LANGUAGE sql
AS $$
  SELECT DISTINCT p.cidade
  FROM pesquisas p
  WHERE p.aceite_participacao = 'true'
    AND p.cidade IS NOT NULL
  ORDER BY p.cidade;
$$;

-- Função para buscar todas as entrevistadoras únicas (apenas pesquisas aceitas)
DROP FUNCTION IF EXISTS buscar_entrevistadoras_pesquisas_aceitas();

CREATE OR REPLACE FUNCTION buscar_entrevistadoras_pesquisas_aceitas()
RETURNS TABLE (entrevistador text)
LANGUAGE sql
AS $$
  SELECT DISTINCT p.entrevistador
  FROM pesquisas p
  WHERE p.aceite_participacao = 'true'
    AND p.entrevistador IS NOT NULL
  ORDER BY p.entrevistador;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION buscar_cidades_pesquisas_aceitas() TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_cidades_pesquisas_aceitas() TO anon;
GRANT EXECUTE ON FUNCTION buscar_entrevistadoras_pesquisas_aceitas() TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_entrevistadoras_pesquisas_aceitas() TO anon;

-- Testar
SELECT * FROM buscar_cidades_pesquisas_aceitas();
SELECT * FROM buscar_entrevistadoras_pesquisas_aceitas();

