# 📋 CORREÇÃO: Formulários do Supabase (Não Locais)

## ❌ Problema Identificado

Você viu múltiplas opções de formulários (duplicatas) mesmo tendo apenas 1 no Supabase porque:

1. **Sistema criava formulários locais**: Função `inicializarFormularioModelo()` criava 2 formulários locais (teste + completo)
2. **Cache não era limpo**: Formulários antigos ficavam acumulados no IndexedDB
3. **Sincronização duplicava**: Cada vez que rodava, adicionava novos sem remover antigos

## ✅ Solução Implementada

### 🔄 Nova Arquitetura de Formulários

```
FONTE ÚNICA DE VERDADE: Supabase
         ↓
    [Online?]
    ↙     ↘
  SIM     NÃO
   ↓       ↓
Busca   Usa cache
remoto   local
   ↓       ↓
Limpa    
antigos
   ↓
Salva
cache local
```

### 📝 Mudanças no Código

#### 1. **useFormularios.ts** (Hook de busca)

**ANTES**:
```typescript
// Tentava buscar de várias tabelas
// Não limpava formulários antigos
// Misturava locais com remotos
```

**AGORA**:
```typescript
✅ Busca SEMPRE de 'formularios' (Supabase)
✅ LIMPA formulários locais antigos (clear())
✅ Salva cache local apenas para offline
✅ Usa ID remoto como UUID (não gera localmente)
✅ Logs detalhados de cada operação
```

#### 2. **pesquisaService.ts** (Função deprecada)

**ANTES**:
```typescript
static async inicializarFormularioModelo() {
  // Criava 2 formulários localmente
  await this.salvarFormulario(formularioTeste);
  await this.salvarFormulario(formularioCompleto);
}
```

**AGORA**:
```typescript
static async inicializarFormularioModelo() {
  // ⚠️ DEPRECADO - mostra warning
  // Agora apenas busca do Supabase
  // Não cria mais localmente
}
```

#### 3. **LIMPAR-BANCO-LOCAL.html** (Ferramenta)

**NOVO BOTÃO**:
```html
📥 Baixar Formulários do Supabase
```

- Limpa formulários locais
- Baixa do Supabase
- Salva cache para uso offline

## 🎯 Como Funciona Agora

### Cenário 1: Usuário Online (Primeira Vez)

```
1. Abre aplicação
2. useFormularios() detecta online
3. Busca formulários do Supabase
4. Limpa cache local antigo
5. Salva formulários remotos no cache
6. Usuário vê APENAS formulários do Supabase
```

### Cenário 2: Usuário Online (Retorno)

```
1. Abre aplicação
2. useFormularios() detecta online
3. Busca formulários atualizados do Supabase
4. Substitui cache local
5. Usuário sempre vê versão mais recente
```

### Cenário 3: Usuário Offline

```
1. Abre aplicação
2. useFormularios() detecta offline
3. Retorna cache local (última versão baixada)
4. Usuário pode criar pesquisas com formulários em cache
5. Ao ficar online, cache é atualizado automaticamente
```

## 📊 Validação

### Antes da correção:
```
SELECT * FROM formularios (Local)
→ 4 registros (2 testes + 2 completos duplicados)

SELECT * FROM formularios (Supabase)
→ 1 registro

Dropdown mostra: 4 opções ❌
```

### Depois da correção:
```
SELECT * FROM formularios (Local)
→ 1 registro (cache do Supabase)

SELECT * FROM formularios (Supabase)
→ 1 registro

Dropdown mostra: 1 opção ✅
```

## 🧪 Como Testar

### Teste 1: Limpar e Recarregar

```bash
# 1. Abra o limpador
http://localhost:3004/LIMPAR-BANCO-LOCAL.html

# 2. Clique "Verificar Dados Atuais"
# Deve mostrar quantos formulários existem

# 3. Clique "Limpar TUDO"
# Confirme 2x

# 4. Volte para app
# 5. Recarregue página (F5)

# 🎯 Console deve mostrar:
# 📥 1 formulários baixados do Supabase
# 🧹 Formulários locais antigos removidos
# ✅ 1 formulários salvos no cache local
```

