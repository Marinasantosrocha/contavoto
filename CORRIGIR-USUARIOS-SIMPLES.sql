-- ==========================================
-- CORRIGIR TABELA USUARIOS - VERSÃO SIMPLES
-- ==========================================

-- ==========================================
-- 1. REMOVER CONSTRAINT NOT NULL DE tipo_usuario (se existir)
-- ==========================================
DO $$
BEGIN
    -- Verificar se a coluna tipo_usuario existe e remover NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
    ) THEN
        ALTER TABLE usuarios ALTER COLUMN tipo_usuario DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida da coluna tipo_usuario';
    END IF;
END $$;

-- ==========================================
-- 2. ADICIONAR COLUNA tipo_usuario_id (se não existir)
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN tipo_usuario_id INTEGER;
        RAISE NOTICE 'Coluna tipo_usuario_id criada';
    END IF;
END $$;

-- ==========================================
-- 3. DEFINIR VALOR PADRÃO PARA tipo_usuario_id
-- ==========================================
UPDATE usuarios 
SET tipo_usuario_id = 1 
WHERE tipo_usuario_id IS NULL;

-- ==========================================
-- 4. TORNAR tipo_usuario_id OBRIGATÓRIO
-- ==========================================
ALTER TABLE usuarios ALTER COLUMN tipo_usuario_id SET NOT NULL;

-- ==========================================
-- 5. CRIAR FOREIGN KEY (se não existir)
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'usuarios' 
        AND constraint_name = 'usuarios_tipo_usuario_id_fkey'
    ) THEN
        ALTER TABLE usuarios 
        ADD CONSTRAINT usuarios_tipo_usuario_id_fkey 
        FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuarios(id);
        RAISE NOTICE 'Foreign key criada';
    END IF;
END $$;

-- ==========================================
-- 6. CRIAR ÍNDICE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);

-- ==========================================
-- 7. VERIFICAR ESTRUTURA FINAL
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
-- 8. TESTAR INSERT
-- ==========================================
-- Teste simples
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
-- 9. VERIFICAR RESULTADO
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
-- PRONTO! Agora deve funcionar
-- ==========================================



