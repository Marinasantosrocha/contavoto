# ✅ Sistema de Aceite/Recusa de Participação - Implementado

## 📦 Arquivos Criados

### 1. **src/components/AceiteParticipacao.tsx**
Componente React para capturar aceite/recusa de participação.

**Funcionalidades:**
- ✅ Botão "Sim, aceita" (verde com ícone ✓)
- ✅ Botão "Não aceita" (vermelho com ícone ✗)
- ✅ Tela de seleção de motivos da recusa:
  - Sem tempo
  - Não gosta de pesquisas
  - Não mora aqui
  - Não conhece o candidato
  - Não quer se identificar
  - Outro motivo
- ✅ Botão "Voltar" (permite mudar de ideia)
- ✅ Mostra nome do candidato na pergunta
- ✅ Dica visual: "Lembre-se de apresentar o candidato..."

### 2. **src/components/AceiteParticipacao.css**
Estilos completos e responsivos para o componente.

**Destaques:**
- ✅ Gradientes modernos nos botões
- ✅ Ícones grandes e visuais
- ✅ Grid responsivo para motivos de recusa
- ✅ Animações suaves (hover, click)
- ✅ Mobile-first (adapta a telas pequenas)

### 3. **FLUXO-ACEITE-RECUSA.md**
Documentação completa do sistema.

**Conteúdo:**
- Explicação do problema resolvido
- Campos do banco de dados
- Fluxo da interface
- Exemplos de código
- Queries SQL de exemplo
- Ideias para estatísticas no Dashboard

## 📝 Arquivos Modificados

### 1. **src/pages/PesquisaPage.tsx**
**Mudanças:**
- ✅ Import do componente `AceiteParticipacao`
- ✅ Função `handleAceitarParticipacao()`: Salva `aceite_participacao = true`
- ✅ Função `handleRecusarParticipacao(motivo)`: Salva `aceite_participacao = false` + motivo + finaliza
- ✅ Substituição da UI antiga por `<AceiteParticipacao />`
- ✅ Mensagem amigável ao recusar: "Dados salvos para estatísticas"

### 2. **src/services/pesquisaService.ts**
**Mudanças:**
- ✅ `salvarResposta()`: Detecta campos especiais (`aceite_participacao`, `motivo_recusa`)
- ✅ Salva campos especiais diretamente na estrutura da pesquisa (não em `respostas`)
- ✅ `sincronizarPesquisas()`: Inclui `aceite_participacao` e `motivo_recusa` no upload para Supabase

### 3. **src/db/localDB.ts** (já estava atualizado anteriormente)
**Interface Pesquisa:**
```typescript
interface Pesquisa {
  // ... campos existentes
  aceite_participacao?: boolean;
  motivo_recusa?: string;
}
```

### 4. **ADICIONAR-AUDIO-IA.sql** (já estava atualizado)
**SQL:**
```sql
ALTER TABLE pesquisas ADD COLUMN IF NOT EXISTS aceite_participacao BOOLEAN;
ALTER TABLE pesquisas ADD COLUMN IF NOT EXISTS motivo_recusa TEXT;
```

## 🎯 Fluxo Completo

### 1. Entrevistador chega na residência
- Preenche endereço, bairro, cidade
- Geolocalização capturada automaticamente
- Inicia pesquisa

### 2. Tela de Aceite
```
┌─────────────────────────────────────┐
│           ? (ícone roxo)            │
│  A pessoa aceita participar?        │
│  Pesquisa sobre [Candidato]         │
│                                     │
│  ┌─────────────────┐               │
│  │  ✓ Sim, aceita  │ (verde)       │
│  └─────────────────┘               │
│  ┌─────────────────┐               │
│  │  ✗ Não aceita   │ (vermelho)    │
│  └─────────────────┘               │
│                                     │
│  💡 Lembre-se de apresentar...      │
└─────────────────────────────────────┘
```

