# 📋 Manual do Entrevistador - PORTA A PORTA

## 🎯 Bem-vindo!

Este manual vai te ensinar tudo que você precisa saber para usar o app **PORTA A PORTA** e fazer pesquisas de campo com eficiência.

## 📱 Preparação Antes de Sair

### 1. Equipamento Necessário

- ✅ Celular, tablet ou notebook
- ✅ Bateria carregada (recomendado: bateria externa)
- ✅ App PORTA A PORTA aberto no navegador
- ✅ Papel e caneta (backup)
- ✅ Identificação visual (crachá, camiseta, etc.)

### 2. Configuração Inicial

1. Abra o app: `http://localhost:5173` ou URL do servidor
2. Na primeira vez, digite seu nome completo
3. O app salvará seu nome para próximas pesquisas

## 🚪 Como Fazer uma Pesquisa

### Passo 1: Antes de Tocar a Campainha

1. **Na tela inicial**, localize:
   - Seu nome já deve estar preenchido
   - Formulário selecionado: "Pesquisa Porta a Porta"

2. **Preencha os dados de localização**:
   - **Endereço**: Nome da rua/avenida
   - **Bairro**: Nome do bairro
   - **Cidade**: Nome da cidade
   - *(Opcional)* Número da casa
   - *(Opcional)* Ponto de referência

3. **Clique em "Iniciar Pesquisa"**

> 💡 **IMPORTANTE**: Sempre preencha esses dados ANTES de tocar a campainha!

### Passo 2: Abordagem

1. O app mostrará o **script de abordagem**
2. **Leia com atenção** antes de tocar a campainha
3. Toque a campainha e:
   - Cumprimente: "Bom dia! Tudo bem?"
   - Apresente-se
   - Explique o motivo da visita
   - Peça permissão para fazer as perguntas

### Passo 3: Coleta de Dados

#### Interface da Pesquisa

```
┌─────────────────────────────┐
│ ❌ Cancelar  Nome do Form.  │
│ 📍 Rua X, Bairro Y         │
├─────────────────────────────┤
│ Progresso: [████░░░] 5/25  │
├─────────────────────────────┤
│                             │
│  Pergunta aparece aqui      │
│                             │
│  [  Campo de resposta  ]    │
│                             │
├─────────────────────────────┤
│ ⬅️ Anterior    Próximo ➡️  │
└─────────────────────────────┘
```

#### Como Responder

- 📝 **Perguntas de Texto**: Digite a resposta
- 📞 **Telefone**: Digite no formato (XX) XXXXX-XXXX
- ⭕ **Múltipla Escolha**: Toque na opção correta
- ☑️ **Checkbox**: Selecione uma ou mais opções
- 📄 **Texto Longo**: Use o campo grande para respostas detalhadas

#### Navegação

- **Próximo ➡️**: Avança para próxima pergunta
- **⬅️ Anterior**: Volta para pergunta anterior
- **❌ Cancelar**: Cancela a pesquisa (pede confirmação)

#### Perguntas Condicionais

Algumas perguntas só aparecem baseado em respostas anteriores:

**Exemplo**:
```
❓ Tem filhos?
   ( ) Sim  ( ) Não

Se responder "Sim", aparece:
❓ Quantos filhos?
   ( ) 1  ( ) 2 a 3  ( ) 4 ou mais
```

### Passo 4: Finalização

1. Após responder todas as perguntas, aparece a **tela de encerramento**
2. **Leia o script final** para o entrevistado
3. Agradeça a participação
4. Clique em "🏁 Finalizar e Voltar"

## 📊 Gerenciando Suas Pesquisas

### Ver Pesquisas Realizadas

1. Na tela inicial, clique em "📊 Ver Pesquisas Realizadas"
2. Você verá todas as pesquisas com:
   - ✅ **Finalizadas**: Completas e prontas
   - ⏳ **Em Andamento**: Começou mas não terminou
   - ⚠️ **Não Sincronizado**: Ainda não foi para o servidor

### Continuar Pesquisa Incompleta

1. Na lista, encontre pesquisas "Em Andamento"
2. Clique em "✏️ Continuar"
3. Continue de onde parou

