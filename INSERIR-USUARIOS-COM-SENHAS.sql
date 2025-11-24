-- ==========================================
-- INSERIR USUÁRIOS COM SENHAS
-- ==========================================

-- ==========================================
-- 1. INSERIR USUÁRIO SUPER ADMIN
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Super Administrador ContaVoto',
  '11999999999',
  'superadmin123',
  5, -- ID do superadmin
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 2. INSERIR USUÁRIO PESQUISADOR
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Pesquisador ContaVoto',
  '11888888888',
  'pesquisador123',
  1, -- ID do pesquisador
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 3. INSERIR USUÁRIO ADMIN
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Administrador ContaVoto',
  '11777777777',
  'admin123',
  4, -- ID do admin
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 4. INSERIR USUÁRIO SUPORTE
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Suporte ContaVoto',
  '11666666666',
  'suporte123',
  3, -- ID do suporte
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 5. INSERIR USUÁRIO CANDIDATO
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  senha,
  tipo_usuario_id,
  ativo
) VALUES (
  'Candidato ContaVoto',
  '11555555555',
  'candidato123',
  2, -- ID do candidato
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 6. VERIFICAR INSERÇÃO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  t.descricao as tipo_descricao,
  t.nivel_permissao,
  u.ativo,
  u.criado_em
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
ORDER BY t.nivel_permissao DESC, u.nome;

-- ==========================================
-- CREDENCIAIS DE LOGIN:
-- ==========================================
/*
SUPER ADMIN:
- Telefone: 11999999999
- Senha: superadmin123

PESQUISADOR:
- Telefone: 11888888888
- Senha: pesquisador123

ADMIN:
- Telefone: 11777777777
- Senha: admin123

SUPORTE:
- Telefone: 11666666666
- Senha: suporte123

CANDIDATO:
- Telefone: 11555555555
- Senha: candidato123
*/








