# 📸 Guia de Implementação - Fotos de Usuários

## 🎯 Resumo
Sistema completo para upload, armazenamento e gerenciamento de fotos de perfil dos usuários usando Supabase Storage.

---

## 📋 Checklist de Configuração

### 1️⃣ Configurar Supabase Storage

1. **Acesse o painel do Supabase:**
   - Vá para https://app.supabase.com
   - Selecione seu projeto

2. **Crie o bucket:**
   - Menu lateral → **Storage**
   - Clique em **"New bucket"**
   - **Name:** `avatars`
   - **Public bucket:** ✅ **TRUE** (importante!)
   - Clique em **Create bucket**

3. **Configure as políticas de segurança:**
   - Vá para **SQL Editor**
   - Execute o arquivo `ADICIONAR-FOTO-USUARIO.sql`

---

### 2️⃣ Atualizar Banco de Dados

Execute no SQL Editor do Supabase:

```sql
-- Adicionar coluna foto_url
ALTER TABLE usuarios 
ADD COLUMN foto_url TEXT;
```

✅ **Pronto!** A coluna está criada.

---

## 🔧 Como Usar no Código

### Exemplo 1: Upload de Foto na Página de Perfil

```tsx
import { useState } from 'react';
import { trocarFotoUsuario } from '../services/storageService';

export const PerfilPage = () => {
  const [uploading, setUploading] = useState(false);
  const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    const resultado = await trocarFotoUsuario(
      file, 
      usuarioLogado.id,
      usuarioLogado.foto_url // URL da foto antiga (para deletar)
    );

    if (resultado.sucesso) {
      alert('Foto atualizada com sucesso!');
      // Atualizar localStorage
      const novoUsuario = { ...usuarioLogado, foto_url: resultado.url };
      localStorage.setItem('usuario', JSON.stringify(novoUsuario));
      localStorage.setItem('user', JSON.stringify(novoUsuario));
      window.location.reload();
    } else {
      alert(`Erro: ${resultado.erro}`);
    }

    setUploading(false);
  };

  return (
    <div>
      <h1>Meu Perfil</h1>
      
      {/* Preview da foto atual */}
      <div style={{ marginBottom: '20px' }}>
        <img 
          src={usuarioLogado.foto_url || '/default-avatar.png'} 
          alt="Foto de perfil"
          style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%',
            objectFit: 'cover' 
          }}
        />
      </div>

      {/* Input de upload */}
      <label htmlFor="foto-upload" className="btn btn-primary">
        {uploading ? 'Enviando...' : 'Alterar Foto'}
      </label>
      <input
        id="foto-upload"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: 'none' }}
      />
    </div>
  );
};
```

---

### Exemplo 2: Exibir Foto na Lista de Usuários

```tsx
// Em PermissionsPage.tsx ou qualquer lista de usuários

{usuarios.map(usuario => (
  <div key={usuario.id} className="user-card">
    {/* Avatar com foto */}
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {usuario.foto_url ? (
        <img 
          src={usuario.foto_url} 
          alt={usuario.nome}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
        />
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#6b7280"/>
        </svg>
      )}
    </div>
    
    <div>
      <div>{usuario.nome}</div>
      <div>{usuario.telefone}</div>
    </div>
  </div>
))}
```

---

### Exemplo 3: Upload na Página de Registro

```tsx
// Em RegisterPage.tsx

const [fotoFile, setFotoFile] = useState<File | null>(null);
const [fotoPreview, setFotoPreview] = useState<string>('');

const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setFotoFile(file);
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleRegistrar = async () => {
  // ... criar usuário primeiro ...
  
  const { data: novoUsuario, error } = await supabase
    .from('usuarios')
    .insert([{ nome, telefone, senha, tipo_usuario_id }])
    .select()
    .single();

  if (novoUsuario && fotoFile) {
    // Fazer upload da foto
    const resultado = await trocarFotoUsuario(fotoFile, novoUsuario.id);
    if (!resultado.sucesso) {
      console.error('Erro ao fazer upload da foto:', resultado.erro);
    }
  }
};

// No JSX:
<div className="form-group">
  <label>Foto de Perfil (opcional)</label>
  
  {fotoPreview && (
    <div style={{ marginBottom: '12px' }}>
      <img 
        src={fotoPreview} 
        alt="Preview"
        style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%',
          objectFit: 'cover' 
        }}
      />
    </div>
  )}
  
  <input
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/webp"
    onChange={handleFotoChange}
  />
</div>
```

