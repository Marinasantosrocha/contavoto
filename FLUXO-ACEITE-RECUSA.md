# 📋 Fluxo de Aceite/Recusa de Participação

## 🎯 Problema Resolvido

Agora o sistema registra **se a pessoa aceitou ou recusou participar da pesquisa**, evitando:
- ❌ Pesquisas vazias sem explicação
- ❌ Perda de dados sobre recusas (estatística importante!)
- ❌ Falta de feedback sobre por que alguém não quis participar

## 📊 Campos Adicionados

### 1. `aceite_participacao` (BOOLEAN)
- **`TRUE`**: Pessoa aceitou participar → Continua a entrevista
- **`FALSE`**: Pessoa recusou participar → Salva motivo e finaliza
- **`NULL`**: Ainda não perguntado (pesquisa em andamento inicial)

### 2. `motivo_recusa` (TEXT)
Preenchido apenas quando `aceite_participacao = FALSE`. Exemplos:
- "Sem tempo"
- "Não gosta de pesquisas"
- "Não mora aqui"
- "Não conhece o candidato"
- "Outro motivo"

## 🔄 Fluxo na Interface

### Quando o entrevistador chega na residência:

```
1. Preenche endereço, bairro, etc.
2. Geolocalização capturada automaticamente
3. Toca campainha / bate na porta
4. Apresenta o candidato e a pesquisa

┌─────────────────────────────────────┐
│  A pessoa aceita participar?        │
│  ☐ Sim  ☐ Não                      │
└─────────────────────────────────────┘
```

### Se **SIM** (aceite_participacao = TRUE):
```javascript
{
  aceite_participacao: true,
  motivo_recusa: null,
  // Inicia gravação de áudio
  // Mostra formulário com checkboxes
  // Continua normalmente
}
```

### Se **NÃO** (aceite_participacao = FALSE):
```javascript
{
  aceite_participacao: false,
  motivo_recusa: "Sem tempo", // Selecionado pelo entrevistador
  respostas: {}, // Vazio - não respondeu nada
  status: 'finalizada',
  // Não grava áudio
  // Finaliza e salva
}
```

## 🎨 Como Implementar na Interface

### PesquisaPage.tsx - Tela de Aceite

```tsx
// Novo componente: AceiteParticipacao
function AceiteParticipacao({ onAceite, onRecusa }) {
  const [mostrarMotivos, setMostrarMotivos] = useState(false);
  const [motivo, setMotivo] = useState('');

  const handleNao = () => {
    setMostrarMotivos(true);
  };

  const handleSalvarRecusa = () => {
    if (motivo) {
      onRecusa(motivo);
    }
  };

  if (mostrarMotivos) {
    return (
      <div className="motivo-recusa">
        <h3>Por que recusou?</h3>
        <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="Sem tempo">Sem tempo</option>
          <option value="Não gosta de pesquisas">Não gosta de pesquisas</option>
          <option value="Não mora aqui">Não mora aqui</option>
          <option value="Não conhece o candidato">Não conhece o candidato</option>
          <option value="Outro motivo">Outro motivo</option>
        </select>
        <button onClick={handleSalvarRecusa} disabled={!motivo}>
          Salvar Recusa
        </button>
      </div>
    );
  }

  return (
    <div className="aceite-participacao">
      <h2>A pessoa aceita participar da pesquisa?</h2>
      
      <div className="botoes-aceite">
        <button className="btn-sim" onClick={onAceite}>
          ✓ Sim, aceita
        </button>
        <button className="btn-nao" onClick={handleNao}>
          ✗ Não aceita
        </button>
      </div>
    </div>
  );
}
```

### Lógica no PesquisaPage.tsx

```tsx
const [etapa, setEtapa] = useState<'aceite' | 'perguntas' | 'finalizada'>('aceite');

// Quando aceita
const handleAceite = () => {
  setPesquisa(prev => ({
    ...prev,
    aceite_participacao: true,
    motivo_recusa: null
  }));
  setEtapa('perguntas');
  iniciarGravacaoAudio(); // Inicia gravação
};

// Quando recusa
const handleRecusa = (motivo: string) => {
  setPesquisa(prev => ({
    ...prev,
    aceite_participacao: false,
    motivo_recusa: motivo,
    status: 'finalizada',
    finalizadaEm: new Date()
  }));
  salvarPesquisaRecusada(); // Salva no IndexedDB
  setEtapa('finalizada');
};
```

## 📊 Estatísticas Possíveis

Com esses dados, o **Dashboard** pode mostrar:

1. **Taxa de Aceitação**
   - "85% das pessoas aceitaram participar"
   - "15% recusaram"

2. **Motivos de Recusa** (gráfico de pizza)
   - Sem tempo: 40%
   - Não gosta de pesquisas: 30%
   - Não conhece candidato: 20%
   - Outros: 10%

3. **Taxa por Entrevistador**
   - "João tem 90% de aceitação"
   - "Maria tem 75% de aceitação"

4. **Taxa por Bairro**
   - "Centro: 80% de aceitação"
   - "Bairro X: 60% de aceitação"

## 🗄️ Query de Exemplo

```sql
-- Ver estatísticas de aceite/recusa
SELECT 
  aceite_participacao,
  motivo_recusa,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM pesquisas
WHERE aceite_participacao IS NOT NULL
GROUP BY aceite_participacao, motivo_recusa
ORDER BY total DESC;
```

## ✅ Benefícios

1. **Dados Completos**: Sabe exatamente o que aconteceu em cada abordagem
2. **Estatísticas Reais**: Pode melhorar abordagem com base nos motivos
3. **Gamificação**: Taxa de aceitação pode virar conquista/badge
4. **Treinamento**: Identificar entrevistadores que precisam de ajuda
5. **Análise Territorial**: Ver quais bairros são mais receptivos

## 🎯 Próximos Passos

1. ✅ SQL atualizado com campos de aceite/recusa
2. ✅ Interface TypeScript atualizada (localDB.ts)
3. ⏳ Implementar componente AceiteParticipacao
4. ⏳ Integrar no fluxo do PesquisaPage
5. ⏳ Adicionar no Dashboard as estatísticas de aceite
