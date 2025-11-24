-- ==========================================
-- CRIAR NOVA TABELA TIPOS_USUARIOS COM ID INT
-- ==========================================

-- ==========================================
-- 1. EXCLUIR TABELA EXISTENTE (se existir)
-- ==========================================
DROP TABLE IF EXISTS tipos_usuarios CASCADE;

-- ==========================================
-- 2. CRIAR NOVA TABELA COM ID INT
-- ==========================================
CREATE TABLE tipos_usuarios (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  nivel_permissao INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. INSERIR TIPOS DE USUÁRIOS COM IDs INT
-- ==========================================
INSERT INTO tipos_usuarios (id, nome, descricao, nivel_permissao) VALUES 
  (1, 'pesquisador', 'Pesquisador - Coleta de dados', 1),
  (2, 'candidato', 'Candidato - Visualização de dados', 2),
  (3, 'suporte', 'Suporte Técnico - Acesso limitado', 3),
  (4, 'admin', 'Administrador - Gerenciamento completo', 4),
  (5, 'superadmin', 'Super Administrador - Acesso total ao sistema', 5);

-- ==========================================
-- 4. CRIAR ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_tipos_usuarios_nivel ON tipos_usuarios(nivel_permissao);
CREATE INDEX IF NOT EXISTS idx_tipos_usuarios_nome ON tipos_usuarios(nome);

-- ==========================================
-- 5. VERIFICAR TABELA CRIADA
-- ==========================================
SELECT 
  id,
  nome,
  descricao,
  nivel_permissao,
  ativo,
  criado_em
FROM tipos_usuarios
ORDER BY nivel_permissao;

-- ==========================================
-- 6. VERIFICAR ESTRUTURA
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tipos_usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- PRONTO! Agora execute INSERIR-USUARIOS-IDS-INT.sql
-- ==========================================








