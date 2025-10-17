# 🚀 PORTA A PORTA - Guia de Teste Isolado

## 📋 Como Testar sem Interferir no Outro Projeto

### 🎯 **Status Atual:**
- ✅ **Porta Fixa**: 3004 (não interfere com outros projetos)
- ✅ **Projeto Isolado**: Funciona independentemente
- ✅ **PWA Completo**: Gravação + Geolocalização + Autenticação

---

## 🌐 **URLs para Teste:**

### **Desenvolvimento:**
```
http://localhost:3004/
```

### **Produção (se necessário):**
```
http://localhost:4173/
```

---

## 🔧 **Funcionalidades para Testar:**

### 1. **🔐 Sistema de Login/Cadastro**
- **URL**: `http://localhost:3004/login`
- **Teste**: Faça login ou cadastre-se
- **Credenciais de teste**: Qualquer usuário/senha funciona

### 2. **🏠 Home Page**
- **URL**: `http://localhost:3004/`
- **Teste**: Veja estatísticas, crie nova pesquisa
- **Botões**: Permissões, Logout

### 3. **👥 Gerenciamento de Permissões**
- **URL**: `http://localhost:3004/permissions`
- **Teste**: Gerencie usuários e formulários
- **Funcionalidades**: Ativar/desativar usuários, controlar acesso

### 4. **🎤 Pesquisa com Gravação**
- **URL**: `http://localhost:3004/pesquisa/[ID]`
- **Teste**: Grave respostas com IA
- **Recursos**: Transcrição automática, modo manual

### 5. **📍 Geolocalização**
- **Teste**: Capture coordenadas GPS
- **Recursos**: Mapa integrado, precisão em metros

---

## 🛡️ **Isolamento Garantido:**

### ✅ **Porta Diferente:**
- Este projeto: **3004**
- Outro projeto: Provavelmente **3000** ou outra

### ✅ **Pasta Separada:**
- Este projeto: `C:\Users\minha\OneDrive\Desktop\Novo app`
- Outro projeto: Em pasta diferente

### ✅ **Dependências Isoladas:**
- `node_modules` próprio
- `package.json` independente
- Banco local (IndexedDB) próprio

---

## 🚀 **Comandos Rápidos:**

```bash
# Iniciar desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview de produção
npm run preview

# Parar servidor
Ctrl + C
```

---

## 📱 **Teste Mobile:**

### **No Celular:**
1. Conecte na mesma rede WiFi
2. Descubra seu IP: `ipconfig` (Windows)
3. Acesse: `http://[SEU_IP]:3004`
4. **Instale como PWA** no celular!

### **Exemplo:**
```
http://192.168.1.100:3004
```

---

## 🔄 **Para Alternar Entre Projetos:**

### **Parar Este Projeto:**
```bash
# No terminal do PORTA A PORTA
Ctrl + C
```

### **Iniciar Outro Projeto:**
```bash
# Navegar para pasta do outro projeto
cd "C:\caminho\do\outro\projeto"
npm run dev
```

### **Voltar para Este:**
```bash
# Voltar para pasta do PORTA A PORTA
cd "C:\Users\minha\OneDrive\Desktop\Novo app"
npm run dev
```

---

## 📊 **O que Testar:**

### ✅ **Funcionalidades Principais:**
- [ ] Login/Cadastro
- [ ] Criação de pesquisa
- [ ] Gravação de áudio
- [ ] Transcrição com IA
- [ ] Captura de geolocalização
- [ ] Sincronização offline/online
- [ ] Gerenciamento de permissões
- [ ] Instalação PWA

### ✅ **Teste de Cenários:**
- [ ] Usar offline (desconectar WiFi)
- [ ] Voltar online (reconectar)
- [ ] Testar em mobile
- [ ] Instalar como app
- [ ] Gravar várias pesquisas

---

## 🆘 **Se Algo Der Errado:**

### **Reset Completo:**
```bash
# Parar servidor
Ctrl + C

# Limpar cache
npm run build

# Reiniciar
npm run dev
```

### **Verificar Portas:**
```bash
# Ver o que está usando a porta 3004
netstat -ano | findstr :3004
```

---

## 🎉 **Resumo:**

**Este projeto está 100% isolado e não vai interferir no seu outro projeto!**

- ✅ **Porta 3004** (fixa)
- ✅ **Pasta separada**
- ✅ **Dependências próprias**
- ✅ **Banco local independente**

**Acesse**: `http://localhost:3004/` e teste à vontade! 🚀


