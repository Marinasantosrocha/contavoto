-- ==========================================
-- TESTAR INSERT SIMPLES
-- ==========================================

-- ==========================================
-- 1. VERIFICAR SE A TABELA TIPOS_USUARIOS EXISTE E TEM DADOS
-- ==========================================
SELECT * FROM tipos_usuarios ORDER BY id;

-- ==========================================
-- 2. TESTAR INSERT SIMPLES
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Teste Usuario',
  '11999999999',
  1,
  true
);

-- ==========================================
-- 3. VERIFICAR SE INSERIU
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  u.ativo
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
WHERE u.telefone = '11999999999';

-- ==========================================
-- 4. SE FUNCIONOU, INSERIR OS OUTROS USUÁRIOS
-- ==========================================

-- Super Admin
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Super Administrador ContaVoto',
  '11999999998',
  5,
  true
);

-- Pesquisador
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Pesquisador ContaVoto',
  '11888888888',
  1,
  true
);

-- Admin
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Administrador ContaVoto',
  '11777777777',
  4,
  true
);

-- Suporte
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Suporte ContaVoto',
  '11666666666',
  3,
  true
);

-- Candidato
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Candidato ContaVoto',
  '11555555555',
  2,
  true
);

-- ==========================================
-- 5. VERIFICAR TODOS OS USUÁRIOS INSERIDOS
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  u.tipo_usuario_id,
  t.nome as tipo_usuario,
  t.nivel_permissao,
  u.ativo
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
ORDER BY t.nivel_permissao DESC, u.nome;



