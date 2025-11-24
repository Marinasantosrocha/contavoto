-- ==========================================
-- CORRIGIR ESTRUTURA DA TABELA USUARIOS
-- ==========================================

-- ==========================================
-- 1. VERIFICAR ESTRUTURA ATUAL
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 2. REMOVER CONSTRAINT NOT NULL DE tipo_usuario (se existir)
-- ==========================================
-- Primeiro, vamos verificar se a coluna tipo_usuario existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
    ) THEN
        -- Se existe, remover a constraint NOT NULL
        ALTER TABLE usuarios ALTER COLUMN tipo_usuario DROP NOT NULL;
        RAISE NOTICE 'Constraint NOT NULL removida da coluna tipo_usuario';
    ELSE
        RAISE NOTICE 'Coluna tipo_usuario não existe';
    END IF;
END $$;

-- ==========================================
-- 3. CRIAR COLUNA tipo_usuario_id (se não existir)
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN tipo_usuario_id UUID REFERENCES tipos_usuarios(id);
        RAISE NOTICE 'Coluna tipo_usuario_id criada';
    ELSE
        RAISE NOTICE 'Coluna tipo_usuario_id já existe';
    END IF;
END $$;

-- ==========================================
-- 4. MIGRAR DADOS (se necessário)
-- ==========================================
-- Migrar dados de tipo_usuario para tipo_usuario_id se a coluna antiga existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'tipo_usuario'
    ) THEN
        -- Migrar dados existentes
        UPDATE usuarios 
        SET tipo_usuario_id = (
            SELECT id FROM tipos_usuarios WHERE nome = usuarios.tipo_usuario
        )
        WHERE tipo_usuario IS NOT NULL AND tipo_usuario_id IS NULL;
        
        RAISE NOTICE 'Dados migrados de tipo_usuario para tipo_usuario_id';
    END IF;
END $$;

-- ==========================================
-- 5. DEFINIR VALORES PADRÃO PARA tipo_usuario_id
-- ==========================================
-- Se algum registro ainda não tem tipo_usuario_id, definir como pesquisador
UPDATE usuarios 
SET tipo_usuario_id = '5de626e7-f7b3-48fc-b110-49f0e22a611a' -- ID do pesquisador
WHERE tipo_usuario_id IS NULL;

-- ==========================================
-- 6. TORNAR tipo_usuario_id OBRIGATÓRIO
-- ==========================================
ALTER TABLE usuarios ALTER COLUMN tipo_usuario_id SET NOT NULL;

-- ==========================================
-- 7. CRIAR ÍNDICE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);

-- ==========================================
-- 8. VERIFICAR ESTRUTURA FINAL
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 9. VERIFICAR DADOS
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  t.nome as tipo_usuario,
  t.nivel_permissao,
  u.ativo
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
ORDER BY t.nivel_permissao DESC, u.nome;

-- ==========================================
-- PRONTO! Agora execute INSERIR-USUARIOS-COM-IDS.sql
-- ==========================================








