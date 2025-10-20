# 📘 Guia Completo: Executar SQL no Supabase

## 🎯 Objetivo

Este guia vai te mostrar **passo a passo** como executar os scripts SQL no Supabase para adicionar as novas funcionalidades:
- ✅ Sistema de fotos de usuários
- ✅ Sistema de aceite/recusa de participação
- ✅ Sistema de áudio + IA

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de que você:
- ✅ Tem uma conta no Supabase
- ✅ Tem um projeto criado no Supabase
- ✅ Tem acesso ao painel administrativo (Dashboard)

---

## 🚀 Passo 1: Acessar o SQL Editor

1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de banco de dados)
4. Você verá um editor de código SQL

![SQL Editor](https://supabase.com/docs/img/sql-editor.png)

---

## 📝 Passo 2: Executar SQL de Fotos de Usuários

### 2.1 - Abrir o arquivo

Abra o arquivo `ADICIONAR-FOTO-USUARIO.sql` no VS Code.

### 2.2 - Copiar o SQL

Copie **TODO** o conteúdo do arquivo (Ctrl+A, Ctrl+C).

### 2.3 - Colar no SQL Editor

Cole no SQL Editor do Supabase (Ctrl+V).

### 2.4 - Executar

Clique no botão **"Run"** (ou pressione Ctrl+Enter).

### 2.5 - Verificar

Você deve ver a mensagem de sucesso:
```
Success. No rows returned
```

E ao final, uma tabela com o resultado:
```
| column_name | data_type |
|-------------|-----------|
| foto_url    | text      |
```

### 2.6 - Criar o Bucket de Avatares

**IMPORTANTE**: O script SQL não cria o bucket automaticamente. Você precisa criar manualmente:

1. No menu lateral, vá em **"Storage"**
2. Clique em **"Create a new bucket"**
3. Preencha:
   - Name: `avatars`
   - Public bucket: **Marque como TRUE** ✅
4. Clique em **"Create bucket"**

✅ **Pronto!** Sistema de fotos configurado.

---

## 📝 Passo 3: Executar SQL de Áudio + IA

### 3.1 - Abrir o arquivo

Abra o arquivo `ADICIONAR-AUDIO-IA.sql` no VS Code.

### 3.2 - Copiar o SQL

Copie **TODO** o conteúdo do arquivo (Ctrl+A, Ctrl+C).

### 3.3 - Colar no SQL Editor

Cole no SQL Editor do Supabase (Ctrl+V).

### 3.4 - Executar

Clique no botão **"Run"** (ou pressione Ctrl+Enter).

### 3.5 - Verificar

Você deve ver a mensagem de sucesso e uma tabela com os novos campos:

```
| column_name                   | data_type |
|-------------------------------|-----------|
| aceite_participacao           | boolean   |
| motivo_recusa                 | text      |
| audio_url                     | text      |
| audio_duracao                 | integer   |
| transcricao_completa          | text      |
| processamento_ia_status       | varchar   |
| processamento_ia_confianca    | jsonb     |
| perguntas_feitas              | jsonb     |
```

### 3.6 - Criar o Bucket de Áudios

**IMPORTANTE**: Crie o bucket para os áudios:

1. No menu lateral, vá em **"Storage"**
2. Clique em **"Create a new bucket"**
3. Preencha:
   - Name: `pesquisas-audio`
   - Public bucket: **Marque como TRUE** ✅ (ou FALSE se quiser privado)
4. Clique em **"Create bucket"**

✅ **Pronto!** Sistema de áudio configurado.

---

## 🔍 Passo 4: Verificar Tabelas

### 4.1 - Ver estrutura da tabela `usuarios`

1. No menu lateral, vá em **"Table Editor"**
2. Selecione a tabela **`usuarios`**
3. Verifique se a coluna `foto_url` aparece

### 4.2 - Ver estrutura da tabela `pesquisas`

1. No menu lateral, vá em **"Table Editor"**
2. Selecione a tabela **`pesquisas`**
3. Verifique se as novas colunas aparecem:
   - `aceite_participacao`
   - `motivo_recusa`
   - `audio_url`
   - `audio_duracao`
   - `transcricao_completa`
   - `processamento_ia_status`
   - `processamento_ia_confianca`
   - `perguntas_feitas`

---

## 🔐 Passo 5: Verificar Políticas de Storage

### 5.1 - Bucket `avatars`

1. Vá em **"Storage"** → Clique no bucket `avatars`
2. Vá na aba **"Policies"**
3. Você deve ver 4 políticas:
   - ✅ Usuários autenticados podem fazer upload
   - ✅ Fotos públicas para leitura
   - ✅ Usuários podem atualizar suas fotos
   - ✅ Usuários podem deletar suas fotos

### 5.2 - Bucket `pesquisas-audio`

1. Vá em **"Storage"** → Clique no bucket `pesquisas-audio`
2. Vá na aba **"Policies"**
3. Você deve ver 3 políticas:
   - ✅ Upload de áudios de pesquisa
   - ✅ Leitura pública de áudios de pesquisa
   - ✅ Deletar áudios de pesquisa

---

## ✅ Checklist Final

Marque quando concluir cada etapa:

- [ ] SQL de fotos executado com sucesso
- [ ] Bucket `avatars` criado
- [ ] Coluna `foto_url` visível na tabela `usuarios`
- [ ] Políticas do bucket `avatars` criadas (4 políticas)
- [ ] SQL de áudio/IA executado com sucesso
- [ ] Bucket `pesquisas-audio` criado
- [ ] Colunas de áudio visíveis na tabela `pesquisas` (8 novas colunas)
- [ ] Políticas do bucket `pesquisas-audio` criadas (3 políticas)

---

## 🐛 Problemas Comuns

### Erro: "relation usuarios does not exist"

**Causa**: A tabela `usuarios` não existe no banco.

**Solução**: Execute primeiro o script `supabase-schema.sql` que cria as tabelas base.

### Erro: "policy already exists"

**Causa**: As políticas já foram criadas anteriormente.

**Solução**: Normal! As políticas já existem. Pode ignorar ou usar `DROP POLICY IF EXISTS` antes.

### Erro: "bucket avatars does not exist"

**Causa**: Você tentou criar políticas antes de criar o bucket.

**Solução**: Crie o bucket primeiro no Storage, depois execute o SQL.

### Não consigo fazer upload de fotos

**Causa**: Bucket não é público OU políticas não foram criadas.

**Solução**:
1. Vá em Storage → avatars
2. Clique nos 3 pontinhos → Edit bucket
3. Marque "Public bucket" como TRUE
4. Verifique se as 4 políticas existem na aba "Policies"

### Gravação de áudio não funciona

**Causa**: Permissões de microfone bloqueadas no navegador.

**Solução**:
1. Clique no cadeado na barra de endereço
2. Permita acesso ao microfone
3. Recarregue a página

---

## 📊 Como Testar

### Testar Fotos

1. Faça login no sistema
2. Vá em "Permissões"
3. Edite um usuário
4. Faça upload de uma foto
5. Vá no Supabase → Table Editor → usuarios
6. Verifique se a coluna `foto_url` foi preenchida

### Testar Aceite/Recusa

1. Crie uma nova pesquisa
2. Preencha endereço
3. Clique "Não aceita"
4. Escolha um motivo (ex: "Sem tempo")
5. Clique "Salvar Recusa"
6. Vá no Supabase → Table Editor → pesquisas
7. Verifique se a pesquisa tem:
   - `aceite_participacao = false`
   - `motivo_recusa = "Sem tempo"`

### Testar Gravação de Áudio

1. Crie uma nova pesquisa
2. Preencha endereço
3. Clique "Sim, aceita"
4. A gravação deve iniciar automaticamente (bolinha vermelha no topo)
5. Marque checkbox "Perguntei" na primeira pergunta
6. Clique "Próxima Pergunta"
7. Repita até o fim
8. Clique "Finalizar"
9. Vá no DevTools → Application → IndexedDB → PortaAPortaDB → pesquisas
10. Verifique se a pesquisa tem:
    - `audioBlob` (Blob do áudio)
    - `audio_duracao` (segundos)
    - `transcricao_completa` (texto)
11. Quando online, o áudio será enviado para o Supabase Storage

---

## 📞 Suporte

Se você encontrar algum problema:

1. **Verifique os logs do navegador** (F12 → Console)
2. **Verifique os logs do Supabase** (Dashboard → Logs)
3. **Re-execute os scripts SQL** se necessário
4. **Limpe o cache do navegador** (Ctrl+Shift+Delete)

---

## 🎉 Pronto!

Se você chegou até aqui e marcou todos os checkboxes, seu sistema está 100% configurado! 🚀

Agora você pode:
- ✅ Fazer upload de fotos de usuários
- ✅ Registrar aceites e recusas de pesquisas
- ✅ Gravar áudio completo das entrevistas
- ✅ Transcrever automaticamente com Web Speech API
- ✅ Ver estatísticas de aceite/recusa
- ✅ (Futuro) Processar áudio com IA Gemini

**Próximos passos**:
- Testar o fluxo completo no navegador
- Configurar API do Gemini (quando estiver pronto)
- Implementar Dashboard com estatísticas
