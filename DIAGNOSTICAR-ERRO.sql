-- ==========================================
-- DIAGNOSTICAR ESTRUTURA DA TABELA USUARIOS
-- ==========================================

-- ==========================================
-- 1. VERIFICAR COLUNAS DA TABELA USUARIOS
-- ==========================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 2. VERIFICAR CONSTRAINTS DA TABELA USUARIOS
-- ==========================================
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'usuarios';

-- ==========================================
-- 3. VERIFICAR SE A TABELA TIPOS_USUARIOS EXISTE
-- ==========================================
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'tipos_usuarios'
) as tabela_tipos_existe;

-- ==========================================
-- 4. VERIFICAR DADOS NA TABELA TIPOS_USUARIOS
-- ==========================================
SELECT * FROM tipos_usuarios ORDER BY id;

-- ==========================================
-- 5. VERIFICAR DADOS ATUAIS NA TABELA USUARIOS
-- ==========================================
SELECT 
  id,
  auth_id,
  nome,
  telefone,
  tipo_usuario_id,
  ativo,
  criado_em
FROM usuarios
ORDER BY criado_em DESC;

-- ==========================================
-- 6. TESTAR INSERT SIMPLES
-- ==========================================
-- Vamos tentar inserir um usuário simples para ver qual erro aparece
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
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 7. VERIFICAR RESULTADO DO TESTE
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



