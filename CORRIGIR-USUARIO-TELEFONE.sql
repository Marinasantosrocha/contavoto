-- ==========================================
-- VERIFICAR E CORRIGIR USUÁRIO COM TELEFONE 38998143436
-- ==========================================

-- ==========================================
-- 1. VERIFICAR DADOS DO USUÁRIO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.senha,
  u.ativo,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  t.nivel_permissao,
  u.criado_em
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '38998143436';

-- ==========================================
-- 2. ATUALIZAR USUÁRIO COM DADOS COMPLETOS
-- ==========================================
UPDATE usuarios 
SET 
  nome = 'Usuário Teste',
  senha = '123456',
  tipo_usuario_id = 1, -- pesquisador
  ativo = true
WHERE telefone = '38998143436';

-- ==========================================
-- 3. VERIFICAR SE ATUALIZOU
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.senha,
  u.ativo,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  t.nivel_permissao
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '38998143436';

-- ==========================================
-- 4. TESTAR LOGIN
-- ==========================================
-- Agora você pode fazer login com:
-- Telefone: 38998143436
-- Senha: 123456

-- ==========================================
-- 5. SE AINDA NÃO FUNCIONAR, CRIAR USUÁRIO NOVO
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Usuário Teste Novo',
  '38998143436',
  '123456',
  1, -- pesquisador
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
  u.id,
  u.nome,
  u.telefone,
  u.senha,
  u.ativo,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  t.nivel_permissao
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '38998143436';
