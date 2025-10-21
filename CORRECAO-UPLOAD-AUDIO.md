# 🎙️ CORREÇÃO: Upload de Áudio de Pesquisas

## 🐛 Problema Identificado

Os áudios gravados durante as pesquisas **NÃO estavam sendo enviados para o Supabase**.

### O que estava acontecendo:

1. ✅ Áudio gravado localmente com sucesso
2. ✅ Áudio salvo no IndexedDB (navegador)
3. ❌ **Áudio NÃO era enviado** para o Supabase Storage
4. ❌ **Campos de áudio NÃO eram salvos** na tabela `pesquisas`

### Por quê?

O método `sincronizarPesquisas()` em `pesquisaService.ts` estava sincronizando:
- ✅ Dados da pesquisa (endereço, respostas, etc.)
- ❌ **Mas NÃO o audioBlob**

---

## ✅ Solução Implementada

### 1. Atualizado `pesquisaService.ts`

Adicionado na função `sincronizarPesquisas()`:

```typescript
// 🎙️ UPLOAD DO ÁUDIO SE EXISTIR
let audioUrl: string | undefined;

if (pesquisa.audioBlob && pesquisa.uuid) {
  try {
    const timestamp = new Date().getTime();
    const fileName = `audio_${pesquisa.uuid}_${timestamp}.webm`;
    
    console.log(`📤 Fazendo upload do áudio: ${fileName}`);
    
    const { error: uploadError } = await supabase
      .storage
      .from('audio-pesquisas')
      .upload(fileName, pesquisa.audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erro ao fazer upload do áudio:', uploadError);
    } else {
      // Gerar URL pública
      const { data: urlData } = supabase
        .storage
        .from('audio-pesquisas')
        .getPublicUrl(fileName);
      
      audioUrl = urlData.publicUrl;
      console.log(`✅ Áudio enviado: ${audioUrl}`);
    }
  } catch (audioError) {
    console.error('❌ Erro no processo de upload:', audioError);
  }
}
```

### 2. Campos de áudio adicionados ao UPDATE/INSERT

```typescript
// Adicionar campos de áudio se existirem
if (audioUrl) {
  updateData.audio_url = audioUrl;
}
if (pesquisa.audio_duracao) {
  updateData.audio_duracao = pesquisa.audio_duracao;
}
if (pesquisa.transcricao_completa) {
  updateData.transcricao_completa = pesquisa.transcricao_completa;
}
if (pesquisa.processamento_ia_status) {
  updateData.processamento_ia_status = pesquisa.processamento_ia_status;
}
```

---

## 🔧 Configuração Necessária no Supabase

### Execute o SQL no Supabase SQL Editor:

```sql
-- Criar bucket de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-pesquisas',
  'audio-pesquisas',
  true,
  52428800,  -- 50MB
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-pesquisas');

CREATE POLICY "Todos podem ler áudios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-pesquisas');
```

**📄 Arquivo completo:** `CRIAR-BUCKET-AUDIO.sql`

---

## 📊 Fluxo Completo Após Correção

### Durante a Pesquisa:
1. Usuário inicia pesquisa
2. Gravação de áudio inicia automaticamente
3. Usuário responde perguntas
4. Usuário finaliza pesquisa

### No `handleFinalizar()`:
5. Gravação é interrompida
6. `audioBlob` é salvo no IndexedDB local
7. Campos salvos:
   - `audioBlob` (Blob)
   - `audio_duracao` (número em segundos)
   - `transcricao_completa` (string)
   - `processamento_ia_status: 'pendente'`
   - `sincronizado: false`

### Na Sincronização:
8. Quando online, `sincronizarPesquisas()` é chamado
9. **🆕 Upload do áudio** para Supabase Storage
10. Recebe `audio_url` público
11. **🆕 Salva na tabela `pesquisas`:**
    - `audio_url`
    - `audio_duracao`
    - `transcricao_completa`
    - `processamento_ia_status`
12. Marca `sincronizado: true`

---

## 🧪 Como Testar

### 1. Deploy das Alterações

```bash
git add .
git commit -m "fix: adicionar upload de áudio para Supabase Storage"
git push
```

### 2. Configurar Supabase

- Acesse Supabase SQL Editor
- Execute o script `CRIAR-BUCKET-AUDIO.sql`
- Verifique se o bucket foi criado em Storage

### 3. Testar no App

1. Abra o app
2. Inicie uma nova pesquisa
3. Responda algumas perguntas (fale algo)
4. Finalize a pesquisa
5. **Abra o Console (F12)**
6. Procure por:
   - `✅ Gravação finalizada` (com tamanho do áudio)
   - `📤 Fazendo upload do áudio: audio_...`
   - `✅ Áudio enviado: https://...`

### 4. Verificar no Supabase

**Storage:**
- Storage → audio-pesquisas
- Deve haver arquivos `.webm`

**Tabela pesquisas:**
```sql
SELECT 
  id, 
  nome_entrevistado,
  audio_url,
  audio_duracao,
  LENGTH(transcricao_completa) as tamanho_transcricao
FROM pesquisas 
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🎯 Resultado Esperado

Após a correção:
- ✅ Áudio gravado localmente (IndexedDB)
- ✅ Áudio enviado para Supabase Storage
- ✅ URL pública gerada
- ✅ Campos salvos na tabela `pesquisas`:
  - `audio_url`: URL pública do áudio
  - `audio_duracao`: duração em segundos
  - `transcricao_completa`: texto transcrito pela IA
  - `processamento_ia_status`: 'pendente'

---

## 📝 Notas

- Formato de áudio: `audio/webm` (formato otimizado para web)
- Limite de tamanho: 50MB por arquivo
- Nome do arquivo: `audio_{uuid}_{timestamp}.webm`
- Bucket público para facilitar acesso
- Upload apenas quando online
- Fallback: áudio fica salvo localmente até conseguir sincronizar
