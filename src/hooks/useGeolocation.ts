import { useState, useCallback, useEffect } from 'react';

interface GeolocationHook {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isGettingLocation: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocation: () => void;
}

export function useGeolocation(): GeolocationHook {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    setError(null);

    try {
      // Verificar se o navegador suporta geolocalização
      if (!navigator.geolocation) {
        throw new Error('Geolocalização não suportada neste navegador');
      }

      // Obter posição atual
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true, // Usar GPS quando disponível
            timeout: 10000, // Timeout de 10 segundos
            maximumAge: 300000 // Cache por 5 minutos
          }
        );
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy);

      // Salvar no localStorage para uso offline
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };
      
      localStorage.setItem('lastKnownLocation', JSON.stringify(locationData));

    } catch (err) {
      let errorMessage = 'Erro ao obter localização';
      
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Ative nas configurações do navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Timeout ao obter localização. Tente novamente.';
            break;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Erro na geolocalização:', err);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLatitude(null);
    setLongitude(null);
    setAccuracy(null);
    setError(null);
    localStorage.removeItem('lastKnownLocation');
  }, []);

  // Carregar última localização conhecida ao inicializar
  useEffect(() => {
    const lastLocation = localStorage.getItem('lastKnownLocation');
    if (lastLocation) {
      try {
        const locationData = JSON.parse(lastLocation);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        // Se a localização é recente (menos de 5 minutos), usar ela
        if (locationData.timestamp > fiveMinutesAgo) {
          setLatitude(locationData.latitude);
          setLongitude(locationData.longitude);
          setAccuracy(locationData.accuracy);
        }
      } catch (err) {
        console.error('Erro ao carregar localização salva:', err);
      }
    }
  }, []);

  return {
    latitude,
    longitude,
    accuracy,
    isGettingLocation,
    error,
    getCurrentLocation,
    clearLocation,
  };
}
