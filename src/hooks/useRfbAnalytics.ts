import { useQuery } from '@tanstack/react-query';
import { fetchRfbAggregations, RfbFilters } from '../services/analyticsService';

export const rfbKeys = {
  analytics: (filters: RfbFilters) => ['rfb-analytics', filters] as const,
};

export function useRfbAnalytics(filters: RfbFilters) {
  return useQuery({
    queryKey: rfbKeys.analytics(filters),
    queryFn: async () => {
      console.log('🎯 [useRfbAnalytics] Iniciando fetch...');
      try {
        const result = await fetchRfbAggregations(filters);
        console.log('✅ [useRfbAnalytics] Fetch concluído com sucesso');
        return result;
      } catch (error) {
        console.error('❌ [useRfbAnalytics] Erro no fetch:', error);
        throw error;
      }
    },
    staleTime: 1000 * 30,
    retry: 1,
    retryDelay: 1000,
  });
}
