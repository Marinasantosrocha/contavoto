# 🗳️ ContaVoto - Setup de Usuários no Supabase

## 📋 **Passos para Configurar Usuários Iniciais**

### 1. **Executar o Schema SQL**
Execute o arquivo `supabase-schema.sql` no SQL Editor do Supabase.

### 2. **Criar Usuários no Auth**
No Dashboard do Supabase → Authentication → Users:

#### **👑 Usuário Admin:**
- **Email:** `admin@contavoto.com`
- **Senha:** `admin123`
- **Tipo:** Admin

#### **👤 Usuário Pesquisador:**
- **Email:** `pesquisador@contavoto.com`
- **Senha:** `pesquisador123`
- **Tipo:** Pesquisador

### 3. **Configurar Usuários na Tabela**
Após criar os usuários no Auth, execute este SQL:

```sql
-- Inserir usuário Admin
INSERT INTO usuarios (auth_id, nome, email, tipo_usuario, ativo) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@contavoto.com'),
  'Administrador ContaVoto',
  'admin@contavoto.com',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Inserir usuário Pesquisador
INSERT INTO usuarios (auth_id, nome, email, tipo_usuario, ativo) VALUES (
  (SELECT id FROM auth.users WHERE email = 'pesquisador@contavoto.com'),
  'Pesquisador ContaVoto',
  'pesquisador@contavoto.com',
  'pesquisador',
  true
) ON CONFLICT (email) DO NOTHING;
```

### 4. **Configurar Variáveis de Ambiente**
No arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 5. **Testar Login**
- **Admin:** `admin@contavoto.com` / `admin123`
- **Pesquisador:** `pesquisador@contavoto.com` / `pesquisador123`

## 🔐 **Recursos de Autenticação Implementados**

### ✅ **Funcionalidades:**
- Login/Logout com Supabase Auth
- Registro automático de novos usuários
- Tipos de usuário (Admin/Pesquisador)
- Controle de permissões por formulário
- Row Level Security (RLS)

### ✅ **Políticas de Segurança:**
- Usuários veem apenas seus dados
- Admins podem gerenciar todos os usuários
- Formulários protegidos por permissão
- Dados sincronizados automaticamente

## 🚀 **Próximos Passos**

1. Execute o schema SQL
2. Crie os usuários no Auth
3. Configure as variáveis de ambiente
4. Teste o login no aplicativo

**Pronto! Seu sistema ContaVoto estará funcionando com autenticação completa!** 🎉








