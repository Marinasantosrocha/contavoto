-- ==========================================
-- FIX TABELA USUARIOS - ContaVoto
-- ==========================================
-- Este SQL corrige a estrutura da tabela usuarios

-- ==========================================
-- 1. VERIFICAR ESTRUTURA ATUAL
-- ==========================================
-- Primeiro, vamos ver quais colunas existem
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- ==========================================
-- 2. REMOVER CONSTRAINT NOT NULL DE tipo_usuario (se existir)
-- ==========================================
ALTER TABLE usuarios ALTER COLUMN tipo_usuario DROP NOT NULL;

-- ==========================================
-- 3. CRIAR COLUNA tipo_usuario_id (se não existir)
-- ==========================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_usuario_id UUID REFERENCES tipos_usuarios(id);

-- ==========================================
-- 4. MIGRAR DADOS DE tipo_usuario PARA tipo_usuario_id
-- ==========================================
-- Se já existem registros com tipo_usuario preenchido, migrar para tipo_usuario_id
UPDATE usuarios 
SET tipo_usuario_id = (
  SELECT id FROM tipos_usuarios WHERE nome = usuarios.tipo_usuario
)
WHERE tipo_usuario IS NOT NULL AND tipo_usuario_id IS NULL;

-- ==========================================
-- 5. REMOVER COLUNA ANTIGA tipo_usuario
-- ==========================================
-- Agora podemos remover a coluna antiga
ALTER TABLE usuarios DROP COLUMN IF EXISTS tipo_usuario;

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
-- 9. ATUALIZAR FUNÇÃO handle_new_user
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

-- ==========================================
-- PRONTO! Agora execute INSERIR-USUARIOS-SIMPLES.sql
-- ==========================================








