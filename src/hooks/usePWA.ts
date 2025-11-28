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
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuário aceitou instalar o PWA');
      } else {
        console.log('Usuário rejeitou instalar o PWA');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
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









