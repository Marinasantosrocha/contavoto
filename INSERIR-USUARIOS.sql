-- ==========================================
-- INSERIR USUÁRIOS INICIAIS - ContaVoto
-- ==========================================

-- IMPORTANTE: Execute este SQL APÓS criar os usuários no Auth Dashboard do Supabase

-- ==========================================
-- 1. VERIFICAR SE A TABELA TIPOS_USUARIOS EXISTE
-- ==========================================
-- Se não existir, execute primeiro o ATUALIZACOES-BANCO.sql

-- ==========================================
-- 2. INSERIR TIPOS DE USUÁRIOS (se não existirem)
-- ==========================================
INSERT INTO tipos_usuarios (nome, descricao, nivel_permissao) VALUES 
  ('superadmin', 'Super Administrador - Acesso total ao sistema', 5),
  ('admin', 'Administrador - Gerenciamento completo', 4),
  ('suporte', 'Suporte Técnico - Acesso limitado', 3),
  ('candidato', 'Candidato - Visualização de dados', 2),
  ('pesquisador', 'Pesquisador - Coleta de dados', 1)
ON CONFLICT (nome) DO NOTHING;

-- ==========================================
-- 3. INSERIR USUÁRIO SUPER ADMIN
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em,
  atualizado_em
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'superadmin@contavoto.com'),
  'Super Administrador ContaVoto',
  '11999999999',
  (SELECT id FROM tipos_usuarios WHERE nome = 'superadmin'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (telefone) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  nome = EXCLUDED.nome,
  tipo_usuario_id = EXCLUDED.tipo_usuario_id,
  ativo = EXCLUDED.ativo,
  atualizado_em = NOW();

-- ==========================================
-- 4. INSERIR USUÁRIO PESQUISADOR
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em,
  atualizado_em
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'pesquisador@contavoto.com'),
  'Pesquisador ContaVoto',
  '11888888888',
  (SELECT id FROM tipos_usuarios WHERE nome = 'pesquisador'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (telefone) DO UPDATE SET
  auth_id = EXCLUDED.auth_id,
  nome = EXCLUDED.nome,
  tipo_usuario_id = EXCLUDED.tipo_usuario_id,
  ativo = EXCLUDED.ativo,
  atualizado_em = NOW();

-- ==========================================
-- 5. VERIFICAR INSERÇÃO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  t.nome as tipo_usuario,
  t.descricao as tipo_descricao,
  t.nivel_permissao,
  u.ativo,
  u.criado_em
FROM usuarios u
JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone IN ('11999999999', '11888888888')
ORDER BY t.nivel_permissao DESC;

-- ==========================================
-- 6. INSERIR USUÁRIOS ADICIONAIS (OPCIONAL)
-- ==========================================

-- Admin
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em,
  atualizado_em
) VALUES (
  NULL, -- Será preenchido quando criar no Auth
  'Administrador ContaVoto',
  '11777777777',
  (SELECT id FROM tipos_usuarios WHERE nome = 'admin'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (telefone) DO NOTHING;

-- Suporte
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em,
  atualizado_em
) VALUES (
  NULL, -- Será preenchido quando criar no Auth
  'Suporte ContaVoto',
  '11666666666',
  (SELECT id FROM tipos_usuarios WHERE nome = 'suporte'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (telefone) DO NOTHING;

-- Candidato
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em,
  atualizado_em
) VALUES (
  NULL, -- Será preenchido quando criar no Auth
  'Candidato ContaVoto',
  '11555555555',
  (SELECT id FROM tipos_usuarios WHERE nome = 'candidato'),
  true,
  NOW(),
  NOW()
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 7. VERIFICAR TODOS OS USUÁRIOS INSERIDOS
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
  END as status_auth,
  u.criado_em
FROM usuarios u
JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
ORDER BY t.nivel_permissao DESC, u.nome;

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
   - Telefone: 11999999999

   PESQUISADOR:
   - Email: pesquisador@contavoto.com
   - Senha: pesquisador123
   - Telefone: 11888888888

4. Execute este SQL novamente para vincular os auth_id
*/
