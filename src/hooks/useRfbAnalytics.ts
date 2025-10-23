import { useQuery } from '@tanstack/react-query';
import { fetchRfbAggregations, RfbFilters } from '../services/analyticsService';

export const rfbKeys = {
  analytics: (filters: RfbFilters) => ['rfb-analytics', filters] as const,
};

export function useRfbAnalytics(filters: RfbFilters) {
  return useQuery({
    queryKey: rfbKeys.analytics(filters),
    queryFn: () => fetchRfbAggregations(filters),
    staleTime: 1000 * 30,
  });
}
