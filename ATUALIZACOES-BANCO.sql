-- ==========================================
-- ATUALIZAÇÕES DO BANCO - ContaVoto
-- ==========================================

-- 1. CRIAR TABELA DE TIPOS DE USUÁRIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS tipos_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  nivel_permissao INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tipos de usuários
INSERT INTO tipos_usuarios (nome, descricao, nivel_permissao) VALUES 
  ('superadmin', 'Super Administrador - Acesso total ao sistema', 5),
  ('admin', 'Administrador - Gerenciamento completo', 4),
  ('suporte', 'Suporte Técnico - Acesso limitado', 3),
  ('candidato', 'Candidato - Visualização de dados', 2),
  ('pesquisador', 'Pesquisador - Coleta de dados', 1)
ON CONFLICT (nome) DO NOTHING;

-- 2. ALTERAR TABELA USUARIOS PARA USAR TELEFONE
-- ==========================================
-- Adicionar coluna telefone
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT UNIQUE;

-- Adicionar coluna tipo_usuario_id
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario_id UUID REFERENCES tipos_usuarios(id);

-- Remover coluna email (se existir)
-- ALTER TABLE usuarios DROP COLUMN IF EXISTS email;

-- Atualizar constraint para incluir telefone
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_telefone_key UNIQUE (telefone);

-- 3. CRIAR USUÁRIOS INICIAIS
-- ==========================================

-- Super Admin
INSERT INTO usuarios (auth_id, nome, telefone, tipo_usuario_id, ativo) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Super Administrador ContaVoto',
  '11999999999',
  (SELECT id FROM tipos_usuarios WHERE nome = 'superadmin'),
  true
) ON CONFLICT (telefone) DO NOTHING;

-- Pesquisador
INSERT INTO usuarios (auth_id, nome, telefone, tipo_usuario_id, ativo) VALUES (
  NULL, -- Será preenchido após criar no Auth
  'Pesquisador ContaVoto',
  '11888888888',
  (SELECT id FROM tipos_usuarios WHERE nome = 'pesquisador'),
  true
) ON CONFLICT (telefone) DO NOTHING;

-- 4. ATUALIZAR POLÍTICAS RLS
-- ==========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Admins podem ver todos usuários" ON usuarios;

-- Nova política: Usuários podem ver próprios dados por telefone
CREATE POLICY "Usuários podem ver próprios dados" ON usuarios
  FOR SELECT USING (
    telefone = (SELECT telefone FROM usuarios WHERE auth_id = auth.uid())
  );

-- Nova política: Admins e SuperAdmins podem ver todos
CREATE POLICY "Admins podem ver todos usuários" ON usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      JOIN tipos_usuarios t ON u.tipo_usuario_id = t.id
      WHERE u.auth_id = auth.uid() 
      AND t.nivel_permissao >= 4
    )
  );

-- 5. ATUALIZAR FUNÇÃO DE CRIAÇÃO DE USUÁRIO
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, telefone, tipo_usuario_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', '00000000000'),
    (SELECT id FROM tipos_usuarios WHERE nome = 'pesquisador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR VIEWS ÚTEIS
-- ==========================================

-- View para usuários com tipos
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

-- 7. ÍNDICES PARA PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_usuario_id ON usuarios(tipo_usuario_id);
CREATE INDEX IF NOT EXISTS idx_tipos_usuarios_nivel ON tipos_usuarios(nivel_permissao);

-- ==========================================
-- COMANDOS PARA CRIAR USUÁRIOS NO AUTH
-- ==========================================
-- Execute estes comandos APÓS executar o SQL acima:

/*
-- 1. Criar Super Admin no Auth Dashboard:
-- Email: superadmin@contavoto.com
-- Senha: superadmin123
-- Telefone: 11999999999

-- 2. Criar Pesquisador no Auth Dashboard:
-- Email: pesquisador@contavoto.com  
-- Senha: pesquisador123
-- Telefone: 11888888888

-- 3. Atualizar auth_id dos usuários:
UPDATE usuarios SET auth_id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@contavoto.com'
) WHERE telefone = '11999999999';

UPDATE usuarios SET auth_id = (
  SELECT id FROM auth.users WHERE email = 'pesquisador@contavoto.com'
) WHERE telefone = '11888888888';
*/



