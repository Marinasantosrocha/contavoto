-- ==========================================
-- TESTAR QUERY EXATA DO AUTH SERVICE
-- ==========================================

-- ==========================================
-- 1. TESTAR A QUERY EXATA
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id,
  tipos_usuarios.id as tipo_id,
  tipos_usuarios.nome as tipo_nome,
  tipos_usuarios.descricao as tipo_descricao,
  tipos_usuarios.nivel_permissao
FROM usuarios
LEFT JOIN tipos_usuarios ON usuarios.tipo_usuario_id = tipos_usuarios.id
WHERE telefone = '38998143436' 
  AND ativo = true;

-- ==========================================
-- 2. VERIFICAR SE A TABELA TIPOS_USUARIOS TEM O ID 5
-- ==========================================
SELECT * FROM tipos_usuarios WHERE id = 5;

-- ==========================================
-- 3. TESTAR SEM O JOIN (para ver se o problema é no JOIN)
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id
FROM usuarios
WHERE telefone = '38998143436' 
  AND ativo = true;

-- ==========================================
-- 4. SE O JOIN NÃO FUNCIONAR, USAR QUERY SIMPLES
-- ==========================================
-- O AuthService pode precisar ser ajustado para fazer duas queries separadas








