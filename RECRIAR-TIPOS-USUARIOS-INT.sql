-- ==========================================
-- RECRIAR TABELA TIPOS_USUARIOS COM ID INT
-- ==========================================

-- ==========================================
-- 1. BACKUP DOS DADOS ATUAIS (se necessário)
-- ==========================================
-- Criar tabela temporária com os dados atuais
CREATE TEMP TABLE backup_tipos_usuarios AS
SELECT * FROM tipos_usuarios;

-- ==========================================
-- 2. REMOVER FOREIGN KEY DA TABELA USUARIOS
-- ==========================================
-- Primeiro, remover a constraint de foreign key
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_id_fkey;

-- ==========================================
-- 3. EXCLUIR TABELA TIPOS_USUARIOS
-- ==========================================
DROP TABLE IF EXISTS tipos_usuarios CASCADE;

-- ==========================================
-- 4. CRIAR NOVA TABELA COM ID INT
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
-- 5. INSERIR TIPOS DE USUÁRIOS COM IDs INT
-- ==========================================
INSERT INTO tipos_usuarios (id, nome, descricao, nivel_permissao) VALUES 
  (1, 'pesquisador', 'Pesquisador - Coleta de dados', 1),
  (2, 'candidato', 'Candidato - Visualização de dados', 2),
  (3, 'suporte', 'Suporte Técnico - Acesso limitado', 3),
  (4, 'admin', 'Administrador - Gerenciamento completo', 4),
  (5, 'superadmin', 'Super Administrador - Acesso total ao sistema', 5);

-- ==========================================
-- 6. ATUALIZAR COLUNA tipo_usuario_id NA TABELA USUARIOS
-- ==========================================
-- Converter UUID para INTEGER baseado no nome do tipo
UPDATE usuarios 
SET tipo_usuario_id = (
  CASE 
    WHEN t.nome = 'pesquisador' THEN 1
    WHEN t.nome = 'candidato' THEN 2
    WHEN t.nome = 'suporte' THEN 3
    WHEN t.nome = 'admin' THEN 4
    WHEN t.nome = 'superadmin' THEN 5
    ELSE 1 -- Padrão para pesquisador
  END
)
FROM backup_tipos_usuarios t
WHERE usuarios.tipo_usuario_id = t.id;

-- ==========================================
-- 7. ALTERAR TIPO DA COLUNA tipo_usuario_id
-- ==========================================
-- Primeiro, criar uma nova coluna temporária
ALTER TABLE usuarios ADD COLUMN tipo_usuario_id_new INTEGER;

-- Copiar dados convertidos
UPDATE usuarios 
SET tipo_usuario_id_new = (
  CASE 
    WHEN t.nome = 'pesquisador' THEN 1
    WHEN t.nome = 'candidato' THEN 2
    WHEN t.nome = 'suporte' THEN 3
    WHEN t.nome = 'admin' THEN 4
    WHEN t.nome = 'superadmin' THEN 5
    ELSE 1
  END
)
FROM backup_tipos_usuarios t
WHERE usuarios.tipo_usuario_id = t.id;

-- Remover coluna antiga e renomear nova
ALTER TABLE usuarios DROP COLUMN tipo_usuario_id;
ALTER TABLE usuarios RENAME COLUMN tipo_usuario_id_new TO tipo_usuario_id;

-- Tornar obrigatória
ALTER TABLE usuarios ALTER COLUMN tipo_usuario_id SET NOT NULL;

-- ==========================================
-- 8. RECRIAR FOREIGN KEY
-- ==========================================
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_tipo_usuario_id_fkey 
FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuarios(id);

-- ==========================================
-- 9. RECRIAR ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);
CREATE INDEX IF NOT EXISTS idx_tipos_usuarios_nivel ON tipos_usuarios(nivel_permissao);

-- ==========================================
-- 10. ATUALIZAR VIEWS (se existirem)
-- ==========================================
CREATE OR REPLACE VIEW vw_usuarios_com_tipos AS
SELECT 
  u.id,
  u.auth_id,
  u.nome,
  u.telefone,
  u.ativo,
  t.nome as tipo_usuario,
  t.descricao as tipo_descricao,
  t.nivel_permissao,
  u.criado_em,
  u.atualizado_em
FROM usuarios u
LEFT JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id;

-- ==========================================
-- 11. ATUALIZAR FUNÇÃO handle_new_user
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, telefone, tipo_usuario_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', '00000000000'),
    1 -- ID do pesquisador (padrão)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 12. VERIFICAR RESULTADO
-- ==========================================
SELECT 
  u.id,
  u.nome,
  u.telefone,
  t.id as tipo_id,
  t.nome as tipo_usuario,
  t.descricao as tipo_descricao,
  t.nivel_permissao,
  u.ativo
FROM usuarios u
JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
ORDER BY t.nivel_permissao DESC, u.nome;

-- ==========================================
-- 13. VERIFICAR ESTRUTURA DA NOVA TABELA
-- ==========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tipos_usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- LIMPEZA
-- ==========================================
DROP TABLE IF EXISTS backup_tipos_usuarios;

-- ==========================================
-- PRONTO! Agora os IDs são inteiros simples
-- ==========================================