---

## 🎨 Exemplo de Avatar Circular Completo

```tsx
interface AvatarProps {
  fotoUrl?: string;
  nome: string;
  tamanho?: number;
}

export const Avatar = ({ fotoUrl, nome, tamanho = 48 }: AvatarProps) => {
  const iniciais = nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div
      style={{
        width: `${tamanho}px`,
        height: `${tamanho}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#20B2AA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${tamanho / 2.5}px`
      }}
    >
      {fotoUrl ? (
        <img 
          src={fotoUrl} 
          alt={nome}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
          onError={(e) => {
            // Fallback se a imagem não carregar
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{iniciais}</span>
      )}
    </div>
  );
};

// Uso:
<Avatar fotoUrl={usuario.foto_url} nome={usuario.nome} tamanho={48} />
```

---

## 📊 Estrutura de URLs

### URL Pública da Foto:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/avatars/usuario_123_1729259123456.jpg
```

### Estrutura no Storage:
```
avatars/
  ├── usuario_1_1729259123456.jpg
  ├── usuario_2_1729259456789.png
  └── usuario_3_1729259789012.webp
```

---

## 🔒 Segurança e Validações

O `storageService.ts` já inclui:

✅ **Validação de tipo:** Apenas JPG, PNG, WebP  
✅ **Validação de tamanho:** Máximo 5MB  
✅ **Nome único:** Timestamp + ID do usuário  
✅ **Cleanup:** Deleta foto antiga ao trocar  
✅ **Rollback:** Deleta nova foto se falhar atualização no banco  

---

## 🧪 Testar Upload

1. **Teste manual:**
   - Implemente o upload em uma página
   - Selecione uma foto
   - Verifique no Storage do Supabase se apareceu
   - Verifique na tabela `usuarios` se salvou a URL

2. **Verificar no SQL Editor:**
```sql
SELECT id, nome, foto_url FROM usuarios WHERE foto_url IS NOT NULL;
```

3. **Testar URL pública:**
   - Copie a URL da coluna `foto_url`
   - Cole no navegador
   - Deve mostrar a imagem

---

## 📝 Próximos Passos

1. ✅ Criar bucket `avatars` no Supabase
2. ✅ Executar `ADICIONAR-FOTO-USUARIO.sql`
3. ⏳ Adicionar input de foto na página de registro
4. ⏳ Adicionar upload de foto na página de perfil/configurações
5. ⏳ Atualizar componente Avatar na lista de usuários
6. ⏳ Atualizar header da HomePage para mostrar foto do usuário

---

## 🆘 Problemas Comuns

**❌ Erro: "new row violates row-level security policy"**
- Solução: Verifique se executou as políticas do SQL
- Verifique se o bucket está como **Public: TRUE**

**❌ Foto não aparece (404)**
- Solução: Verifique se o bucket é público
- Tente acessar a URL diretamente no navegador

**❌ Upload muito lento**
- Solução: Redimensione a imagem antes do upload
- Use WebP para melhor compressão

**❌ Erro: "Payload too large"**
- Solução: A imagem está maior que 5MB
- Comprima antes de fazer upload

---

## 💡 Dicas de Otimização

1. **Redimensionar imagens antes do upload:**
```tsx
// Usar biblioteca como 'browser-image-compression'
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 800,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
```

2. **Lazy loading de imagens:**
```tsx
<img src={foto_url} alt={nome} loading="lazy" />
```

3. **Placeholder enquanto carrega:**
```tsx
<img 
  src={foto_url} 
  alt={nome}
  onLoad={(e) => e.currentTarget.classList.add('loaded')}
  style={{ opacity: 0, transition: 'opacity 0.3s' }}
/>
```

---

## ✅ Conclusão

Agora você tem:
- ✅ Storage configurado no Supabase
- ✅ Coluna `foto_url` na tabela `usuarios`
- ✅ Serviço completo de upload (`storageService.ts`)
- ✅ Interface atualizada (`authService.ts`)
- ✅ Exemplos de implementação

**Próximo passo:** Escolha onde quer adicionar o upload primeiro (Registro, Perfil ou Edição de Usuário) e implemente! 🚀
