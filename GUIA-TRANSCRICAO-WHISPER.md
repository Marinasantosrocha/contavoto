# Transcrição Automática com Whisper

Sistema de transcrição automática pós-sincronização usando Whisper (gratuito).

## Como Funciona

1. **Durante a gravação**: Web Speech API transcreve em tempo real (quando disponível)
2. **Após finalizar**: Áudio é salvo localmente
3. **Na sincronização**: 
   - Áudio é enviado para Supabase Storage
   - API Whisper transcreve o áudio (se não houver transcrição)
   - Transcrição é salva no banco
   - IA processa as respostas

## Setup da API de Transcrição

### 1. Instalar dependências

```bash
cd api
npm install
```

### 2. Configurar variáveis de ambiente

Crie o arquivo `api/.env`:

```env
PORT=3001
```

### 3. Iniciar servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:3001`

### 4. Configurar frontend

No arquivo `.env` do frontend, adicione:

```env
VITE_TRANSCRIPTION_API_URL=http://localhost:3001/api/transcribe
```

### 5. Atualizar schema do Supabase

Execute o arquivo `ADICIONAR-STT-STATUS.sql` no SQL Editor do Supabase.

## Fluxo Completo

```
┌─────────────┐
│   Gravar    │
│   Áudio     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Finalizar  │
│  Pesquisa   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Sincronizar │
│   (Online)  │
└──────┬──────┘
       │
       ├─────▶ Upload Áudio → Supabase Storage
       │
       ▼
┌─────────────┐
│ Transcrever │ ◀── API Whisper (Node.js)
│   Áudio     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Processar  │
│   com IA    │
└─────────────┘
```

## Estados de Transcrição

| Status | Descrição |
|--------|-----------|
| `nao_iniciado` | Sem áudio ou aguardando sync |
| `pendente` | Áudio enviado, aguardando transcrição |
| `processando` | API Whisper transcrevendo |
| `concluido` | Transcrição finalizada |
| `erro` | Falha na transcrição (ver stt_erro) |

## Performance

- **Modelo**: Whisper Small (~500MB)
- **Velocidade**: ~2-5x tempo real (CPU comum)
  - Áudio de 1min → 2-5min de processamento
  - Áudio de 5min → 10-25min de processamento
- **Precisão**: ~85-95% (português brasileiro)

## Deploy em Produção

### Opção 1: VPS/Servidor

```bash
# Instalar PM2
npm install -g pm2

# Iniciar API
cd api
pm2 start server.js --name transcription-api

# Autostart no boot
pm2 startup
pm2 save
```

### Opção 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY api/package*.json ./
RUN npm ci --only=production
COPY api/ .
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
docker build -t transcription-api .
docker run -d -p 3001:3001 --name transcription transcription-api
```

### Opção 3: Serverless (Vercel/Netlify)

Os arquivos já estão prontos para deploy como functions:
- `api/transcribe.js` é compatível com Vercel Functions
- Limite: 10s de timeout (pode não ser suficiente para áudios longos)

## Troubleshooting

### "API not available"
- Certifique-se de que o servidor está rodando: `curl http://localhost:3001/health`
- Verifique a variável `VITE_TRANSCRIPTION_API_URL` no `.env`

### "Model download failed"
- Primeira execução baixa o modelo (~500MB)
- Certifique-se de ter conexão com internet
- Modelo é salvo em `~/.cache/huggingface/`

### Transcrição muito lenta
- Normal em CPUs modestas (2-5x tempo real)
- Considere upgrade de CPU ou usar GPU (requer setup adicional)
- Em produção, use fila para evitar timeout

### Erro "no such file or directory"
- Certifique-se de ter permissões de escrita em `/tmp`
- Em serverless, use `/tmp` para arquivos temporários

## Alternativas

### Usar GPU (mais rápido)

Requer instalação adicional:

```bash
# Instalar whisper.cpp com GPU
# Ver: https://github.com/ggerganov/whisper.cpp
```

### Usar modelo maior (mais preciso)

No `api/transcribe.js`, altere:

```javascript
// Modelo pequeno (padrão): Xenova/whisper-small
// Modelo médio: Xenova/whisper-medium
// Modelo grande: Xenova/whisper-large-v2

transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-medium', {
  language: 'portuguese',
  task: 'transcribe',
});
```

**Atenção**: Modelos maiores são mais lentos e consomem mais RAM.

## Monitoramento

Logs da API:

```bash
# PM2
pm2 logs transcription-api

# Docker
docker logs -f transcription

# Desenvolvimento
# Logs aparecem no console onde rodou `npm run dev`
```

## Custos

- **Modelo Whisper**: Gratuito (open-source)
- **Servidor**: Somente custo de hospedagem/VPS
- **Sem cobrança por uso/API calls**

Comparação com alternativas pagas:
- Google Speech-to-Text: ~$0.006/15s
- AWS Transcribe: ~$0.0004/s
- Whisper self-hosted: $0 (só servidor)
