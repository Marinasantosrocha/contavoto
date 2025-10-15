# 🧪 Guia: Testar Conexão com Banco de Dados

## 📋 Descrição

Este script (`testar-banco.js`) realiza uma série de testes automatizados para verificar se a conexão com o banco de dados Supabase está funcionando corretamente.

## 🚀 Como Usar

### Opção 1: Usando npm (Recomendado)

```bash
npm run test:db
```

### Opção 2: Executando diretamente

```bash
node testar-banco.js
```

## 🔍 O Que é Testado

O script executa **9 testes** diferentes:

1. ✅ **Conexão Básica** - Verifica se consegue conectar ao banco
2. ✅ **Tabela usuarios** - Testa acesso e lista usuários
3. ✅ **Tabela tipos_usuarios** - Verifica tipos de usuário cadastrados
4. ✅ **Tabela formularios** - Testa acesso aos formulários
5. ✅ **Tabela pesquisas** - Verifica pesquisas cadastradas
6. ✅ **Tabela politicas** - Testa acesso às políticas
7. ✅ **Sistema de Autenticação** - Verifica se o auth está funcionando
8. ✅ **Relacionamentos** - Testa joins entre tabelas
9. ✅ **Permissões** - Verifica permissões de leitura/escrita

## 📊 Exemplo de Saída

```
🚀 Iniciando testes de conexão...

═══════════════════════════════════════════
           TESTES DE CONEXÃO
═══════════════════════════════════════════

🔌 TESTE 1: Verificando conexão básica...
✅ Conexão com banco de dados estabelecida!

👥 TESTE 2: Testando tabela "usuarios"...
✅ Tabela "usuarios" acessível (5 registros)
ℹ️  Exemplo: João Silva (38998143436)

...

═══════════════════════════════════════════
              RESUMO DOS TESTES
═══════════════════════════════════════════
✅ Testes passados: 9
❌ Testes falhados: 0
📊 Total: 9
═══════════════════════════════════════════

🎉 Parabéns! Todos os testes passaram com sucesso!
✨ O banco de dados está configurado corretamente.
```

## ⚙️ Configuração

### Variáveis de Ambiente

O script usa as seguintes variáveis de ambiente:

- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima (pública) do Supabase

### Arquivo .env (Opcional)

Você pode criar um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

> **Nota:** Se não houver arquivo `.env`, o script usará os valores padrão configurados no código.

## 🔧 Solução de Problemas

### ❌ Erro: "Cannot find module"

Certifique-se de que as dependências estão instaladas:

```bash
npm install
```

### ❌ Erro: "Failed to connect"

1. Verifique se o URL do Supabase está correto
2. Verifique se a chave de API está correta
3. Verifique sua conexão com a internet
4. Confirme que o projeto Supabase está ativo

### ❌ Erro: "permission denied"

1. Verifique as políticas RLS (Row Level Security) no Supabase
2. Confirme que a chave anônima tem as permissões necessárias
3. Verifique se as tabelas foram criadas corretamente

## 📝 Notas Importantes

- Este script **não modifica dados** no banco
- É seguro executar quantas vezes quiser
- Pode ser usado em produção ou desenvolvimento
- Requer conexão com a internet

## 🆘 Precisa de Ajuda?

Se algum teste falhar:

1. Leia a mensagem de erro detalhada no console
2. Verifique se todas as tabelas existem no Supabase
3. Confirme que as variáveis de ambiente estão corretas
4. Consulte a documentação do Supabase em https://supabase.com/docs

---

**Última atualização:** Outubro 2025