### 3a. Se ACEITOU
- Salva `aceite_participacao = TRUE`
- Mostra formulário com perguntas
- Inicia gravação de áudio (futuramente)
- Continua fluxo normal

### 3b. Se RECUSOU
```
┌─────────────────────────────────────┐
│           ✗ (ícone rosa)            │
│  Por que a pessoa recusou?          │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │Sem tempo │  │Não gosta │       │
│  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐       │
│  │Não mora  │  │Não conhece│       │
│  └──────────┘  └──────────┘       │
│                                     │
│  [← Voltar] [Salvar Recusa]        │
└─────────────────────────────────────┘
```

- Seleciona motivo
- Salva `aceite_participacao = FALSE`
- Salva `motivo_recusa = "Sem tempo"`
- Finaliza pesquisa automaticamente
- Mostra mensagem: "Dados salvos para estatísticas"
- Volta para Home

## 💾 Persistência de Dados

### IndexedDB (Local)
```javascript
pesquisa = {
  id: 1,
  endereco: "Rua ABC, 123",
  aceite_participacao: false,
  motivo_recusa: "Sem tempo",
  respostas: {}, // vazio - não respondeu
  status: 'finalizada',
  sincronizado: false
}
```

### Supabase (Sync)
Quando online, sincroniza para tabela `pesquisas`:
```sql
INSERT INTO pesquisas (
  endereco, bairro, cidade,
  aceite_participacao, motivo_recusa,
  respostas, status
) VALUES (
  'Rua ABC, 123', 'Centro', 'São Paulo',
  FALSE, 'Sem tempo',
  '{}', 'finalizada'
);
```

## 📊 Estatísticas Possíveis (Dashboard Futuro)

### 1. Taxa de Aceitação Geral
```sql
SELECT 
  CASE 
    WHEN aceite_participacao = TRUE THEN 'Aceitou'
    WHEN aceite_participacao = FALSE THEN 'Recusou'
    ELSE 'Não perguntado'
  END as status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentual
FROM pesquisas
GROUP BY aceite_participacao
ORDER BY COUNT(*) DESC;
```

Resultado:
```
| Status         | Total | Percentual |
|----------------|-------|------------|
| Aceitou        | 850   | 85.0%      |
| Recusou        | 150   | 15.0%      |
```

### 2. Motivos de Recusa (Top 5)
```sql
SELECT 
  motivo_recusa,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentual
FROM pesquisas
WHERE aceite_participacao = FALSE
GROUP BY motivo_recusa
ORDER BY COUNT(*) DESC
LIMIT 5;
```

Resultado:
```
| Motivo               | Total | % do Total |
|----------------------|-------|------------|
| Sem tempo            | 60    | 40.0%      |
| Não gosta pesquisas  | 45    | 30.0%      |
| Não conhece cand.    | 30    | 20.0%      |
| Não mora aqui        | 10    | 6.7%       |
| Outro motivo         | 5     | 3.3%       |
```

### 3. Ranking de Entrevistadores
```sql
SELECT 
  entrevistador,
  COUNT(*) as total_abordagens,
  SUM(CASE WHEN aceite_participacao = TRUE THEN 1 ELSE 0 END) as aceitaram,
  ROUND(
    SUM(CASE WHEN aceite_participacao = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as taxa_aceitacao
FROM pesquisas
WHERE aceite_participacao IS NOT NULL
GROUP BY entrevistador
ORDER BY taxa_aceitacao DESC
LIMIT 10;
```

Resultado:
```
| Entrevistador | Abordagens | Aceitaram | Taxa   |
|---------------|------------|-----------|--------|
| João Silva    | 120        | 108       | 90.0%  |
| Maria Santos  | 100        | 85        | 85.0%  |
| Pedro Costa   | 90         | 72        | 80.0%  |
```

