-- ==========================================
-- TESTAR QUERY DE AUTENTICAÇÃO
-- ==========================================

-- ==========================================
-- 1. VERIFICAR SE O USUÁRIO EXISTE E ESTÁ ATIVO
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

-- ==========================================
-- 2. TESTAR A QUERY EXATA DO AUTH SERVICE
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
-- 3. SE NÃO RETORNAR NADA, CORRIGIR O USUÁRIO
-- ==========================================
-- Verificar se tipo_usuario_id está NULL
UPDATE usuarios 
SET 
  tipo_usuario_id = 1, -- pesquisador
  ativo = true,
  senha = COALESCE(senha, '123456')
WHERE telefone = '38998143436' 
  AND (tipo_usuario_id IS NULL OR ativo = false OR senha IS NULL);

-- ==========================================
-- 4. TESTAR NOVAMENTE
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id,
  tipos_usuarios.nome as tipo_nome,
  tipos_usuarios.nivel_permissao
FROM usuarios
LEFT JOIN tipos_usuarios ON usuarios.tipo_usuario_id = tipos_usuarios.id
WHERE telefone = '38998143436';

-- ==========================================
-- 5. SE AINDA NÃO FUNCIONAR, CRIAR USUÁRIO COMPLETO
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Usuário Teste',
  '38998143436',
  '123456',
  1,
  true
) ON CONFLICT (telefone) DO UPDATE SET
  nome = EXCLUDED.nome,
  senha = EXCLUDED.senha,
  tipo_usuario_id = EXCLUDED.tipo_usuario_id,
  ativo = EXCLUDED.ativo;

-- ==========================================
-- 6. VERIFICAR RESULTADO FINAL
-- ==========================================
SELECT 
  id,
  nome,
  telefone,
  senha,
  ativo,
  tipo_usuario_id,
  tipos_usuarios.nome as tipo_nome,
  tipos_usuarios.nivel_permissao
FROM usuarios
LEFT JOIN tipos_usuarios ON usuarios.tipo_usuario_id = tipos_usuarios.id
WHERE telefone = '38998143436';








