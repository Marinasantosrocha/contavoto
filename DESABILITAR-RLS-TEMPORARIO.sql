-- ==========================================
-- DESABILITAR RLS TEMPORARIAMENTE (DESENVOLVIMENTO)
-- ==========================================

-- ⚠️ ATENÇÃO: Use isso apenas para TESTES e DESENVOLVIMENTO
-- NÃO use em produção sem políticas adequadas!

-- ==========================================
-- DESABILITAR RLS NAS TABELAS
-- ==========================================

-- Tabela tipos_usuarios
ALTER TABLE tipos_usuarios DISABLE ROW LEVEL SECURITY;

-- Tabela usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Tabela formularios
ALTER TABLE formularios DISABLE ROW LEVEL SECURITY;

-- Tabela pesquisas
ALTER TABLE pesquisas DISABLE ROW LEVEL SECURITY;

-- Tabela respostas (se existir)
ALTER TABLE IF EXISTS respostas DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- VERIFICAR STATUS DO RLS
-- ==========================================
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVO'
    ELSE '🔓 RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'tipos_usuarios', 'formularios', 'pesquisas', 'respostas')
ORDER BY tablename;

-- ==========================================
-- TESTAR ACESSO
-- ==========================================
SELECT 
  'usuarios' as tabela,
  COUNT(*) as total_registros
FROM usuarios
UNION ALL
SELECT 
  'tipos_usuarios' as tabela,
  COUNT(*) as total_registros
FROM tipos_usuarios
UNION ALL
SELECT 
  'formularios' as tabela,
  COUNT(*) as total_registros
FROM formularios
UNION ALL
SELECT 
  'pesquisas' as tabela,
  COUNT(*) as total_registros
FROM pesquisas
ORDER BY tabela;

-- ==========================================
-- PARA REABILITAR RLS (QUANDO QUISER)
-- ==========================================
/*
ALTER TABLE tipos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
*/

-- ==========================================
-- OBSERVAÇÕES:
-- ==========================================
/*
⚠️ IMPORTANTE:
- Com RLS desabilitado, QUALQUER PESSOA pode ler/escrever dados
- Isso é útil para desenvolvimento e testes
- NUNCA use em produção sem políticas adequadas

📝 PRÓXIMOS PASSOS:
1. Teste seu aplicativo
2. Identifique quais permissões você precisa
3. Crie políticas RLS específicas
4. Reabilite o RLS com as políticas corretas

💡 DICA:
Quando terminar de testar, execute as políticas do arquivo:
VERIFICAR-POLITICAS-RLS.sql
*/

