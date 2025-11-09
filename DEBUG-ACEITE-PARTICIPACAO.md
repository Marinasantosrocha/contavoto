# DEBUG: Aceite Participação não está salvando

## Passo 1: Verificar IndexedDB Local

Abra o Console do navegador (F12) e execute:

```javascript
// Abrir IndexedDB
como `undefined` ou `null`

---

## Passo 2: Verificar se está salvando ao clicar

1. Inicie uma nova pesquisa
2. Abra o Console (F12)
3. Clique em "Sim, Mulher" ou "Sim, Homem"
4. Veja se aparece algum erro no console
5. Execute novamente o código do Passo 1 para ver se salvou

---

## Passo 3: Verificar sincronização

Execute no console:

```javascript
// Ver pesquisas não sincronizadas
const request = indexedDB.open('PortaAPortaDB');
request.onsuccess = (event) => {
  const db = event.target.result;
  const transaction = db.transaction(['pesquisas'], 'readonly');
  const store = transaction.objectStore('pesquisas');
  const getAllRequest = store.getAll();
  
  getAllRequest.onsuccess = () => {
    const pesquisas = getAllRequest.result;
    const naoSincronizadas = pesquisas.filter(p => !p.sincronizado);
    console.log('=== PESQUISAS NÃO SINCRONIZADAS ===');
    console.log(`Total: ${naoSincronizadas.length}`);
    naoSincronizadas.forEach(p => {
      console.log({
        id: p.id,
        uuid: p.uuid,
        aceite_participacao: p.aceite_participacao,
        motivo_recusa: p.motivo_recusa,
        sincronizado: p.sincronizado
      });
    });
  };
};
```

---

## Passo 4: Verificar o que está sendo enviado para o Supabase

Adicione um `console.log` temporário no código:

**Arquivo:** `src/services/pesquisaService.ts`

**Linha 589** (dentro do `insertData`), adicione:

```typescript
console.log('🔍 ENVIANDO PARA SUPABASE:', {
  aceite_participacao: pesquisa.aceite_participacao,
  motivo_recusa: pesquisa.motivo_recusa
});
```

Depois sincronize e veja o que aparece no console.

---

## Possíveis Causas

1. **O campo não está sendo salvo no IndexedDB** → Problema no `salvarResposta`
2. **O campo está no IndexedDB mas não sincroniza** → Problema na sincronização
3. **O campo sincroniza mas o Supabase rejeita** → Problema de RLS ou tipo de coluna
4. **O campo é sobrescrito depois** → Algum código está limpando o valor

Me diga o que você encontrou em cada passo!

