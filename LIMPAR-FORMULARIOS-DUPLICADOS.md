# ⚠️ ATENÇÃO: Formulários Duplicados

## Problema
Os formulários antigos ainda estão salvos no banco local. Por isso você vê duplicados.

## ✅ SOLUÇÃO DEFINITIVA

### Execute este código NO CONSOLE (F12):

```javascript
// Limpar TODOS os formulários antigos
(async function() {
  const openRequest = indexedDB.open('contavoto-db');
  
  openRequest.onsuccess = async function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['formularios'], 'readwrite');
    const store = transaction.objectStore('formularios');
    
    // Limpar tudo
    store.clear();
    
    console.log('✅ Formulários antigos removidos!');
    console.log('🔄 Recarregue a página para criar os novos formulários');
    
    setTimeout(() => {
      alert('Banco limpo! A página será recarregada.');
      location.reload();
    }, 1000);
  };
})();
```

### Depois do reload, você verá:
1. ✅ **Pesquisa Teste Rápido** (4 perguntas)
2. ✅ **Pesquisa Porta a Porta - Modelo Completo** (25+ perguntas)

---

## 🎯 Alternativa Rápida

Se preferir, execute apenas:

```javascript
indexedDB.deleteDatabase('contavoto-db');
setTimeout(() => location.reload(), 1000);
```

Depois faça login novamente.
