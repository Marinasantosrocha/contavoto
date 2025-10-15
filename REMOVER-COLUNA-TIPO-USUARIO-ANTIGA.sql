-- ==========================================
-- CORRIGIR TABELA USUARIOS - REMOVER COLUNA ANTIGA
-- ==========================================

-- ==========================================
-- 1. REMOVER CONSTRAINT NOT NULL DE tipo_usuario
-- ==========================================
ALTER TABLE usuarios ALTER COLUMN tipo_usuario DROP NOT NULL;

-- ==========================================
-- 2. DEFINIR VALOR PADRÃO PARA tipo_usuario (temporário)
-- ==========================================
UPDATE usuarios 
SET tipo_usuario = 'pesquisador' 
WHERE tipo_usuario IS NULL;

-- ==========================================
-- 3. DEFINIR VALOR PADRÃO PARA tipo_usuario_id
-- ==========================================
UPDATE usuarios 
SET tipo_usuario_id = 1 
WHERE tipo_usuario_id IS NULL;

-- ==========================================
-- 4. REMOVER COLUNA tipo_usuario ANTIGA
-- ==========================================
ALTER TABLE usuarios DROP COLUMN tipo_usuario;

-- ==========================================
-- 5. VERIFICAR ESTRUTURA FINAL
-- ==========================================
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 6. TESTAR INSERT
-- ==========================================
INSERT INTO usuarios (
  nome,
  telefone,
  tipo_usuario_id,
  ativo
) VALUES (
  'Usuario Teste',
  '11999999999',
  1,
  true
) ON CONFLICT (telefone) DO NOTHING;

-- ==========================================
-- 7. VERIFICAR RESULTADO
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
-- PRONTO! Agora execute INSERIR-USUARIOS-IDS-INT.sql
-- ==========================================
