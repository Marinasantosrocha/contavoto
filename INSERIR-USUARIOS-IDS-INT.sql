-- ==========================================
-- INSERIR USUÁRIOS COM IDs INT
-- ==========================================
-- Usando IDs inteiros simples

-- ==========================================
-- 1. INSERIR USUÁRIO SUPER ADMIN
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
  5, -- ID do superadmin (nível 5)
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 2. INSERIR USUÁRIO PESQUISADOR
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
  1, -- ID do pesquisador (nível 1)
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 3. INSERIR USUÁRIO ADMIN
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Administrador ContaVoto',
  '11777777777',
  4, -- ID do admin (nível 4)
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 4. INSERIR USUÁRIO SUPORTE
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Suporte ContaVoto',
  '11666666666',
  3, -- ID do suporte (nível 3)
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 5. INSERIR USUÁRIO CANDIDATO
-- ==========================================
INSERT INTO usuarios (
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Candidato ContaVoto',
  '11555555555',
  2, -- ID do candidato (nível 2)
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 6. VERIFICAR INSERÇÃO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  t.id as tipo_id,
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
-- 7. ATUALIZAR AUTH_ID APÓS CRIAR NO AUTH
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

-- Para Admin:
-- UPDATE usuarios SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'admin@contavoto.com'
-- ) WHERE telefone = '11777777777';

-- Para Suporte:
-- UPDATE usuarios SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'suporte@contavoto.com'
-- ) WHERE telefone = '11666666666';

-- Para Candidato:
-- UPDATE usuarios SET auth_id = (
--   SELECT id FROM auth.users WHERE email = 'candidato@contavoto.com'
-- ) WHERE telefone = '11555555555';

-- ==========================================
-- MAPEAMENTO DOS IDs INT:
-- ==========================================
/*
1 - pesquisador (nível 1)
2 - candidato (nível 2)  
3 - suporte (nível 3)
4 - admin (nível 4)
5 - superadmin (nível 5)
*/