### Teste 2: Verificar Dropdown

```bash
# 1. Na home, veja seção "Nova Pesquisa"
# 2. Clique no dropdown "Selecione o Formulário"

# 🎯 Deve mostrar APENAS:
# - "Escolha um formulário..." (placeholder)
# - 1 opção de formulário (do Supabase)
```

### Teste 3: Modo Offline

```bash
# 1. Com formulários em cache
# 2. DevTools → Network → Offline
# 3. Recarregue página

# 🎯 Console deve mostrar:
# 📴 Offline - usando cache local de formulários

# 4. Dropdown deve continuar mostrando formulário em cache
```

## 🔧 Configurações

### Query Config (useFormularios)

```typescript
{
  staleTime: 1000 * 60 * 5, // 5 minutos
  refetchOnMount: true,      // Sempre recarrega ao abrir
  refetchOnWindowFocus: true // Recarrega ao voltar pra aba
}
```

**Por que 5 minutos?**
- Balance entre performance e atualização
- Garante que mudanças no Supabase sejam vistas rapidamente
- Reduz chamadas desnecessárias

## 🚨 Troubleshooting

### Problema: Ainda vejo formulários duplicados

**Solução**:
```bash
# 1. Abra DevTools (F12)
# 2. Application → IndexedDB → PortaAPortaDB → formularios
# 3. Clique com botão direito → "Delete database"
# 4. Recarregue página (Ctrl+Shift+R)
```

### Problema: Formulário não aparece no dropdown

**Solução**:
```bash
# 1. Verifique console: tem erros de Supabase?
# 2. Verifique .env: credenciais corretas?
# 3. Verifique Supabase: tabela 'formularios' existe?
# 4. Verifique RLS: policies permitem SELECT público?
```

### Problema: Erro "Failed to fetch"

**Solução**:
```bash
# 1. Verifique internet
# 2. Verifique CORS no Supabase
# 3. Verifique se URL do Supabase está correta em .env
```

## 📋 Checklist de Validação

Marque após confirmar:

- [ ] Limpou banco local completamente
- [ ] Recarregou página e viu logs de download
- [ ] Dropdown mostra APENAS formulários do Supabase
- [ ] Não vê mais duplicatas
- [ ] Testou criar nova pesquisa
- [ ] Formulário correto foi associado à pesquisa
- [ ] Modo offline funciona com cache
- [ ] Console não mostra mais erros de FK

## 🎯 Fluxo Completo Corrigido

```
┌─────────────────────────────────────────┐
│  Usuário abre aplicação                 │
└──────────────┬──────────────────────────┘
               ↓
       [Está online?]
          ↙       ↘
        SIM       NÃO
         ↓         ↓
    ┌────────┐  ┌──────────┐
    │Supabase│  │Cache     │
    │GET /   │  │Local     │
    │form... │  │(offline) │
    └───┬────┘  └────┬─────┘
        ↓            ↓
    ┌───────────────────┐
    │ Limpa antigos     │
    │ db.clear()        │
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │ Salva cache       │
    │ (para offline)    │
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │ Retorna para UI   │
    │ (1 formulário)    │
    └───────────────────┘
```

## 📝 Notas Importantes

1. **Formulários devem ser criados no Supabase**: Use SQL ou interface do Supabase para criar/editar formulários
2. **Não use `inicializarFormularioModelo()`**: Essa função está deprecada
3. **Cache é automático**: Sistema gerencia cache local automaticamente
4. **Sempre online primeiro**: Se estiver online, sempre busca versão mais recente

---

**Data da correção**: 21 de outubro de 2025  
**Status**: ✅ Implementado e testável  
**Impacto**: Resolve duplicatas + sincroniza com fonte única (Supabase)
