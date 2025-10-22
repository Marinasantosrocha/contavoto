import { useQuery } from '@tanstack/react-query';
import { fetchRfbTimeseries, RfbFilters, TimeBucket, TimeseriesPoint } from '../services/analyticsService';

export const rfbTsKeys = {
  timeseries: (filters: RfbFilters, fieldKey: string, bucket: TimeBucket) => [
    'rfb-timeseries',
    filters,
    fieldKey,
    bucket,
  ] as const,
};

export function useRfbTimeseries(filters: RfbFilters, fieldKey: string, bucket: TimeBucket = 'day') {
  return useQuery<TimeseriesPoint[]>({
    queryKey: rfbTsKeys.timeseries(filters, fieldKey, bucket),
    queryFn: () => fetchRfbTimeseries({ ...filters, fieldKey, bucket }),
    staleTime: 1000 * 30,
  });
}
