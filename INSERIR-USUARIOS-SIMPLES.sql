-- ==========================================
-- INSERIR USUÁRIOS - VERSÃO SIMPLES
-- ==========================================

-- IMPORTANTE: Execute este SQL APÓS executar ATUALIZACOES-BANCO.sql

-- ==========================================
-- 1. INSERIR TIPOS DE USUÁRIOS
-- ==========================================
INSERT INTO tipos_usuarios (nome, descricao, nivel_permissao) VALUES 
  ('superadmin', 'Super Administrador - Acesso total ao sistema', 5),
  ('admin', 'Administrador - Gerenciamento completo', 4),
  ('suporte', 'Suporte Técnico - Acesso limitado', 3),
  ('candidato', 'Candidato - Visualização de dados', 2),
  ('pesquisador', 'Pesquisador - Coleta de dados', 1)
ON CONFLICT (nome) DO NOTHING;

-- ==========================================
-- 2. INSERIR USUÁRIO SUPER ADMIN
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Super Administrador ContaVoto',
  '11999999999',
  (SELECT id FROM tipos_usuarios WHERE nome = 'superadmin'),
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 3. INSERIR USUÁRIO PESQUISADOR
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Pesquisador ContaVoto',
  '11888888888',
  (SELECT id FROM tipos_usuarios WHERE nome = 'pesquisador'),
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 4. VERIFICAR INSERÇÃO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  t.nome as tipo_usuario,
  t.descricao as tipo_descricao,
  t.nivel_permissao,
  u.ativo,
  CASE 
    WHEN u.auth_id IS NOT NULL THEN '✅ Conectado ao Auth'
    ELSE '⚠️ Não conectado ao Auth'
  END as status_auth
FROM usuarios u
JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone IN ('11999999999', '11888888888')
ORDER BY t.nivel_permissao DESC;

-- ==========================================
-- 5. ATUALIZAR AUTH_ID APÓS CRIAR NO AUTH
-- ==========================================
-- Execute estes comandos APÓS criar os usuários no Auth Dashboard:

-- Para Super Admin:
-- UPDATE usuarios SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'superadmin@contavoto.com'
-- ) WHERE telefone = '11999999999';

-- Para Pesquisador:
-- UPDATE usuarios SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'pesquisador@contavoto.com'
-- ) WHERE telefone = '11888888888';

-- ==========================================
-- INSTRUÇÕES PARA CRIAR NO AUTH:
-- ==========================================
/*
1. Acesse: https://app.supabase.com/project/_/auth/users
2. Clique em "Add user"
3. Crie os usuários:

   SUPER ADMIN:
   - Email: superadmin@contavoto.com
   - Senha: superadmin123

   PESQUISADOR:
   - Email: pesquisador@contavoto.com
   - Senha: pesquisador123

4. Execute os comandos UPDATE acima para vincular os auth_id
*/
