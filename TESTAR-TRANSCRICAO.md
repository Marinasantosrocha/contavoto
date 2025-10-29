# Como Testar a Transcrição Pós-Sincronização

## Setup Inicial (faça uma vez)

### 1. Instalar API de Transcrição

```powershell
cd api
npm install
```

### 2. Iniciar servidor de transcrição

```powershell
npm run dev
```

Aguarde aparecer: `🚀 API de Transcrição rodando em http://localhost:3001`

### 3. Configurar frontend

Crie/edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_TRANSCRIPTION_API_URL=http://localhost:3001/api/transcribe
```

### 4. Atualizar schema do Supabase

No SQL Editor do Supabase, execute o conteúdo do arquivo `ADICIONAR-STT-STATUS.sql`

### 5. Iniciar frontend

```powershell
npm run dev
```

---

## Teste 1: Pesquisa Online com Transcrição

**Objetivo**: Verificar que transcrição acontece após upload

1. Abra o app no navegador
2. Crie uma nova pesquisa
3. Aceite participar
4. Fale algo no microfone (ex: "Teste de transcrição")
5. Finalize a pesquisa
6. **Observe o console do navegador**:
   - `📤 Fazendo upload do áudio...`
   - `✅ Áudio enviado: [url]`
   - `🎙️ Iniciando transcrição via Whisper...`
   - `✅ Transcrição concluída: [X] caracteres`
   - `🧠 Processando com Gemini...`
7. **Console da API** deve mostrar:
   - `🎙️ Iniciando transcrição da pesquisa [id]`
   - `📥 Baixando áudio: [url]`
   - `✅ Áudio baixado`
   - `🧠 Transcrevendo com Whisper...`
   - `✅ Transcrição concluída`

**Sucesso**: Transcrição aparece na lista de pesquisas

---

## Teste 2: Pesquisa Offline → Sincronização

**Objetivo**: Simular pesquisa offline e transcrição na sync

1. Abra DevTools > Network > **Desative "Online"** (modo offline)
2. Crie uma nova pesquisa
3. Grave áudio normalmente
4. Finalize (será salvo localmente)
5. **Reative "Online"**
6. Aguarde 2-5 segundos (AutoSync dispara automaticamente)
7. Observe os mesmos logs do Teste 1

**Sucesso**: Pesquisa offline é sincronizada e transcrita automaticamente

---

## Teste 3: Verificar Status de Transcrição

1. Abra IndexedDB no DevTools:
   - Application > Storage > IndexedDB > PortaAPortaDB > pesquisas
2. Encontre a pesquisa recente
3. Verifique os campos:
   - `audio_url`: deve ter URL do Supabase
   - `transcricao_completa`: deve ter o texto transcrito
   - `stt_status`: deve ser `"concluido"`
   - `processamento_ia_status`: deve ser `"concluido"`

---

## Teste 4: Erro de Transcrição (Simulado)

**Objetivo**: Verificar tratamento de erro

1. **Pare o servidor da API** (Ctrl+C no terminal da API)
2. Crie e finalize uma nova pesquisa online
3. Console deve mostrar:
   - `❌ Erro na tentativa 1: [erro]`
   - `⏳ Aguardando 5s antes de tentar novamente...`
   - (repete 3 vezes)
4. IndexedDB deve mostrar:
   - `stt_status`: `"erro"`
   - `stt_erro`: mensagem do erro

**Sucesso**: App continua funcionando mesmo com API indisponível

---

## Verificações Rápidas

### API está rodando?

```powershell
curl http://localhost:3001/health
```

Resposta esperada: `{"status":"ok","service":"transcription-api"}`

### Modelo Whisper foi baixado?

Primeira execução baixa ~500MB. Verifique em:
- Windows: `%USERPROFILE%\.cache\huggingface\`
- Linux/Mac: `~/.cache/huggingface/`

### Ver logs da API em tempo real

No terminal onde você rodou `npm run dev` na pasta `api/`

---

## Troubleshooting Comum

### "API not available" no console

- Certifique-se de que `npm run dev` está rodando na pasta `api/`
- Verifique que `VITE_TRANSCRIPTION_API_URL` está correto no `.env`

### Transcrição muito lenta

- Normal na primeira vez (baixando modelo)
- Áudios longos demoram mais (2-5x o tempo do áudio)
- Verifique CPU do computador (Whisper usa bastante)

### "Module not found"

```powershell
cd api
rm -rf node_modules
npm install
```

### Modelo não baixa

- Certifique-se de ter conexão com internet
- Espaço em disco: precisa de ~1GB livre
- Firewall: libere acesso a `huggingface.co`

---

## Próximos Passos

Após validar que funciona:

1. **Deploy da API**:
   - Ver `GUIA-TRANSCRICAO-WHISPER.md` seção "Deploy em Produção"
   - Atualizar `VITE_TRANSCRIPTION_API_URL` com URL pública

2. **UI de Status**:
   - Implementar badges na listagem de pesquisas
   - Mostrar progresso de transcrição
   - Botão para retentar em caso de erro

3. **Monitoramento**:
   - Logs de performance (tempo médio por áudio)
   - Taxa de sucesso/erro
   - Alertas se API ficar offline

---

## Dúvidas?

Consulte a documentação completa: `GUIA-TRANSCRICAO-WHISPER.md`
