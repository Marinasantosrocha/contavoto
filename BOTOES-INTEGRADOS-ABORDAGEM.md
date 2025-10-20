# 🎯 Botões Integrados ao Card de Abordagem

## ✅ Mudanças Implementadas

### Antes:
```
┌─────────────────────────┐
│  🗣️ Abordagem Inicial  │
│  "Bom dia! ..."        │
└─────────────────────────┘

┌─────────────────────────┐  ← Card extra separado
│   ? Aceita participar?  │
│   ✅ Sim, aceita        │
│   ❌ Não aceita         │
└─────────────────────────┘
```

### Depois:
```
┌─────────────────────────┐
│  🗣️ Abordagem Inicial  │
│  "Bom dia! ..."        │
│  ─────────────────────  │  ← Separador
│  [Sim, aceita] [Não]   │  ← Botões integrados
└─────────────────────────┘
```

---

## 🎨 Estilo dos Botões

### Botão "Sim, aceita"
- **Cor**: Teal claro (rgba(32, 178, 170, 0.15))
- **Texto**: Teal (#20B2AA)
- **Borda**: Teal transparente
- **Ícone**: ❌ Removido (sem ícone)

### Botão "Não aceita"
- **Cor**: Cinza claro (#F8F9FA)
- **Texto**: Cinza (#6C757D)
- **Borda**: Cinza (#E9ECEF)
- **Ícone**: ❌ Removido (sem ícone)

---

## 📝 Código CSS

```css
/* Container inline dentro do card */
.aceite-inline {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E9ECEF; /* Linha separadora */
}

/* Botões lado a lado */
.aceite-botoes {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Botão Sim (teal claro) */
.aceite-btn.sim {
  background-color: rgba(32, 178, 170, 0.15);
  color: #20B2AA;
  border: 2px solid rgba(32, 178, 170, 0.3);
}

/* Botão Não (cinza) */
.aceite-btn.nao {
  background-color: #F8F9FA;
  color: #6C757D;
  border: 2px solid #E9ECEF;
}
```

---

## 🔄 Fluxo

### 1. Estado Inicial
- Mostra card de abordagem
- Botões "Sim" e "Não" visíveis
- Sem ícones, apenas texto

### 2. Clicar em "Sim"
- Remove os botões
- Inicia gravação automática
- Mostra primeira pergunta

### 3. Clicar em "Não"
- Abre modal de motivos
- Mantém card separado (ícone X vermelho)
- Lista de 6 motivos
- Botões "Voltar" e "Salvar Recusa"

---

## 📱 Responsivo

### Desktop
```
[    Sim, aceita    ] [    Não aceita    ]
```

### Mobile (< 480px)
```
┌─────────────────┐
│  Sim, aceita    │
├─────────────────┤
│  Não aceita     │
└─────────────────┘
```

---

## 🎯 Arquivos Modificados

1. **src/components/AceiteParticipacao.tsx**
   - Removido container extra (.aceite-container)
   - Removido card (.aceite-card)
   - Removido ícone
   - Removido título "A pessoa aceita participar?"
   - Removido ícones dos botões (✓ e ✗)
   - Criado .aceite-inline (integra no card pai)

2. **src/components/AceiteParticipacao.css**
   - Novo: .aceite-inline (borda superior + espaçamento)
   - Botão sim: teal claro (rgba)
   - Botão não: cinza claro
   - Responsivo: empilha verticalmente em mobile

3. **src/pages/PesquisaPage.tsx**
   - Movido <AceiteParticipacao> para dentro do card de abordagem
   - Agora renderiza após o script, dentro do mesmo card

---

## ✨ Resultado Visual

### Card de Abordagem (Completo)
```
┌──────────────────────────────────────────┐
│  🗣️ Abordagem Inicial                    │
├──────────────────────────────────────────┤
│                                          │
│  "Bom dia! Tudo bem? Desculpe incomodar. │
│  Eu trabalho para o Pedro Braga. Ele     │
│  tem trabalhado e buscado melhorias..."  │
│                                          │
│  "São algumas perguntas bem rápidas..."  │
│                                          │
│  ────────────────────────────────────── │  
│                                          │
│     [Sim, aceita]    [Não aceita]       │  ← Integrados!
│                                          │
└──────────────────────────────────────────┘
```

### Cores Reais
- **Sim**: Fundo teal 15%, texto teal, borda teal 30%
- **Não**: Fundo cinza claro, texto cinza, borda cinza

---

## 🎨 Hierarquia Visual

1. Título (🗣️ Abordagem Inicial) - Peso forte
2. Script de apresentação - Texto normal
3. Linha separadora - Cinza sutil
4. Botões de ação - Destaque moderado

**Tudo em um único card, mais limpo e direto!** ✨
