import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

interface MetricasProdutividade {
  entrevistador: string;
  total_entrevistas: number;
  duracao_media_minutos: number;
  intervalo_medio_minutos: number;
}

export const useProdutividade = () => {
  return useQuery({
    queryKey: ['produtividade'],
    queryFn: async () => {
      // Query SQL para calcular as duas métricas
      const { data, error } = await supabase.rpc('calcular_produtividade');

      if (error) {
        console.error('Erro ao buscar produtividade:', error);
        throw error;
      }

      return data as MetricasProdutividade[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
