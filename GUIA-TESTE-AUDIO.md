# 🧪 GUIA DE TESTE - Upload de Áudio

## 📝 Alterações Feitas

### 1. Formulário Reduzido (5 perguntas)
- ✅ Nome do morador
- ✅ Telefone (opcional)
- ✅ Ações sobre custo de vida
- ✅ Problema mais urgente no bairro
- ✅ Comentário final

### 2. Upload de Áudio Implementado
- ✅ Áudio salvo localmente no IndexedDB
- ✅ Áudio enviado para Supabase Storage ao sincronizar
- ✅ URL pública gerada e salva na tabela `pesquisas`

---

## 🚀 Passos para Testar

### 1️⃣ Configurar Supabase

**Execute no SQL Editor:**
```sql
-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-pesquisas',
  'audio-pesquisas',
  true,
  52428800,
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar políticas
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Todos podem ler áudios" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar" ON storage.objects;

CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-pesquisas');

CREATE POLICY "Todos podem ler áudios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-pesquisas');

CREATE POLICY "Usuários autenticados podem atualizar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audio-pesquisas');

CREATE POLICY "Usuários autenticados podem deletar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audio-pesquisas');
```

### 2️⃣ Limpar Banco Local

**Opção A - Pelo Console (F12):**
```javascript
// Cole no Console e execute:
indexedDB.deleteDatabase('contavoto-db');
location.reload();
```

**Opção B - Manualmente:**
1. F12 → Application → Storage → IndexedDB
2. Clique com botão direito em `contavoto-db`
3. Delete database
4. Recarregue a página

### 3️⃣ Deploy das Alterações

```bash
# Fazer commit
git add .
git commit -m "test: formulário reduzido para testes + upload de áudio"

# Push para branch
git push origin new_0

# Merge para develop
git checkout develop
git merge new_0
git push origin develop

# Merge para main (produção)
git checkout main
git merge develop
git push origin main
```

### 4️⃣ Testar no App

1. **Abra o app** (após recarregar)
2. **Verifique o formulário**:
   - Dashboard → deve aparecer "Pesquisa Porta a Porta - TESTE"
   - Deve ter apenas 5 perguntas
3. **Inicie uma pesquisa**:
   - Clique em "Nova Pesquisa"
   - Preencha endereço e bairro
   - Aceite participação
4. **Durante a pesquisa** (FALE ALGO!):
   - ⏺️ Indicador vermelho de gravação deve aparecer
   - Responda as perguntas FALANDO
   - Você verá o cronômetro da gravação
5. **Finalize a pesquisa**
6. **Abra o Console (F12)** e procure por:

```
✅ Gravação finalizada: {
  tamanho: "X.XX MB",
  duracao: "XXs",
  transcricao: "XXX caracteres"
}
📤 Fazendo upload do áudio: audio_...
✅ Áudio enviado: https://...
✅ Pesquisa X inserida com UUID ...
```

### 5️⃣ Verificar no Supabase

**Storage:**
- Supabase → Storage → audio-pesquisas
- Deve ter arquivos `.webm`
- Clique em um e teste o áudio

**Tabela pesquisas:**
```sql
SELECT 
  id,
  nome_entrevistado,
  audio_url,
  audio_duracao,
  LENGTH(transcricao_completa) as tamanho_transcricao,
  created_at
FROM pesquisas 
WHERE audio_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

---

## ✅ Checklist de Teste

- [ ] Bucket `audio-pesquisas` criado no Supabase
- [ ] Políticas de acesso configuradas
- [ ] Banco local limpo (formulário TESTE aparece)
- [ ] Deploy feito (new_0 → develop → main)
- [ ] App recarregado após deploy
- [ ] Nova pesquisa criada
- [ ] Gravação funcionando (indicador vermelho)
- [ ] Perguntas respondidas FALANDO
- [ ] Pesquisa finalizada
- [ ] Console mostra upload do áudio
- [ ] Áudio aparece no Storage do Supabase
- [ ] Registro com `audio_url` na tabela `pesquisas`
- [ ] Áudio reproduz corretamente no Supabase

---

## 🐛 Problemas Comuns

### Gravação não inicia
- Verificar permissão do microfone no navegador
- Chrome: ícone de cadeado → Permissões → Microfone → Permitir

### Upload falha
- Verificar se está online
- Verificar políticas do bucket no Supabase
- Verificar tamanho do arquivo (limite: 50MB)

### Áudio não aparece no Storage
- Verificar nome do bucket: `audio-pesquisas`
- Verificar se bucket é público
- Verificar console para erros

### Transcrição vazia
- Verificar chave da API Gemini em `.env`
- Falar mais alto/claro durante gravação
- Verificar console para erros de transcrição

---

## 📊 Dados Esperados

**Após finalizar 1 pesquisa:**
- IndexedDB: 1 registro em `pesquisas` com `audioBlob`
- Supabase Storage: 1 arquivo `.webm` em `audio-pesquisas`
- Supabase DB: 1 registro com `audio_url` preenchido
- Tamanho do áudio: ~500KB - 5MB (depende da duração)
- Duração típica: 60-180 segundos
- Transcrição: 100-500 caracteres

---

## 🔄 Reverter para Formulário Completo

Quando terminar os testes, edite `src/data/formularioModelo.ts`:

1. Renomeie `formularioPortaAPortaModelo` para `formularioPortaAPortaModeloTeste`
2. Renomeie `formularioPortaAPortaCompleto` para `formularioPortaAPortaModelo`
3. Limpe o banco novamente
4. Recarregue a página
