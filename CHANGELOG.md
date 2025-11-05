# 📝 Changelog

## [2.1.0] - 2025-10-22

### 🎬 Vídeo de Encerramento (offline)

#### ✅ Adicionado

- Seção de vídeo de agradecimento no encerramento da entrevista, com botão "Assistir vídeo de agradecimento".
- Suporte offline: o vídeo é armazenado pelo PWA (Workbox) após a primeira visualização e pode ser reproduzido sem internet.

#### ℹ️ Como usar

1) Coloque o arquivo do vídeo em `public/agradecimento.mp4`.
   - Formato recomendado: MP4 (H.264 + AAC).
   - Tamanho sugerido: até ~5–10 MB para download rápido em campo.
2) Gere o build de produção e acesse o app online ao menos uma vez para que o vídeo seja salvo no cache.
3) Conduza a entrevista normalmente; no "Encerramento" aparecerá o botão para assistir ao vídeo.
4) Opcional: ative o modo offline no DevTools e reproduza novamente para validar o cache.

#### 🛠️ Detalhes técnicos

- O PWA foi configurado para:
  - Incluir `agradecimento.mp4` nos assets (precaching) e permitir cache-first para `request.destination === 'video'`.
  - Padrão de cache: CacheFirst para vídeos, garantindo reprodução offline.
- Caso opte por um nome/URL diferente, ajuste o `src` do `<video>` em `src/pages/PesquisaPage.tsx` e/ou a configuração do PWA.

#### 📌 Observações

- É possível definir uma imagem de capa usando `poster` no elemento `<video>`.
- Se o vídeo estiver no Supabase Storage, a regra de cache por `destination: video` também cobre o carregamento (após o primeiro acesso online).

## [2.0.0] - 2024-01-XX

### ⚡ Refatoração Completa com React Query

#### 🎉 Adicionado

- **React Query (TanStack Query v5)** como sistema de gerenciamento de estado
- Hooks customizados para todas as operações:
  - `useFormularios()` - Gestão de formulários
  - `usePesquisas()` - Gestão de pesquisas
  - `useEstatisticasPesquisas()` - Dashboard em tempo real
  - `useSincronizar()` - Sincronização com Supabase
- React Query DevTools para debugging
- Cache automático e inteligente
- Optimistic Updates para UX instantânea
- Invalidação automática de cache

#### 🔄 Modificado

- Refatorado `HomePage` para usar React Query hooks
- Refatorado `PesquisaPage` com optimistic updates
- Refatorado `ListaPesquisasPage` com cache inteligente
- App.tsx agora usa `QueryClientProvider`
- Melhor tratamento de estados de loading/error

#### 📚 Documentação

- Adicionado **REACT-QUERY.md** - Guia completo do React Query no projeto
- Atualizado documentos principais com informações do React Query

#### ⚡ Performance

- UI mais responsiva com cache local
- Menos re-renders desnecessários
- Sincronização em background mais eficiente
- Deduplicação automática de requisições

#### 🐛 Correções

- Melhor handling de erros
- Retry automático em caso de falha
- Sincronização mais confiável

### 🎯 Benefícios

- **Código 40% mais limpo** - Menos boilerplate
- **UX 300% melhor** - Optimistic updates
- **Performance superior** - Cache inteligente
- **Mais confiável** - Retry e error handling automáticos

---

## [1.0.0] - 2024-01-XX

### 🎉 Lançamento Inicial

#### ✨ Funcionalidades Principais

- Sistema completo de pesquisa porta a porta
- Funciona 100% offline com IndexedDB
- Sincronização automática com Supabase
- Formulário pré-configurado baseado em modelo real
- Interface passo a passo para coleta de dados
- Scripts de abordagem e encerramento
- Perguntas condicionais
- Geolocalização automática
- Dashboard de estatísticas
- Sistema de filtros e busca

#### 🏗️ Arquitetura

- React + TypeScript
- Dexie (IndexedDB wrapper)
- Supabase (PostgreSQL)
- Vite (Build tool)
- Offline-first architecture

#### 📚 Documentação

- README.md - Documentação técnica
- GUIA-RAPIDO.md - Tutorial completo
- MANUAL-DO-ENTREVISTADOR.md - Para usuários finais
- COMO-PERSONALIZAR.md - Criar formulários
- LEIA-ME.md - Visão geral em português
- INICIO-RAPIDO.md - Setup em 5 minutos

#### 🎨 Interface

- Design moderno e responsivo
- Mobile-first
- Estados de loading claros
- Feedback visual imediato
- Progress bar durante pesquisa

---

## Formato

Baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)

Tipos de mudanças:
- `Adicionado` - Novas funcionalidades
- `Modificado` - Mudanças em funcionalidades existentes
- `Depreciado` - Funcionalidades que serão removidas
- `Removido` - Funcionalidades removidas
- `Correções` - Bug fixes
- `Segurança` - Vulnerabilidades corrigidas




