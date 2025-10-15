# 🚪 PORTA A PORTA

**Sistema profissional de pesquisa de campo que funciona offline!**

---

## 🎯 O que é?

Um aplicativo completo para fazer **pesquisas porta a porta** (tipo pesquisa política, levantamento de necessidades, etc.) que:

- ✅ **Funciona SEM internet** (ideal para áreas sem cobertura)
- ✅ **Sincroniza automaticamente** quando voltar online
- ✅ **Nunca perde dados** (tudo salvo localmente)
- ✅ **Interface fácil** (perguntas passo a passo)
- ✅ **Scripts prontos** (abordagem e encerramento)

---

## 🚀 Como Começar?

### Opção 1: Início Rápido (5 minutos)

Leia o arquivo: **`INICIO-RAPIDO.md`**

### Opção 2: Tutorial Completo

Leia o arquivo: **`GUIA-RAPIDO.md`**

---

## 📱 Como Funciona?

### 1. Tela Inicial

```
┌─────────────────────────────────┐
│  🚪 PORTA A PORTA              │
│                                 │
│  📊 Estatísticas:              │
│  ├─ Total: 45                  │
│  ├─ Finalizadas: 42            │
│  └─ Pendentes: 3               │
│                                 │
│  📋 Nova Pesquisa:             │
│  ├─ Seu Nome: [______]         │
│  ├─ Formulário: [Selecione]    │
│  ├─ Endereço: [______]         │
│  ├─ Bairro: [______]           │
│  └─ Cidade: [______]           │
│                                 │
│  [🚀 Iniciar Pesquisa]         │
└─────────────────────────────────┘
```

### 2. Durante a Pesquisa

```
┌─────────────────────────────────┐
│  Pergunta 5 de 25              │
│  [████████░░░░░░░░] 40%        │
│                                 │
│  Como avalia a saúde pública?  │
│                                 │
│  ( ) Piorou                    │
│  ( ) Está Igual                │
│  (●) Melhorou                  │
│                                 │
│  [⬅️ Anterior] [Próximo ➡️]   │
└─────────────────────────────────┘
```

### 3. Finalização

```
┌─────────────────────────────────┐
│         ✅ Concluído!          │
│                                 │
│  Pesquisa finalizada com        │
│  sucesso e salva localmente!   │
│                                 │
│  📊 Sincronização: ✅ OK       │
│                                 │
│  [🏠 Voltar ao Início]         │
└─────────────────────────────────┘
```

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **INICIO-RAPIDO.md** | Setup em 5 minutos |
| **GUIA-RAPIDO.md** | Tutorial completo |
| **MANUAL-DO-ENTREVISTADOR.md** | Para quem vai a campo |
| **COMO-PERSONALIZAR.md** | Criar formulários customizados |
| **REACT-QUERY.md** | Como funciona o React Query no projeto |
| **README.md** | Documentação técnica completa |

---

## 🛠️ Tecnologias Usadas

- **React** + TypeScript
- **React Query** (TanStack Query) - Gerenciamento de estado
- **Supabase** (banco de dados na nuvem)
- **Dexie** (banco de dados local - IndexedDB)
- **Vite** (build tool)

---

## 📞 Suporte

Está com dúvidas? Leia os arquivos na seguinte ordem:

1. **INICIO-RAPIDO.md** ← Comece aqui!
2. **GUIA-RAPIDO.md** ← Tutorial passo a passo
3. **MANUAL-DO-ENTREVISTADOR.md** ← Para usar no campo
4. **COMO-PERSONALIZAR.md** ← Criar seus formulários

---

