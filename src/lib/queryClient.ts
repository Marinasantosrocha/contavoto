import { QueryClient } from '@tanstack/react-query';

// Configuração global do React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações para funcionar bem offline
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 60 * 24, // 24 horas (era cacheTime)
      retry: 1, // Tenta 1 vez se falhar
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Prioriza cache offline
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 2,
    },
  },
});