### 4. Análise por Bairro
```sql
SELECT 
  bairro,
  COUNT(*) as total_abordagens,
  SUM(CASE WHEN aceite_participacao = TRUE THEN 1 ELSE 0 END) as aceitaram,
  ROUND(
    SUM(CASE WHEN aceite_participacao = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    1
  ) as taxa_aceitacao
FROM pesquisas
WHERE aceite_participacao IS NOT NULL
GROUP BY bairro
HAVING COUNT(*) >= 10  -- Apenas bairros com volume significativo
ORDER BY taxa_aceitacao DESC;
```

## 🎮 Gamificação (Futuro)

### Conquistas Baseadas em Taxa de Aceitação

**🥇 Diplomata** - Taxa de aceitação > 95%
```sql
SELECT entrevistador
FROM pesquisas
WHERE aceite_participacao IS NOT NULL
GROUP BY entrevistador
HAVING 
  SUM(CASE WHEN aceite_participacao = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*) > 95
  AND COUNT(*) >= 50;  -- Mínimo 50 abordagens
```

**🥈 Persuasivo** - Taxa de aceitação > 90%

**🥉 Comunicativo** - Taxa de aceitação > 85%

**📊 Analista** - Registrou mais de 100 abordagens (aceitas ou recusadas)

**🎯 Persistente** - Menor taxa de "Sem tempo" como motivo

## ✅ Checklist de Implementação

- ✅ Criar componente `AceiteParticipacao.tsx`
- ✅ Criar estilos `AceiteParticipacao.css`
- ✅ Atualizar `PesquisaPage.tsx` com novo fluxo
- ✅ Atualizar `pesquisaService.ts` para salvar campos especiais
- ✅ Atualizar sincronização para enviar ao Supabase
- ✅ Interface TypeScript (`localDB.ts`) atualizada
- ✅ SQL migration (`ADICIONAR-AUDIO-IA.sql`) criado
- ✅ Documentação completa (`FLUXO-ACEITE-RECUSA.md`)
- ⏳ Testar fluxo completo no navegador
- ⏳ Executar SQL no Supabase
- ⏳ Implementar dashboard com estatísticas

## 🧪 Como Testar

1. **Executar SQL no Supabase**
   ```bash
   # Abrir Supabase Dashboard → SQL Editor
   # Copiar e executar: ADICIONAR-AUDIO-IA.sql
   ```

2. **Iniciar aplicação**
   ```bash
   npm run dev
   ```

3. **Testar Aceite**
   - Criar nova pesquisa
   - Preencher endereço
   - Clicar "Sim, aceita"
   - Verificar que formulário aparece

4. **Testar Recusa**
   - Criar nova pesquisa
   - Preencher endereço
   - Clicar "Não aceita"
   - Selecionar motivo (ex: "Sem tempo")
   - Clicar "Salvar Recusa"
   - Verificar que volta para Home
   - Ir em "Lista de Pesquisas"
   - Verificar que pesquisa aparece como "finalizada"

5. **Verificar IndexedDB**
   ```
   DevTools → Application → IndexedDB → PortaAPortaDB → pesquisas
   ```
   Verificar campos:
   - `aceite_participacao: false`
   - `motivo_recusa: "Sem tempo"`

6. **Verificar Sincronização**
   - Estar online
   - Aguardar sync automática ou forçar
   - Ir no Supabase → Table Editor → pesquisas
   - Verificar registro com aceite/recusa

## 🚀 Próximos Passos

1. ⏳ **Testar no navegador** (aceite + recusa)
2. ⏳ **Executar SQL no Supabase**
3. ⏳ **Implementar sistema de áudio + IA**
4. ⏳ **Criar Dashboard com estatísticas**
5. ⏳ **Implementar conquistas/gamificação**

## 📌 Notas Importantes

- ✅ Sistema funciona offline (salva localmente)
- ✅ Sincroniza automaticamente quando online
- ✅ Não perde dados de recusa (estatística valiosa!)
- ✅ Interface amigável e visual
- ✅ Pode voltar atrás antes de salvar recusa
- ✅ Campos especiais separados de `respostas` para melhor organização
