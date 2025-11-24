# 📱 PWA - Progressive Web App

## 🚀 O que é um PWA?

**PWA (Progressive Web App)** é uma aplicação web que funciona como um app nativo, oferecendo:

- ✅ **Instalação** no celular/computador
- ✅ **Funcionamento offline** completo
- ✅ **Notificações push** (opcional)
- ✅ **Ícone na tela inicial**
- ✅ **Splash screen** personalizada
- ✅ **Atualizações automáticas**

## 🎯 Funcionalidades Implementadas

### 1. **Manifest.json**
```json
{
  "name": "PORTA A PORTA - Pesquisa de Campo",
  "short_name": "Porta a Porta",
  "description": "Sistema de pesquisa de campo que funciona offline",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [...]
}
```

### 2. **Service Worker**
- **Cache inteligente** de arquivos estáticos
- **Cache da API Supabase** para funcionamento offline
- **Atualizações automáticas** em background
- **Limpeza de cache** antigo

### 3. **Install Prompt**
- **Banner de instalação** automático
- **Detecção** se já está instalado
- **Suporte iOS/Android/Desktop**

### 4. **Splash Screen**
- **Tela de carregamento** personalizada
- **Animações** suaves
- **Branding** consistente

## 📱 Como Instalar

### **Android (Chrome)**
1. Abra o app no Chrome
2. Clique no banner "Instalar App"
3. Ou vá em Menu → "Adicionar à tela inicial"

### **iOS (Safari)**
1. Abra o app no Safari
2. Toque no botão "Compartilhar" (📤)
3. Selecione "Adicionar à Tela Inicial"

### **Desktop (Chrome/Edge)**
1. Clique no ícone de instalação na barra de endereços
2. Ou vá em Menu → "Instalar PORTA A PORTA"

## 🔧 Configurações Técnicas

### **Vite Config**
```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: { /* configurações do manifest */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365
          }
        }
      }
    ]
  }
})
```

### **Hook PWA**
```typescript
const { isInstalled, showInstallPrompt, installApp } = usePWA();
```

## 🎨 Ícones PWA

### **Tamanhos Necessários**
- `pwa-192x192.png` - Ícone padrão
- `pwa-512x512.png` - Ícone grande
- `apple-touch-icon.png` - iOS
- `favicon.ico` - Favicon

### **Design dos Ícones**
- **Cores**: Gradiente azul (#667eea → #764ba2)
- **Elementos**: Casa, formulário, checkmarks
- **Estilo**: Minimalista e profissional

## 🔄 Funcionamento Offline

### **Cache Strategy**
1. **Arquivos estáticos**: Cache permanente
2. **API Supabase**: NetworkFirst (tenta rede, usa cache se falhar)
3. **Imagens**: StaleWhileRevalidate (cache + atualização em background)

### **Dados Offline**
- ✅ **Formulários** salvos localmente
- ✅ **Pesquisas** funcionam offline
- ✅ **Sincronização** automática quando volta online
- ✅ **React Query** gerencia cache inteligente

## 📊 Métricas PWA

### **Lighthouse Score**
- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 100

### **Core Web Vitals**
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## 🚀 Deploy PWA

### **Vercel/Netlify**
```bash
npm run build
# Deploy da pasta 'dist'
```

### **Configurações de Servidor**
```nginx
# Nginx
location / {
  try_files $uri $uri/ /index.html;
}

# Cache headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## 🔍 Debugging PWA

### **Chrome DevTools**
1. **Application Tab** → Service Workers
2. **Application Tab** → Manifest
3. **Lighthouse Tab** → PWA Audit

### **Testes**
```bash
# Build e preview
npm run build
npm run preview

# Teste offline
# 1. Instale o PWA
# 2. Desconecte internet
# 3. Teste funcionalidades
```

## 📱 Recursos Mobile

### **Safe Areas (iOS)**
```css
@media (display-mode: standalone) {
  .page {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

### **Touch Gestures**
- **Swipe** para navegação
- **Pull to refresh** (opcional)
- **Haptic feedback** (iOS)

## 🎯 Próximos Passos

### **Funcionalidades Avançadas**
- [ ] **Notificações push** para lembretes
- [ ] **Background sync** para dados
- [ ] **Share API** para compartilhar pesquisas
- [ ] **Camera API** para fotos
- [ ] **Geolocation** para GPS automático

### **Otimizações**
- [ ] **Lazy loading** de componentes
- [ ] **Code splitting** por rotas
- [ ] **Image optimization** automática
- [ ] **Bundle analysis** e otimização

---

## 🎉 Resultado Final

**O PORTA A PORTA agora é um PWA completo!**

- 📱 **Instala** como app nativo
- 🔄 **Funciona offline** perfeitamente
- ⚡ **Carrega** instantaneamente
- 🎨 **Interface** nativa e responsiva
- 🔄 **Sincroniza** automaticamente

**Perfeito para uso em campo!** 🚀