## ⚡ Comandos Úteis

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Visualizar versão de produção
npm run preview
```

---

## 📦 Estrutura de Arquivos

```
porta-a-porta/
├── src/
│   ├── pages/           # Telas do app
│   ├── components/      # Componentes reutilizáveis
│   ├── services/        # Lógica de negócio
│   ├── db/              # Banco de dados local
│   └── data/            # Formulários pré-configurados
├── supabase-schema.sql  # SQL para criar tabelas
├── INICIO-RAPIDO.md     # ⭐ Comece aqui!
├── GUIA-RAPIDO.md       # Tutorial completo
├── MANUAL-DO-ENTREVISTADOR.md
├── COMO-PERSONALIZAR.md
└── README.md            # Docs técnicas
```

---

## 🌟 Principais Vantagens

### 1. Offline-First
Não precisa de internet para funcionar. Ideal para:
- Áreas rurais
- Locais com sinal fraco
- Economizar dados móveis

### 2. Sincronização Inteligente
- Detecta automaticamente quando volta online
- Sincroniza em background
- Mostra o que ainda não foi sincronizado

### 3. Interface Amigável
- Perguntas uma por vez
- Barra de progresso
- Validação automática
- Scripts prontos

### 4. Geolocalização
- Captura GPS automaticamente
- Facilita mapear as respostas
- Opcional (funciona sem GPS também)

---

## 🎨 Capturas de Tela

O app possui 3 telas principais:

1. **Home** - Escolha formulário e inicie pesquisa
2. **Pesquisa** - Responda perguntas passo a passo
3. **Lista** - Veja todas as pesquisas realizadas

Cada tela é responsiva e funciona em:
- 📱 Celular
- 📱 Tablet  
- 💻 Desktop

---

## ✨ Recursos Especiais

### Scripts Automáticos

**Abordagem Inicial** (mostra no início):
> "Bom dia! Tudo bem? Desculpe incomodar. Eu trabalho para o [CANDIDATO]..."

**Encerramento** (mostra no final):
> "Muito obrigado por dedicar seu tempo para responder..."

### Perguntas Condicionais

Perguntas aparecem/desaparecem baseado em respostas anteriores:

```
❓ Tem filhos?
   → SIM → Mostra: "Quantos filhos?"
   → NÃO → Pula essa seção
```

### Validação Automática

- Campos obrigatórios marcados com *
- Não deixa avançar sem preencher
- Tipos validados (telefone, número, etc.)

---

## 🔒 Segurança dos Dados

- ✅ Dados salvos localmente primeiro (nunca perdidos)
- ✅ Criptografia HTTPS na sincronização
- ✅ Row Level Security (RLS) no Supabase
- ✅ Não envia nada sem sua permissão

---

## 📈 Estatísticas

Acompanhe o progresso em tempo real:

- Total de pesquisas realizadas
- Quantas foram finalizadas
- Quantas estão em andamento
- Quantas ainda não sincronizaram

---

## 🎯 Casos de Uso

Perfeito para:

- 📊 Pesquisas políticas porta a porta
- 🏘️ Levantamento de necessidades de bairros
- 📋 Censos e mapeamentos
- 🗳️ Pesquisas de opinião pública
- 🏗️ Avaliação de infraestrutura
- 🏥 Pesquisas de saúde pública
- 🎓 Levantamentos educacionais

---

## 💡 Dicas Importantes

### Para Entrevistadores

1. Preencha **localização ANTES** de tocar a campainha
2. Leia o **script de abordagem** antes de abordar
3. **Sincronize** sempre que tiver Wi-Fi
4. Mantenha **bateria carregada**

### Para Coordenadores

1. Configure o **nome do candidato** no formulário
2. Customize as **perguntas** conforme necessário
3. Monitore **estatísticas** em tempo real
4. Exporte dados do **Supabase** para análise

---

## 🆘 Problemas Comuns

### "Não conecta no Supabase"
✅ Verifique o arquivo `.env` com suas credenciais

### "Tabela não existe"
✅ Execute o SQL: `supabase-schema.sql`

### "App não salva"
✅ Confira o console do navegador (F12)

### "Dados sumiram"
✅ Dados ficam no navegador! Não limpe o cache

---

## 📜 Licença

MIT License - Use livremente!

---

## 🙏 Créditos

Desenvolvido com ❤️ para facilitar o trabalho de equipes de pesquisa de campo.

Tecnologias utilizadas:
- React (Facebook)
- Supabase (Open Source Firebase)
- Dexie (IndexedDB wrapper)
- Vite (Build tool moderno)

---

**Pronto para começar?** 

👉 Leia **INICIO-RAPIDO.md** e comece em 5 minutos!

🚀 **Bom trabalho!**

