-- ==========================================
-- CONTAVOTO - Schema SQL para Supabase
-- ==========================================
-- Execute este SQL no Supabase SQL Editor
-- https://app.supabase.com/project/_/sql

-- ==========================================
-- EXTENSÕES NECESSÁRIAS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA: usuarios (para autenticação)
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('admin', 'pesquisador')),
  ativo BOOLEAN DEFAULT true,
  formularios_permitidos UUID[] DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS RLS PARA USUARIOS
-- ==========================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver próprios dados" ON usuarios
  FOR SELECT USING (auth.uid() = auth_id);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins podem ver todos usuários" ON usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE auth_id = auth.uid() 
      AND tipo_usuario = 'admin'
    )
  );

-- ==========================================
-- FUNÇÃO PARA CRIAR USUÁRIO APÓS REGISTRO
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_id, nome, email, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'pesquisador' -- Padrão para novos usuários
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER PARA CRIAR USUÁRIO AUTOMATICAMENTE
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- TABELA: formularios
-- ==========================================
CREATE TABLE IF NOT EXISTS formularios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  pre_candidato TEXT NOT NULL,
  telefone_contato TEXT NOT NULL,
  campos JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TABELA: pesquisas
-- ==========================================
CREATE TABLE IF NOT EXISTS pesquisas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID REFERENCES formularios(id) ON DELETE SET NULL,
  formulario_nome TEXT NOT NULL,
  
  -- Dados de localização
  endereco TEXT NOT NULL,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  numero_residencia TEXT,
  ponto_referencia TEXT,
  
  -- Dados do entrevistado
  nome_entrevistado TEXT,
  telefone_entrevistado TEXT,
  
  -- Respostas (armazenadas como JSON)
  respostas JSONB DEFAULT '{}'::jsonb,
  
  -- Metadados
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  entrevistador TEXT NOT NULL,
  iniciada_em TIMESTAMPTZ NOT NULL,
  finalizada_em TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('em_andamento', 'finalizada', 'cancelada')),
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Habilitar RLS nas tabelas
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisas ENABLE ROW LEVEL SECURITY;

-- Políticas para DESENVOLVIMENTO (permite tudo)
-- ⚠️ EM PRODUÇÃO, ajuste conforme suas necessidades de segurança!

CREATE POLICY "Allow all operations on formularios (dev)" ON formularios
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on pesquisas (dev)" ON pesquisas
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- POLÍTICAS PARA PRODUÇÃO (comentadas)
-- ==========================================
-- Descomente e ajuste estas políticas quando for para produção:

/*
-- Apenas usuários autenticados podem ler formulários
CREATE POLICY "Authenticated users can read formularios" ON formularios
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas administradores podem criar/editar formulários
CREATE POLICY "Admins can manage formularios" ON formularios
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Usuários podem criar suas próprias pesquisas
CREATE POLICY "Users can create pesquisas" ON pesquisas
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Usuários podem ver apenas suas próprias pesquisas
CREATE POLICY "Users can view their own pesquisas" ON pesquisas
  FOR SELECT
  USING (entrevistador = (auth.jwt() ->> 'email'));

-- Usuários podem atualizar apenas suas próprias pesquisas
CREATE POLICY "Users can update their own pesquisas" ON pesquisas
  FOR UPDATE
  USING (entrevistador = (auth.jwt() ->> 'email'))
  WITH CHECK (entrevistador = (auth.jwt() ->> 'email'));

-- Usuários podem deletar apenas suas próprias pesquisas
CREATE POLICY "Users can delete their own pesquisas" ON pesquisas
  FOR DELETE
  USING (entrevistador = (auth.jwt() ->> 'email'));
*/

-- ==========================================
-- FUNÇÕES E TRIGGERS
-- ==========================================

-- Função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para formularios
CREATE TRIGGER update_formularios_updated_at
  BEFORE UPDATE ON formularios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pesquisas
CREATE TRIGGER update_pesquisas_updated_at
  BEFORE UPDATE ON pesquisas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ==========================================

-- Índices para formularios
CREATE INDEX IF NOT EXISTS idx_formularios_criado_em ON formularios(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_formularios_nome ON formularios(nome);

-- Índices para pesquisas
CREATE INDEX IF NOT EXISTS idx_pesquisas_formulario_id ON pesquisas(formulario_id);
CREATE INDEX IF NOT EXISTS idx_pesquisas_status ON pesquisas(status);
CREATE INDEX IF NOT EXISTS idx_pesquisas_entrevistador ON pesquisas(entrevistador);
CREATE INDEX IF NOT EXISTS idx_pesquisas_iniciada_em ON pesquisas(iniciada_em DESC);
CREATE INDEX IF NOT EXISTS idx_pesquisas_bairro ON pesquisas(bairro);
CREATE INDEX IF NOT EXISTS idx_pesquisas_cidade ON pesquisas(cidade);

-- Índice GIN para busca em JSONB (respostas)
CREATE INDEX IF NOT EXISTS idx_pesquisas_respostas ON pesquisas USING GIN (respostas);

-- ==========================================
-- VIEWS ÚTEIS
-- ==========================================

-- View para estatísticas gerais
CREATE OR REPLACE VIEW vw_estatisticas_gerais AS
SELECT
  COUNT(*) AS total_pesquisas,
  COUNT(*) FILTER (WHERE status = 'finalizada') AS pesquisas_finalizadas,
  COUNT(*) FILTER (WHERE status = 'em_andamento') AS pesquisas_em_andamento,
  COUNT(*) FILTER (WHERE status = 'cancelada') AS pesquisas_canceladas,
  COUNT(DISTINCT entrevistador) AS total_entrevistadores,
  COUNT(DISTINCT bairro) AS total_bairros
FROM pesquisas;

-- View para pesquisas por entrevistador
CREATE OR REPLACE VIEW vw_pesquisas_por_entrevistador AS
SELECT
  entrevistador,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'finalizada') AS finalizadas,
  COUNT(*) FILTER (WHERE status = 'em_andamento') AS em_andamento,
  MAX(iniciada_em) AS ultima_pesquisa
FROM pesquisas
GROUP BY entrevistador
ORDER BY total DESC;

-- View para pesquisas por bairro
CREATE OR REPLACE VIEW vw_pesquisas_por_bairro AS
SELECT
  bairro,
  cidade,
  COUNT(*) AS total_pesquisas,
  COUNT(*) FILTER (WHERE status = 'finalizada') AS finalizadas
FROM pesquisas
GROUP BY bairro, cidade
ORDER BY total_pesquisas DESC;

-- ==========================================
-- DADOS INICIAIS (OPCIONAL)
-- ==========================================
-- Você pode descomentar para inserir dados de exemplo

/*
INSERT INTO formularios (nome, descricao, pre_candidato, telefone_contato, campos) VALUES
(
  'Pesquisa Porta a Porta - Modelo Padrão',
  'Formulário completo de pesquisa porta a porta',
  '[NOME DO CANDIDATO]',
  '[XX XXXXX-XXXX]',
  '[]'::jsonb
);
*/

-- ==========================================
-- CONCLUSÃO
-- ==========================================
-- Schema criado com sucesso!
-- 
-- Próximos passos:
-- 1. Copie a URL e chave anon do projeto Supabase
-- 2. Configure no arquivo .env do app
-- 3. O app está pronto para sincronizar!

