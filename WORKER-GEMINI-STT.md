# 🎤 Transcrição com Gemini 2.5 Flash

## 💰 Por que usar Gemini em vez de Whisper?

| Recurso | Whisper (OpenAI) | Gemini 2.5 Flash |
|---------|------------------|------------------|
| **Preço** | $0.006/min | **Muito mais barato** |
| **Quota Grátis** | Limitada | **250 req/dia** |
| **Velocidade** | Rápido | **Muito rápido** |
| **Qualidade** | Excelente | **Excelente** |
| **Processamento IA** | Precisa de 2 APIs | **Tudo em 1 API** |

## ⚙️ Como configurar

### 1. Editar o arquivo `.env`

Altere a variável `STT_PROVIDER` de `openai` para `gemini`:

```env
# Transcrição de áudio
STT_PROVIDER=gemini  # ← Altere aqui (antes era 'openai')

# API Keys
GEMINI_API_KEY=sua_chave_aqui
# OPENAI_API_KEY=sua_chave_aqui  # ← Pode comentar se não usar mais
```

### 2. Reiniciar o worker

```bash
# Parar o worker atual (Ctrl+C)
# Depois rodar:
npm run worker:stt
```

Você verá no console:

```
STT Worker iniciado. Provider: gemini
Gemini habilitado. Modelo selecionado: gemini-2.5-flash | modo: auto
🎤 Transcrição: Gemini | 🤖 IA: Gemini
```

## 🎯 Fluxo de processamento

### Com Gemini (1 API):
1. **Áudio** → Gemini transcreve → **Texto**
2. **Texto** → Gemini processa → **Respostas estruturadas**

### Com Whisper (2 APIs):
1. **Áudio** → Whisper transcreve → **Texto**
2. **Texto** → Gemini processa → **Respostas estruturadas**

## 📊 Quota e limites

### Gemini Free Tier (sem billing):
- **250 requisições/dia**
- **Cada áudio = 2 requisições** (1 transcrição + 1 processamento IA)
- **Total: ~125 pesquisas/dia**

### Com Billing (créditos adicionados):
- ✅ **Quota gratuita esgotada?** → Usa créditos automaticamente
- ✅ **Sem limite diário** (só depende do saldo)
- ✅ **Muito mais barato que Whisper**
- 💰 **Preço por requisição**: Consulte [Google AI Pricing](https://ai.google.dev/pricing)

### Como adicionar créditos:
1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Vá em **Billing**
3. Adicione método de pagamento
4. Pronto! Quota ilimitada (paga por uso)

## 🔄 Voltar para Whisper

Se quiser voltar para Whisper, é só alterar o `.env`:

```env
STT_PROVIDER=openai
```

E reiniciar o worker.

## 🐛 Troubleshooting

### Erro: "GEMINI_API_KEY não definido"
- Verifique se o `.env` tem a chave `GEMINI_API_KEY`
- Reinicie o worker após adicionar

### Erro: "429 Quota exceeded"
- **Sem billing**: Você atingiu o limite de 250 req/dia → Espere 24h ou adicione billing
- **Com billing**: Verifique se há saldo suficiente na conta → Adicione mais créditos

### Erro: "Gemini STT HTTP 400"
- Verifique se o formato do áudio é suportado (webm, mp3, wav, m4a, ogg)
- Verifique se o arquivo não está corrompido

## ✅ Vantagens do Gemini

1. **Mais barato** 💰
2. **Quota maior** (250/dia vs limitado)
3. **Tudo em 1 API** (menos complexidade)
4. **Suporta múltiplos formatos** de áudio
5. **Processamento mais rápido** (menos latência de rede)

---

**Pronto!** Agora você está usando Gemini para transcrever E processar as entrevistas! 🎉