### Excluir Pesquisa

1. Na lista, clique no botão **🗑️**
2. Confirme a exclusão
3. A pesquisa será removida

## 🌐 Conexão e Sincronização

### Status da Conexão

No topo do app, você vê:
- 🌐 **Online**: Conectado à internet
- 📵 **Offline**: Sem conexão

### Como Funciona Offline

✅ **O que funciona SEM internet**:
- Iniciar novas pesquisas
- Responder todas as perguntas
- Finalizar pesquisas
- Ver lista de pesquisas
- Continuar pesquisas em andamento

❌ **O que NÃO funciona SEM internet**:
- Sincronizar com servidor
- Baixar novos formulários

### Sincronização

**Automática**:
- O app sincroniza automaticamente quando detecta conexão

**Manual**:
- Clique em "🔄 Sincronizar Dados" na tela inicial
- Aguarde a mensagem de confirmação

### Contador de Não Sincronizadas

Na tela inicial, você vê quantas pesquisas ainda não foram sincronizadas:
```
┌──────────────────────┐
│ Não Sincronizadas: 3 │  ◄── Precisa sincronizar!
└──────────────────────┘
```

## ⚠️ Problemas Comuns

### "Campo obrigatório"

**Problema**: Não consigo avançar  
**Solução**: Preencha o campo marcado com asterisco (*) vermelho

### Pesquisa sumiu

**Problema**: Não vejo minha pesquisa na lista  
**Solução**: 
1. Verifique o filtro (Todas / Em Andamento / Finalizadas)
2. Role a página para baixo

### App travou

**Problema**: App não responde  
**Solução**:
1. Recarregue a página (F5 ou puxe para baixo)
2. Seus dados estão salvos! Não se preocupe

### Não sincroniza

**Problema**: Dados não vão para o servidor  
**Solução**:
1. Verifique se está online (🌐)
2. Clique em "🔄 Sincronizar Dados"
3. Se persistir, avise o coordenador

## 📈 Estatísticas

Na tela inicial, acompanhe seu desempenho:

```
┌─────────────────────────┐
│  Total: 45             │  ◄── Total de pesquisas
│  Finalizadas: 42       │  ◄── Completas
│  Em Andamento: 3       │  ◄── Incompletas
│  Não Sincronizadas: 5  │  ◄── Offline
└─────────────────────────┘
```

## 🎯 Dicas de Produtividade

### 1. Planeje sua Rota

- Trace um roteiro no mapa
- Evite voltar nas mesmas ruas
- Agrupe por bairro

### 2. Horários Ideais

- **Manhã**: 9h - 12h
- **Tarde**: 14h - 18h
- **Noite**: 19h - 21h
- Evite: horário de almoço (12h-14h)

### 3. Economize Bateria

- Diminua o brilho da tela
- Feche outros apps
- Use modo avião quando não precisar de GPS

### 4. Sincronize Regularmente

- Sempre que voltar para área com Wi-Fi
- No fim do dia
- Antes de desligar o celular

### 5. Faça Backup

- Anote dados importantes em papel também
- Tire foto da tela em casos especiais

## 🆘 Contatos de Suporte

Se precisar de ajuda:

- 📞 **Coordenador**: [INSERIR NÚMERO]
- 📧 **Email**: [INSERIR EMAIL]
- 💬 **WhatsApp**: [INSERIR NÚMERO]

---

## ✅ Checklist Diário

**Antes de Sair**:
- [ ] Celular carregado
- [ ] App aberto e funcionando
- [ ] Seu nome configurado
- [ ] Identificação visual
- [ ] Papel e caneta

**Durante o Trabalho**:
- [ ] Preencher localização ANTES de tocar campainha
- [ ] Usar script de abordagem
- [ ] Preencher todos os campos obrigatórios
- [ ] Ler script de encerramento
- [ ] Finalizar pesquisa

**Fim do Dia**:
- [ ] Sincronizar todas as pesquisas
- [ ] Verificar pesquisas em andamento
- [ ] Reportar ao coordenador
- [ ] Carregar equipamentos

---

**Bom trabalho e boa sorte com as pesquisas!** 🚀









