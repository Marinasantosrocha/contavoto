import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registrar Service Worker para PWA (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Alguns navegadores suportam Service Worker como módulo; se não, o build do PWA cuidará disso
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado:', registration);
      })
      .catch(error => {
        console.log('❌ Erro ao registrar Service Worker:', error);
      });
  });
} else {
  console.log('ℹ️ Service Worker não registrado no modo desenvolvimento');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

