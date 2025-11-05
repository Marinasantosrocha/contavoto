# ⚡ React Query no PORTA A PORTA

## 🎯 O que é React Query?

**React Query** (TanStack Query) é uma poderosa biblioteca para gerenciamento de estado assíncrono. Ela gerencia automaticamente:

- 📦 **Cache** de dados
- 🔄 **Sincronização** automática
- ⚡ **Revalidação** inteligente
- 🎯 **Otimistic Updates**
- 🔌 **Estado de Loading/Error**

## 🚀 Por que usar React Query?

### Antes (sem React Query):

```typescript
// ❌ Muito código manual
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchAPI();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Depois (com React Query):

```typescript
// ✅ Simples e poderoso
const { data, isLoading, error } = useQuery({
  queryKey: ['pesquisas'],
  queryFn: () => PesquisaService.buscarPesquisas(),
});
```

## 🏗️ Arquitetura do Projeto

### 1. Configuração Global

```
src/lib/queryClient.ts
```

Configura o comportamento global do React Query:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // Cache válido por 5 min
      gcTime: 1000 * 60 * 60 * 24,     // Mantém no cache por 24h
      networkMode: 'offlineFirst',      // Prioriza offline!
    },
  },
});
```

### 2. Hooks Customizados

#### Formulários
```
src/hooks/useFormularios.ts
```

- `useFormularios()` - Lista de formulários
- `useFormulario(id)` - Um formulário específico
- `useSalvarFormulario()` - Criar formulário
- `useInicializarFormulario()` - Criar formulário modelo

#### Pesquisas
```
src/hooks/usePesquisas.ts
```

- `usePesquisas(filtro?)` - Lista de pesquisas
- `usePesquisa(id)` - Uma pesquisa específica
- `useEstatisticasPesquisas()` - Dashboard de estatísticas
- `useCriarPesquisa()` - Criar nova pesquisa
- `useSalvarResposta()` - Salvar resposta (com optimistic update!)
- `useFinalizarPesquisa()` - Finalizar pesquisa
- `useCancelarPesquisa()` - Cancelar pesquisa
- `useDeletarPesquisa()` - Deletar pesquisa

#### Sincronização
```
src/hooks/useSincronizacao.ts
```

- `useSincronizar()` - Sincroniza com Supabase
- `useLimparTudo()` - Limpar dados (debug)

### 3. Query Keys

**Query Keys** são identificadores únicos para cada query:

```typescript
// src/hooks/usePesquisas.ts
export const pesquisaKeys = {
  all: ['pesquisas'],
  lists: () => ['pesquisas', 'list'],
  list: (filtro) => ['pesquisas', 'list', filtro],
  details: () => ['pesquisas', 'detail'],
  detail: (id) => ['pesquisas', 'detail', id],
  stats: () => ['pesquisas', 'stats'],
};
```

**Benefícios**:
- Invalidação precisa de cache
- Agrupamento lógico
- TypeScript-safe

## 🎯 Funcionalidades Principais

### 1. Cache Automático

```typescript
// Primeira chamada: busca do servidor
const { data } = usePesquisas();

// Chamadas subsequentes: usa cache (super rápido!)
const { data } = usePesquisas(); // Instantâneo!
```

### 2. Revalidação Automática

```typescript
const { data } = useEstatisticasPesquisas();
// ✅ Atualiza automaticamente a cada 5 segundos!
```

### 3. Optimistic Updates

Atualiza a UI ANTES do servidor responder:

```typescript
const salvarResposta = useSalvarResposta();

// Quando você salva uma resposta:
salvarResposta.mutate({ pesquisaId, campoId, valor });

// ✨ A UI atualiza INSTANTANEAMENTE
// 📤 Em paralelo, salva no IndexedDB
// 🔄 Se falhar, reverte automaticamente
```

### 4. Estados de Loading

```typescript
const { data, isLoading, isFetching, error } = usePesquisas();

if (isLoading) return <div>Carregando primeira vez...</div>;
if (isFetching) return <div>Atualizando...</div>;
if (error) return <div>Erro: {error.message}</div>;
```

### 5. Invalidação de Cache

Quando você cria/atualiza/deleta, o cache é invalidado automaticamente:

```typescript
const criarPesquisa = useCriarPesquisa();

await criarPesquisa.mutateAsync({ ... });

// ✅ Automaticamente invalida:
// - Lista de pesquisas
// - Estatísticas
// - Pesquisas relacionadas
```

## 📊 Fluxo de Dados

```
┌─────────────────┐
│   Componente    │
│   (HomePage)    │
└────────┬────────┘
         │
         │ useEstatisticasPesquisas()
         ▼
┌─────────────────┐
│  React Query    │ ◄── Cache
│   (Hook)        │
└────────┬────────┘
         │
         │ Se não está no cache
         ▼
┌─────────────────┐
│ PesquisaService │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IndexedDB     │ ◄── Banco Local
│   (Dexie)       │
└─────────────────┘
```

## 🎨 Exemplos Práticos

### Exemplo 1: Buscar Pesquisas com Filtro

```typescript
function MinhasPesquisas() {
  const [status, setStatus] = useState('finalizada');
  
  const { data: pesquisas, isLoading } = usePesquisas({
    status: status as 'finalizada',
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      <select onChange={(e) => setStatus(e.target.value)}>
        <option value="finalizada">Finalizadas</option>
        <option value="em_andamento">Em Andamento</option>
      </select>

      {pesquisas?.map((p) => (
        <div key={p.id}>{p.nomeEntrevistado}</div>
      ))}
    </div>
  );
}
```

