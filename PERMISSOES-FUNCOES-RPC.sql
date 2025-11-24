-- ============================================
-- CONCEDER PERMISSÕES ÀS FUNÇÕES RPC
-- ============================================
-- As funções precisam de permissão para serem executadas
-- por usuários autenticados

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION buscar_pesquisas_dashboard(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION buscar_pesquisas_dashboard(text, text, text) TO anon;

GRANT EXECUTE ON FUNCTION get_cidades_unicas() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cidades_unicas() TO anon;

GRANT EXECUTE ON FUNCTION get_entrevistadores_unicos(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_entrevistadores_unicos(text, text) TO anon;

-- Verificar permissões
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('buscar_pesquisas_dashboard', 'get_cidades_unicas', 'get_entrevistadores_unicos');

