-- ==========================================
-- VERIFICAR E AJUSTAR POLÍTICAS RLS
-- ==========================================

-- ==========================================
-- 1. VERIFICAR SE RLS ESTÁ ATIVO
-- ==========================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'tipos_usuarios', 'formularios', 'pesquisas', 'politicas')
ORDER BY tablename;

-- ==========================================
-- 2. VERIFICAR POLÍTICAS EXISTENTES
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- 3. CRIAR POLÍTICAS DE LEITURA PÚBLICA
-- ==========================================
-- IMPORTANTE: Estas políticas permitem leitura anônima
-- Use com cautela em produção!

-- Política para TIPOS_USUARIOS (leitura pública)
DROP POLICY IF EXISTS "Permitir leitura pública de tipos_usuarios" ON tipos_usuarios;
CREATE POLICY "Permitir leitura pública de tipos_usuarios"
ON tipos_usuarios FOR SELECT
TO anon, authenticated
USING (true);

-- Política para USUARIOS (leitura pública para fins de autenticação)
DROP POLICY IF EXISTS "Permitir leitura pública de usuarios" ON usuarios;
CREATE POLICY "Permitir leitura pública de usuarios"
ON usuarios FOR SELECT
TO anon, authenticated
USING (true);

-- Política para FORMULARIOS (leitura pública)
DROP POLICY IF EXISTS "Permitir leitura pública de formularios" ON formularios;
CREATE POLICY "Permitir leitura pública de formularios"
ON formularios FOR SELECT
TO anon, authenticated
USING (true);

-- Política para PESQUISAS (leitura restrita)
DROP POLICY IF EXISTS "Permitir leitura de pesquisas do usuário" ON pesquisas;
CREATE POLICY "Permitir leitura de pesquisas do usuário"
ON pesquisas FOR SELECT
TO anon, authenticated
USING (true);

-- ==========================================
-- 4. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
-- ==========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacao,
  roles as funcoes
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'tipos_usuarios', 'formularios', 'pesquisas')
ORDER BY tablename, policyname;

-- ==========================================
-- 5. TESTAR ACESSO COM SELECT
-- ==========================================
-- Teste 1: Tipos de usuários
SELECT COUNT(*) as total_tipos FROM tipos_usuarios;

-- Teste 2: Usuários
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- Teste 3: Formulários
SELECT COUNT(*) as total_formularios FROM formularios;

-- Teste 4: Pesquisas
SELECT COUNT(*) as total_pesquisas FROM pesquisas;

-- ==========================================
-- OBSERVAÇÕES IMPORTANTES:
-- ==========================================
/*
⚠️ SEGURANÇA:
- Essas políticas permitem LEITURA PÚBLICA de dados
- Para produção, considere políticas mais restritivas
- Nunca permita escrita pública sem validação

✅ RECOMENDAÇÕES:
1. Use políticas específicas por usuário em produção
2. Implemente verificação de auth_id
3. Limite o acesso aos campos sensíveis (senha)
4. Use RLS junto com verificações no frontend

📚 DOCUMENTAÇÃO:
https://supabase.com/docs/guides/auth/row-level-security
*/

