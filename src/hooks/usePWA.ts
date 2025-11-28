import { useState, useEffect } from 'react';

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(true); // Sempre true por padrão
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Verifica se o app já está instalado
    const checkIfInstalled = () => {
      // Verifica se está rodando em modo standalone (PWA instalado)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Ou se está rodando no iOS como PWA
      const isIOSPWA = (window.navigator as any).standalone === true;
      
      const installed = isStandalone || isIOSPWA;
      console.log('🔍 PWA - Verificando instalação:', {
        isStandalone,
        isIOSPWA,
        installed
      });
      setIsInstalled(installed);
      // Se já está instalado, não mostra o prompt
      if (installed) {
        setShowInstallPrompt(false);
      }
    };

    checkIfInstalled();

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('✅ PWA - Evento beforeinstallprompt disparado!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    // Fecha o banner imediatamente
    setShowInstallPrompt(false);
    
    // Se o navegador suporta instalação nativa, chama o prompt direto
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('✅ PWA instalação:', outcome === 'accepted' ? 'aceita' : 'rejeitada');
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Erro ao instalar PWA:', error);
      }
    } else {
      // Se não tem prompt nativo, abre instruções do navegador
      console.log('ℹ️ Use o menu do navegador para instalar');
      // Não mostra alert - deixa o usuário descobrir pelo menu do navegador
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  return {
    isInstalled,
    showInstallPrompt,
    installApp,
    dismissInstallPrompt,
  };
}









