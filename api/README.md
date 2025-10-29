# API de Transcrição com Whisper

API Node.js que transcreve áudios usando Whisper (@xenova/transformers).

## Setup

1. Instalar dependências:
```bash
cd api
npm install
```

2. Criar arquivo `.env` (copiar de `.env.example`):
```bash
cp .env.example .env
```

3. Rodar servidor:
```bash
npm run dev    # desenvolvimento (com nodemon)
npm start      # produção
```

## Uso

**Endpoint:** `POST /api/transcribe`

**Body:**
```json
{
  "audio_url": "https://seu-storage.supabase.co/audio.webm",
  "pesquisa_id": "uuid-da-pesquisa"
}
```

**Resposta de sucesso (200):**
```json
{
  "success": true,
  "texto": "Transcrição completa do áudio...",
  "confianca": 85,
  "duracao": 120.5
}
```

**Resposta de erro (500):**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## Detalhes Técnicos

- **Modelo:** Xenova/whisper-small (~500MB, baixado automaticamente na primeira execução)
- **Linguagem:** Português (configurado no código)
- **Performance:** ~2-5x tempo real (ex: áudio de 1min transcreve em 2-5min em CPU comum)
- **Requisitos:** Node.js >= 18, ~1GB RAM

## Deploy

### Vercel / Netlify Functions
Arquivos já prontos para deploy como serverless function.

### VPS / Servidor próprio
```bash
pm2 start server.js --name transcription-api
```

### Docker (opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## Troubleshooting

**Erro: "Model download failed"**
- Certifique-se de ter conexão com internet na primeira execução
- O modelo será baixado para `~/.cache/huggingface/`

**Lento demais:**
- Considere usar modelo menor ou upgrade de CPU
- Em produção, use cache e fila para evitar timeout
