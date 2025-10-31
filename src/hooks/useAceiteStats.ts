import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export interface AceiteStats {
  aceitaram: number;
  recusaram: number;
  total: number;
}

// Conta aceitaram/recusaram direto na tabela public.pesquisas, usando apenas a coluna aceite_participacao
export const useAceiteStats = () => {
  return useQuery<AceiteStats>({
    queryKey: ['aceite-stats'],
    queryFn: async () => {
      // Count Aceitaram
      const { count: aceitaramCount, error: errA } = await supabase
        .from('pesquisas')
        .select('id', { count: 'exact', head: true })
        .eq('aceite_participacao', true);

      if (errA) throw errA;

      // Count Recusaram
      const { count: recusaramCount, error: errR } = await supabase
        .from('pesquisas')
        .select('id', { count: 'exact', head: true })
        .eq('aceite_participacao', false);

      if (errR) throw errR;

      const aceitaram = aceitaramCount || 0;
      const recusaram = recusaramCount || 0;
      return { aceitaram, recusaram, total: aceitaram + recusaram };
    },
    staleTime: 1000 * 30, // 30s
  });
};
