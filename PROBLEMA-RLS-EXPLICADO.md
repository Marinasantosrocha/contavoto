# 🔒 Problema: RLS está Bloqueando o Acesso aos Dados

## 🎯 O Que Está Acontecendo?

Você tem usuários cadastrados no banco, mas o script de teste mostra **0 registros**. Isso acontece por causa do **RLS (Row Level Security)** do Supabase.

### Como Funciona:

```
┌─────────────────────────────────────────────┐
│  Você no SQL Editor                         │
│  ✅ Acesso TOTAL (admin)                    │
│  ✅ Vê todos os dados                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Script usando ANON_KEY                     │
│  ❌ Acesso LIMITADO (anônimo)               │
│  ❌ RLS bloqueia a leitura                  │
└─────────────────────────────────────────────┘
```

## 🔍 Verificar o Problema

Execute o script de teste:

```bash
npm run test:db
```

Se você vê:
```
✅ Tabela "usuarios" acessível (0 registros)
⚠️  Possíveis causas:
   2. RLS (Row Level Security) está bloqueando o acesso
```

Então o RLS está bloqueando! 🔒

## ✅ Soluções

### Opção 1: Desabilitar RLS (Recomendado para Desenvolvimento)

1. Abra o **SQL Editor** no Supabase Dashboard
2. Execute o arquivo: `DESABILITAR-RLS-TEMPORARIO.sql`

```sql
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE formularios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisas DISABLE ROW LEVEL SECURITY;
```

3. Execute o teste novamente:
```bash
npm run test:db
```

Agora deve mostrar:
```
✅ Tabela "usuarios" acessível (1 registros)
ℹ️  Exemplo: Super Administrador ContaVoto (38998143436)
```

### Opção 2: Configurar Políticas RLS (Recomendado para Produção)

1. Execute o arquivo: `VERIFICAR-POLITICAS-RLS.sql`
2. Isso criará políticas que permitem:
   - Leitura pública de tipos de usuários
   - Leitura pública de usuários (para login)
   - Leitura pública de formulários
   - Leitura de pesquisas do próprio usuário

## 🔐 Entendendo o RLS

### O Que é RLS?

**Row Level Security** é um sistema de segurança do PostgreSQL/Supabase que controla quem pode ver/modificar cada linha de uma tabela.

### Exemplo Prático:

```sql
-- Com RLS habilitado:
SELECT * FROM usuarios;
-- Resultado: 0 linhas (bloqueado pela política)

-- Com RLS desabilitado:
SELECT * FROM usuarios;
-- Resultado: Todas as linhas visíveis
```

## 📊 Verificar Status Atual do RLS

Execute este SQL no Supabase:

```sql
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ATIVO'
    ELSE '🔓 RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'tipos_usuarios', 'formularios', 'pesquisas')
ORDER BY tablename;
```

## ⚖️ Qual Opção Escolher?

| Situação | Recomendação |
|----------|-------------|
| 🔧 **Desenvolvimento Local** | Desabilite RLS |
| 🧪 **Testes** | Desabilite RLS |
| 🚀 **Produção** | Configure Políticas RLS |
| 👥 **Múltiplos Usuários** | Configure Políticas RLS |
| 🔓 **App Público (demo)** | Desabilite RLS |

## 🚨 Avisos Importantes

### ⚠️ Segurança

```
❌ NUNCA desabilite RLS em produção sem entender as consequências!

Com RLS desabilitado:
- Qualquer pessoa pode ler todos os dados
- Qualquer pessoa pode modificar todos os dados
- Não há controle de acesso
```

### ✅ Boas Práticas

1. **Desenvolvimento**: Desabilite RLS para facilitar
2. **Antes de produção**: Configure políticas adequadas
3. **Em produção**: SEMPRE tenha RLS com políticas corretas
4. **Nunca**: Exponha senhas em políticas públicas

## 🎓 Exemplo de Política Segura

```sql
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Usuários veem apenas seus dados"
ON usuarios FOR SELECT
TO authenticated
USING (auth.uid() = auth_id);

-- Apenas admins podem ver todos os usuários
CREATE POLICY "Admins veem todos os usuários"
ON usuarios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND tipo_usuario_id >= 4  -- admin ou superadmin
  )
);
```

## 🔄 Testar Novamente

Após executar qualquer solução, teste:

```bash
npm run test:db
```

Você deve ver os dados agora! 🎉

## 📚 Mais Informações

- [Documentação RLS do Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Exemplos de Políticas](https://supabase.com/docs/guides/auth/row-level-security#examples)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Resumo Rápido**: 
- Problema: RLS está bloqueando acesso anônimo
- Solução rápida: Execute `DESABILITAR-RLS-TEMPORARIO.sql`
- Solução produção: Configure políticas no `VERIFICAR-POLITICAS-RLS.sql`

