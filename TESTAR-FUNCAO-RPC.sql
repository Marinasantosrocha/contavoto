-- ============================================
-- TESTAR AS FUNÇÕES RPC CRIADAS
-- ============================================

-- 1. Verificar se as funções existem
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('buscar_pesquisas_dashboard', 'get_cidades_unicas', 'get_entrevistadores_unicos');

-- 2. Testar função get_cidades_unicas
SELECT * FROM get_cidades_unicas();

-- 3. Testar função buscar_pesquisas_dashboard (sem filtros)
SELECT * FROM buscar_pesquisas_dashboard('todos', NULL, NULL) LIMIT 10;

-- 4. Testar função buscar_pesquisas_dashboard (com filtro de período)
SELECT * FROM buscar_pesquisas_dashboard('semana', NULL, NULL) LIMIT 10;

-- 5. Contar total de registros sem filtro
SELECT COUNT(*) as total FROM buscar_pesquisas_dashboard('todos', NULL, NULL);

-- 6. Testar função get_entrevistadores_unicos
SELECT * FROM get_entrevistadores_unicos('todos', NULL);

