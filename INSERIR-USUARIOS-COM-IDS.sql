-- ==========================================
-- INSERIR USUÁRIOS COM IDs CORRETOS
-- ==========================================
-- Usando os IDs reais da tabela tipos_usuarios

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
  '5bb5ee03-d356-46bc-aa64-1264ebc16a63', -- ID do superadmin
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
  '5de626e7-f7b3-48fc-b110-49f0e22a611a', -- ID do pesquisador
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 3. INSERIR USUÁRIO ADMIN (OPCIONAL)
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
  '46003990-3210-434f-a67d-ae6165b6e620', -- ID do admin
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 4. INSERIR USUÁRIO SUPORTE (OPCIONAL)
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
  '7decbdaf-0123-427f-a4f9-d3bb15a106f9', -- ID do suporte
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 5. INSERIR USUÁRIO CANDIDATO (OPCIONAL)
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
  '52664931-9f53-4131-823e-9a29b57ad1db', -- ID do candidato
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 6. VERIFICAR INSERÇÃO
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
-- MAPEAMENTO DOS IDs DOS TIPOS:
-- ==========================================
/*
superadmin: 5bb5ee03-d356-46bc-aa64-1264ebc16a63 (nível 5)
admin:       46003990-3210-434f-a67d-ae6165b6e620 (nível 4)
suporte:     7decbdaf-0123-427f-a4f9-d3bb15a106f9 (nível 3)
candidato:   52664931-9f53-4131-823e-9a29b57ad1db (nível 2)
pesquisador: 5de626e7-f7b3-48fc-b110-49f0e22a611a (nível 1)
*/








