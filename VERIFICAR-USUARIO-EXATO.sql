-- ==========================================
-- VERIFICAR USUÁRIO EXATO
-- ==========================================

-- ==========================================
-- 1. VERIFICAR SE O USUÁRIO EXISTE
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id,
  criado_em
FROM usuarios 
WHERE telefone = '38998143436';

-- ==========================================
-- 2. VERIFICAR SE ESTÁ ATIVO
-- ==========================================
SELECT 
  telefone,
  ativo,
  CASE 
    WHEN ativo = true THEN 'ATIVO'
    WHEN ativo = false THEN 'INATIVO'
    WHEN ativo IS NULL THEN 'NULL'
    ELSE 'DESCONHECIDO'
  END as status_ativo
FROM usuarios 
WHERE telefone = '38998143436';

-- ==========================================
-- 3. VERIFICAR SE A SENHA ESTÁ CORRETA
-- ==========================================
SELECT 
  telefone,
  senha,
  CASE 
    WHEN senha = '123456' THEN 'SENHA CORRETA'
    WHEN senha IS NULL THEN 'SENHA NULL'
    ELSE 'SENHA DIFERENTE'
  END as status_senha
FROM usuarios 
WHERE telefone = '38998143436';

-- ==========================================
-- 4. VERIFICAR TIPO DE USUÁRIO
-- ==========================================
SELECT 
  u.telefone,
  u.tipo_usuario_id,
  t.nome as tipo_nome,
  t.nivel_permissao
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '38998143436';

-- ==========================================
-- 5. TESTAR A QUERY EXATA DO AUTH SERVICE
-- ==========================================
SELECT *
FROM usuarios
WHERE telefone = '38998143436' 
  AND ativo = true;

-- ==========================================
-- 6. SE NÃO RETORNAR NADA, CORRIGIR
-- ==========================================
-- Atualizar para garantir que está ativo
UPDATE usuarios 
SET ativo = true
WHERE telefone = '38998143436';

-- ==========================================
-- 7. VERIFICAR NOVAMENTE
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id
FROM usuarios 
WHERE telefone = '38998143436';



