# 🚀 Guia Rápido - PORTA A PORTA

## ⚡ Início Rápido em 3 Passos

### Passo 1: Instalar Dependências

```bash
npm install
```

## Passo 2: Configurar Supabase

### 2.1 Criar Projeto no Supabase
1. Acesse https://supabase.com
2. Crie uma conta (gratuita)
3. Crie um novo projeto
4. Aguarde a configuração (leva ~2 minutos)

### 2.2 Executar SQL
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** (executar)

### 2.3 Pegar Credenciais
1. Vá em **Settings** > **API**
2. Copie:
   - **Project URL** (URL)
   - **anon public** key (chave pública)

### 2.4 Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Passo 3: Executar o App

```bash
npm run dev
```

Acesse http://localhost:5173

## 📱 Como Usar o App

### Fluxo Completo de Uma Pesquisa

1. **Tela Inicial**
   - Digite seu nome (entrevistador)
   - Selecione o formulário "Pesquisa Porta a Porta"
   - Preencha: Endereço, Bairro e Cidade
   - Clique em "🚀 Iniciar Pesquisa"

2. **Abordagem**
   - Leia o script de abordagem inicial
   - Toque a campainha e apresente-se

3. **Coleta de Dados**
   - Responda as perguntas uma por vez
   - Use os botões "Anterior" e "Próximo"
   - Campos obrigatórios têm asterisco (*)
   - Perguntas condicionais aparecem automaticamente

4. **Finalização**
   - Após última pergunta, veja o script de encerramento
   - Leia o agradecimento ao entrevistado
   - Clique em "🏁 Finalizar e Voltar"

5. **Sincronização**
   - Dados são salvos automaticamente (mesmo offline)
   - Quando voltar online, sincroniza automaticamente
   - Ou clique em "🔄 Sincronizar Dados"

## 🧪 Como Testar o Modo Offline

1. Abra o app no navegador
2. Inicie uma pesquisa normalmente
3. Responda algumas perguntas
4. Abra o DevTools (pressione **F12**)
5. Vá na aba **Network** (Rede)
6. Marque a opção **Offline**
7. Continue respondendo perguntas - **vai funcionar!**
8. Finalize a pesquisa
9. Veja que ficou marcada como "⚠️ Não sincronizado"
10. Desmarque **Offline**
11. Clique em "🔄 Sincronizar Dados"
12. A pesquisa será enviada para o Supabase! ✅

## 📱 Como Funciona na Prática

### Salvamento Offline
```typescript
// Salva localmente primeiro (IndexedDB)
await SyncService.salvarLocal({
  nome: "Meu item",
  descricao: "Descrição",
  criadoEm: new Date()
});

// Se estiver online, sincroniza automaticamente!
```

### Sincronização Automática
O app detecta automaticamente quando você volta online e sincroniza:

```typescript
useEffect(() => {
  if (isOnline) {
    handleSync(); // Sincroniza automaticamente!
  }
}, [isOnline]);
```

## 🎨 Fluxo Visual

```
┌──────────────────┐
│   Usuário        │
│   Salva Dados    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   IndexedDB      │  ◄── Salva SEMPRE localmente primeiro
│   (Local)        │      (funciona offline!)
└────────┬─────────┘
         │
         │  Online?
         ├─────────── SIM ───┐
         │                   │
         │                   ▼
         │           ┌──────────────┐
         │           │  Supabase    │
         │           │  (Cloud)     │
         │           └──────────────┘
         │
         └─────────── NÃO ───┐
                              │
                              ▼
                     ┌────────────────┐
                     │ Fica pendente  │
                     │ até ter rede   │
                     └────────────────┘
```

## 🔧 Arquitetura do Código

### 1. **localDB.ts** - Banco Local
Define a estrutura do banco IndexedDB usando Dexie:
- Armazena dados offline
- Marca status de sincronização
- Rápido e confiável

### 2. **syncService.ts** - Lógica de Sincronização
O "cérebro" do sistema:
- `salvarLocal()` - Salva dados localmente
- `sincronizar()` - Envia para Supabase
- `buscarTodos()` - Busca dados locais
- Previne duplicatas usando UUID

### 3. **useOnlineStatus.ts** - Detector de Conexão
Hook React que monitora:
- Evento `online` - quando conecta
- Evento `offline` - quando desconecta
- Atualiza UI automaticamente

### 4. **App.tsx** - Interface
Componente principal:
- Formulário para adicionar dados
- Lista reativa (atualiza automaticamente)
- Indicador de status online/offline
- Botões de ação

## 💡 Dicas Importantes

### ✅ Boas Práticas
- Sempre salve localmente primeiro
- Sincronize em background
- Mostre feedback visual ao usuário
- Nunca bloqueie a UI esperando rede

### ⚠️ Avisos
- IndexedDB tem limite de ~50MB por domínio
- Não funciona em modo privado de alguns navegadores
- Dados locais podem ser limpos pelo usuário

### 🔒 Segurança
Para produção, configure RLS (Row Level Security) no Supabase:

```sql
-- Apenas usuários autenticados
CREATE POLICY "authenticated_users" ON dados
  FOR ALL
  USING (auth.uid() IS NOT NULL);
```

## 📊 Monitoramento

### Ver Dados no IndexedDB
1. Abra DevTools (F12)
2. Aba **Application** (ou Aplicação)
3. Sidebar: **Storage** > **IndexedDB**
4. Expanda **AppOfflineDB**
5. Clique em **dados**

### Ver Dados no Supabase
1. Painel Supabase
2. **Table Editor**
3. Selecione tabela **dados**

## 🐛 Problemas Comuns

### "Failed to fetch"
**Causa**: Credenciais do Supabase incorretas  
**Solução**: Verifique arquivo `.env`

### Dados não sincronizam
**Causa**: Política RLS muito restritiva  
**Solução**: Use a política permissiva do `supabase-schema.sql`

### "Cannot read property of undefined"
**Causa**: Dexie não inicializou  
**Solução**: Recarregue a página

## 🚀 Próximos Passos

1. **Adicionar Autenticação**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'senha123'
   });
   ```

2. **Criar PWA (Progressive Web App)**
   - Adicione Service Worker
   - Crie `manifest.json`
   - Funciona como app nativo!

3. **Melhorar Sincronização**
   - Queue de requisições
   - Retry automático
   - Resolução de conflitos

4. **Adicionar Mais Tabelas**
   - Crie novas tables no Supabase
   - Adicione ao `localDB.ts`
   - Implemente sync específico

## 📚 Recursos Adicionais

- 📖 [Documentação Dexie](https://dexie.org/)
- 📖 [Documentação Supabase](https://supabase.com/docs)
- 🎥 [Tutorial IndexedDB](https://www.youtube.com/results?search_query=indexeddb+tutorial)
- 💬 [Comunidade Supabase](https://github.com/supabase/supabase/discussions)

---

## 🎉 Pronto!

Agora você tem um app **offline-first** profissional que:
- ✅ Funciona sem internet
- ✅ Sincroniza automaticamente
- ✅ Nunca perde dados
- ✅ É rápido e responsivo

**Bom desenvolvimento!** 🚀