### Exemplo 2: Criar Pesquisa com Loading

```typescript
function CriarPesquisaForm() {
  const criarPesquisa = useCriarPesquisa();

  const handleSubmit = async () => {
    try {
      const id = await criarPesquisa.mutateAsync({
        formularioId: 1,
        entrevistador: 'João',
        endereco: 'Rua A',
        bairro: 'Centro',
        cidade: 'São Paulo',
      });
      
      console.log('Pesquisa criada com ID:', id);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={criarPesquisa.isPending}
    >
      {criarPesquisa.isPending ? 'Criando...' : 'Criar Pesquisa'}
    </button>
  );
}
```

### Exemplo 3: Estatísticas em Tempo Real

```typescript
function Dashboard() {
  // ⚡ Atualiza automaticamente a cada 5 segundos!
  const { data: stats } = useEstatisticasPesquisas();

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Total: {stats?.total || 0}</p>
      <p>Finalizadas: {stats?.finalizadas || 0}</p>
      <p>Pendentes: {stats?.emAndamento || 0}</p>
    </div>
  );
}
```

### Exemplo 4: Sincronização Manual

```typescript
function SyncButton() {
  const sincronizar = useSincronizar();

  const handleSync = async () => {
    try {
      const result = await sincronizar.mutateAsync();
      if (result.sucesso) {
        alert('✅ Sincronizado!');
      }
    } catch (error) {
      alert('❌ Erro ao sincronizar');
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={sincronizar.isPending}
    >
      {sincronizar.isPending ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
    </button>
  );
}
```

## 🔧 DevTools

O React Query vem com DevTools incríveis!

### Como Usar

Já está configurado no `App.tsx`:

```typescript
<ReactQueryDevtools initialIsOpen={false} />
```

### O que você vê:

- 📊 Todas as queries ativas
- ⏰ Tempo de cada query
- 🔄 Status (fresh, stale, fetching)
- 💾 Dados no cache
- 🎯 Invalidações

### Atalho

Pressione: `Ctrl/Cmd + Shift + D`

## 🎓 Conceitos Importantes

### 1. Stale Time

Tempo que os dados permanecem "frescos":

```typescript
staleTime: 1000 * 60 * 5, // 5 minutos
```

- Dados "fresh": React Query **não** refetch
- Dados "stale": React Query **pode** refetch

### 2. GC Time (Cache Time)

Tempo que dados ficam no cache após não serem mais usados:

```typescript
gcTime: 1000 * 60 * 60 * 24, // 24 horas
```

### 3. Network Mode

Como lidar com rede:

```typescript
networkMode: 'offlineFirst', // Prioriza cache
```

Opções:
- `online`: Só funciona online
- `offlineFirst`: Tenta cache primeiro
- `always`: Sempre tenta (mesmo offline)

### 4. Refetch On

Quando refazer a query:

```typescript
refetchOnWindowFocus: true,  // Ao focar na janela
refetchOnReconnect: true,    // Ao reconectar
refetchOnMount: true,        // Ao montar componente
```

## 🚀 Dicas de Performance

### 1. Use Query Keys Específicas

```typescript
// ❌ Ruim (invalida tudo)
queryKey: ['pesquisas']

// ✅ Bom (invalida só o necessário)
queryKey: ['pesquisas', 'list', { status: 'finalizada' }]
```

### 2. Prefetch para Navegação Rápida

```typescript
// Pré-carrega antes de navegar
const queryClient = useQueryClient();

const handleMouseEnter = (pesquisaId: number) => {
  queryClient.prefetchQuery({
    queryKey: pesquisaKeys.detail(pesquisaId),
    queryFn: () => PesquisaService.buscarPesquisaPorId(pesquisaId),
  });
};
```

### 3. Use Select para Transformar Dados

```typescript
const { data: nomes } = usePesquisas({
  select: (pesquisas) => pesquisas.map(p => p.nomeEntrevistado),
});
```

### 4. Desabilite Queries Condicionalmente

```typescript
const { data } = usePesquisa(pesquisaId, {
  enabled: pesquisaId !== null, // Só executa se tiver ID
});
```

## 🔥 Benefícios para o PORTA A PORTA

### 1. Offline-First Nativo

React Query já funciona bem offline:
- Cache local automático
- Retry automático quando volta online
- Sincronização transparente

### 2. UX Melhorada

- ⚡ UI instantânea (optimistic updates)
- 🔄 Sincronização em background
- 📊 Estados de loading claros

### 3. Menos Código

- 🚫 Sem gerenciamento manual de estado
- 🚫 Sem useEffect complexos
- 🚫 Sem lógica de loading manual

### 4. Mais Confiável

- ✅ Retry automático
- ✅ Deduplicação de requests
- ✅ Cache inteligente
- ✅ Error handling consistente

## 📚 Recursos Adicionais

- 📖 [Documentação Oficial](https://tanstack.com/query/latest)
- 🎥 [Tutorial em Vídeo](https://www.youtube.com/results?search_query=react+query+tutorial)
- 💬 [Discord da Comunidade](https://discord.com/invite/WrRKjPJ)

---

**Agora você tem um sistema de gerenciamento de estado profissional!** 🚀




