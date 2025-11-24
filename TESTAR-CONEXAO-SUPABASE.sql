-- ==========================================
-- TESTAR CONEXÃO COM SUPABASE
-- ==========================================

-- ==========================================
-- 1. TESTAR QUERY SIMPLES
-- ==========================================
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- ==========================================
-- 2. TESTAR QUERY COM FILTRO
-- ==========================================
SELECT COUNT(*) as usuarios_ativos 
FROM usuarios 
WHERE ativo = true;

-- ==========================================
-- 3. TESTAR QUERY EXATA DO LOGIN
-- ==========================================
SELECT *
FROM usuarios
WHERE telefone = '38998143436' 
  AND ativo = true;

-- ==========================================
-- 4. VERIFICAR SE A TABELA TIPOS_USUARIOS EXISTE
-- ==========================================
SELECT COUNT(*) as total_tipos FROM tipos_usuarios;

-- ==========================================
-- 5. VERIFICAR SE O TIPO 5 EXISTE
-- ==========================================
SELECT * FROM tipos_usuarios WHERE id = 5;

-- ==========================================
-- 6. TESTAR JOIN COMPLETO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.senha,
  u.ativo,
  u.tipo_usuario_id,
  t.nome as tipo_nome,
  t.nivel_permissao
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '38998143436';








