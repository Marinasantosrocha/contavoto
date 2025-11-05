# 🗳️ ContaVoto - Executar Atualizações do Banco

## 📋 **Passos para Atualizar o Sistema**

### 1. **Executar SQL de Atualizações**
Execute o arquivo `ATUALIZACOES-BANCO.sql` no SQL Editor do Supabase.

### 2. **Criar Usuários no Auth Dashboard**
No Dashboard do Supabase → Authentication → Users:

#### **👑 Super Admin:**
- **Email:** `superadmin@contavoto.com`
- **Senha:** `superadmin123`
- **Telefone:** `11999999999`

#### **👤 Pesquisador:**
- **Email:** `pesquisador@contavoto.com`
- **Senha:** `pesquisador123`
- **Telefone:** `11888888888`

### 3. **Vincular Usuários Auth com Tabela**
Execute este SQL após criar os usuários no Auth:

```sql
-- Vincular Super Admin
UPDATE usuarios SET auth_id = (
  SELECT id FROM auth.users WHERE email = 'superadmin@contavoto.com'
) WHERE telefone = '11999999999';

-- Vincular Pesquisador
UPDATE usuarios SET auth_id = (
  SELECT id FROM auth.users WHERE email = 'pesquisador@contavoto.com'
) WHERE telefone = '11888888888';
```

### 4. **Testar Login**
- **Super Admin:** `11999999999` / `superadmin123`
- **Pesquisador:** `11888888888` / `pesquisador123`

## 🎯 **Novas Funcionalidades**

### ✅ **Tipos de Usuário:**
1. **Super Admin** (nível 5) - Acesso total
2. **Admin** (nível 4) - Gerenciamento completo
3. **Suporte** (nível 3) - Acesso limitado
4. **Candidato** (nível 2) - Visualização de dados
5. **Pesquisador** (nível 1) - Coleta de dados

### ✅ **Login por Telefone:**
- Campo alterado de email para telefone
- Validação por telefone brasileiro
- Interface atualizada

### ✅ **Estrutura do Banco:**
- Tabela `tipos_usuarios` criada
- View `vw_usuarios_com_tipos` para consultas
- Políticas RLS atualizadas
- Índices para performance

## 🚀 **Próximos Passos**

1. Execute o SQL de atualizações
2. Crie os usuários no Auth
3. Vincule os usuários
4. Teste o login por telefone

**Sistema atualizado com sucesso!** 🎉



