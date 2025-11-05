-- ==========================================
-- ADICIONAR COLUNA tipo_usuario_id NA TABELA USUARIOS
-- ==========================================

-- ==========================================
-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA USUARIOS
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 2. ADICIONAR COLUNA tipo_usuario_id
-- ==========================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario_id INTEGER;

-- ==========================================
-- 3. DEFINIR VALOR PADRÃO (pesquisador = 1)
-- ==========================================
UPDATE usuarios 
SET tipo_usuario_id = 1 
WHERE tipo_usuario_id IS NULL;

-- ==========================================
-- 4. TORNAR A COLUNA OBRIGATÓRIA
-- ==========================================
ALTER TABLE usuarios ALTER COLUMN tipo_usuario_id SET NOT NULL;

-- ==========================================
-- 5. CRIAR FOREIGN KEY
-- ==========================================
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_tipo_usuario_id_fkey 
FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuarios(id);

-- ==========================================
-- 6. CRIAR ÍNDICE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);

-- ==========================================
-- 7. VERIFICAR ESTRUTURA FINAL
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 8. VERIFICAR DADOS
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

-- ==========================================
-- PRONTO! Agora execute INSERIR-USUARIOS-IDS-INT.sql
-- ==========================================



