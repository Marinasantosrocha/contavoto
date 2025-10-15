# 🚪 PORTA A PORTA

Sistema completo de **pesquisa de campo porta a porta** com sincronização offline para Supabase.

## 🎯 Sobre o Projeto

O **PORTA A PORTA** é um aplicativo desenvolvido para equipes de pesquisa de campo que precisam coletar dados indo de casa em casa. O sistema foi projetado para funcionar **100% offline**, permitindo que pesquisadores trabalhem em áreas sem conexão à internet e sincronizem automaticamente quando a conexão estiver disponível.

### Para que serve?

- 📋 Pesquisas políticas porta a porta
- 🏘️ Levantamento de necessidades de bairros
- 📊 Coleta de dados sobre serviços públicos
- 🗳️ Mapeamento de demandas da população

## 🎯 Funcionalidades Principais

- ✅ **100% Offline** - Funciona sem internet, ideal para áreas sem cobertura
- 🔄 **Sincronização Automática** - Dados sincronizam automaticamente quando online
- 📋 **Formulários Personalizáveis** - Crie e edite formulários de pesquisa
- 🎯 **Fluxo Guiado** - Interface passo a passo para facilitar a coleta
- 📍 **Geolocalização** - Captura automática de coordenadas GPS
- 📊 **Estatísticas em Tempo Real** - Acompanhe o progresso da equipe
- 💾 **Nunca Perde Dados** - Tudo é salvo localmente primeiro
- 📱 **Responsivo** - Funciona em celular, tablet e desktop
- 🎨 **Interface Moderna** - Design intuitivo e fácil de usar
- 📈 **Dashboard Completo** - Visualize todas as pesquisas realizadas

## 🏗️ Arquitetura

### Como Funciona

```
┌─────────────┐
│ Entrevistador│
│  (Offline)  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ 1. Preenche      │
│    Formulário    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. Salva no      │ ◄── Funciona OFFLINE
│    IndexedDB     │     (Banco Local)
└────────┬─────────┘
         │
         │  📶 Conexão?
         │
    ┌────┴────┐
    │         │
   SIM       NÃO
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Sync   │ │ Espera │
│ Cloud  │ │ Online │
└────────┘ └────────┘
```

### Fluxo de Trabalho

1. **Início**: Entrevistador seleciona formulário e preenche dados de localização
2. **Abordagem**: Sistema mostra script de abordagem inicial
3. **Coleta**: Perguntas aparecem uma por vez, com validação
4. **Condicionais**: Perguntas aparecem/desaparecem baseado em respostas anteriores
5. **Encerramento**: Script final de agradecimento
6. **Sincronização**: Dados são enviados ao Supabase quando houver conexão

### Estrutura de Pastas

```
src/
├── db/
│   └── localDB.ts              # Dexie (IndexedDB) - Banco Local
├── services/
│   ├── supabaseClient.ts       # Cliente Supabase
│   └── pesquisaService.ts      # Lógica de pesquisas e sincronização
├── hooks/
│   └── useOnlineStatus.ts      # Detector de conexão online/offline
├── pages/
│   ├── HomePage.tsx            # Tela inicial - escolha de formulário
│   ├── PesquisaPage.tsx        # Tela de pesquisa - passo a passo
│   └── ListaPesquisasPage.tsx  # Lista de pesquisas realizadas
├── components/
│   └── FormularioStep.tsx      # Componente de campo dinâmico
├── data/
│   └── formularioModelo.ts     # Formulário modelo pré-configurado
├── App.tsx                     # Componente principal (roteamento)
├── App.css                     # Estilos completos
└── main.tsx                    # Entry point
```

## 📦 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 3. Criar tabela no Supabase

Execute este SQL no Supabase:

```sql
CREATE TABLE dados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE dados ENABLE ROW LEVEL SECURITY;

-- Política para permitir tudo (ajuste conforme necessário)
CREATE POLICY "Allow all operations" ON dados
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 4. Executar

```bash
npm run dev
```

## 🧪 Como Testar Offline

1. Abra o app no navegador
2. Abra DevTools (F12)
3. Vá em **Network** > marque **Offline**
4. Tente adicionar dados - funcionará!
5. Desmarque **Offline** - sincronizará automaticamente

## 🔑 Conceitos Principais

### IndexedDB via Dexie

O **Dexie** é um wrapper do IndexedDB que facilita muito o uso:

```typescript
export class LocalDatabase extends Dexie {
  dados!: Table<LocalData>;
  
  constructor() {
    super('AppOfflineDB');
    this.version(1).stores({
      dados: '++id, uuid, sincronizado'
    });
  }
}
```

### Sincronização Inteligente

```typescript
// Para cada item não sincronizado:
if (item.uuid) {
  // Já existe no servidor - ATUALIZAR
  await supabase.from('dados').update(...).eq('id', item.uuid);
} else {
  // Novo - INSERIR
  const { data } = await supabase.from('dados').insert(...);
  // Salva o UUID retornado
  await db.dados.update(item.id, { uuid: data.id });
}
```

### Detecção de Conexão

```typescript
useEffect(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}, []);
```

## 🚀 Adaptações Possíveis

### Para React Native

Substitua **Dexie** por:
- **AsyncStorage** (simples, mas limitado)
- **WatermelonDB** (recomendado para apps complexos)
- **SQLite** via `expo-sqlite` ou `react-native-sqlite-storage`

### Para Next.js

Funciona igual, mas:
- Use `'use client'` nos componentes que usam hooks
- IndexedDB só funciona no browser (não no SSR)

### Adicionar Autenticação

```typescript
// Em supabaseClient.ts
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // Usuário logado
}
```

## 📝 Melhorias Futuras

- [ ] Resolver conflitos (quando mesmo registro é editado offline e online)
- [ ] Queue de sincronização com retry automático
- [ ] Compressão de dados para economizar banda
- [ ] Service Worker para funcionar como PWA
- [ ] Criptografia de dados locais sensíveis
- [ ] Sincronização incremental (apenas campos modificados)

## 🐛 Troubleshooting

**Erro: "Failed to fetch"**
- Verifique se o Supabase URL e Key estão corretos no `.env`

**Dados não sincronizam**
- Abra o console e veja os logs
- Verifique as políticas RLS no Supabase
- Confirme que a tabela existe

**IndexedDB não funciona**
- Alguns navegadores bloqueiam em modo privado
- Verifique permissões do site

## 📚 Documentação

- [Dexie.js](https://dexie.org/)
- [Supabase](https://supabase.com/docs)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

Feito com ❤️ para funcionar offline!

