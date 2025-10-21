# 🔄 RESETAR BANCO LOCAL

## Você precisa limpar o banco para ver o novo formulário

### Opção 1: Via Console do Navegador (MAIS RÁPIDO)

1. Abra o app no navegador
2. Pressione **F12** para abrir o Console
3. Cole este código e pressione Enter:

```javascript
indexedDB.deleteDatabase('contavoto-db');
alert('✅ Banco limpo! A página será recarregada.');
setTimeout(() => location.reload(), 1000);
```

### Opção 2: Via Developer Tools

1. Pressione **F12**
2. Vá em **Application** (ou **Aplicação**)
3. No menu lateral esquerdo: **Storage** → **IndexedDB**
4. Clique com botão direito em **contavoto-db**
5. Clique em **Delete database**
6. Recarregue a página (**F5** ou **Ctrl+R**)

---

## ✅ Depois de limpar

1. Recarregue a página
2. Faça login novamente
3. Vá no Dashboard
4. Clique em "Nova Pesquisa"
5. Agora deve aparecer: **"Pesquisa Teste Rápido"** com apenas 4 perguntas!

---

## 🎯 Formulário Novo

- Nome: "Pesquisa Teste Rápido"
- Perguntas:
  1. Qual é o seu nome?
  2. Telefone (opcional)
  3. Qual o problema do seu bairro?
  4. O que você sugere para melhorar?
