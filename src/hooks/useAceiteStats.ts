import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export interface AceiteStats {
  aceitaram: number;
  recusaram: number;
  ausentes: number;
  total: number;
}

// Conta aceitaram/recusaram/ausentes direto na tabela public.pesquisas, usando apenas a coluna aceite_participacao (agora TEXT)
export const useAceiteStats = () => {
  return useQuery<AceiteStats>({
    queryKey: ['aceite-stats'],
    queryFn: async () => {
      // Count Aceitaram ("true")
      const { count: aceitaramCount, error: errA } = await supabase
        .from('pesquisas')
        .select('id', { count: 'exact', head: true })
        .eq('aceite_participacao', 'true');

      if (errA) throw errA;

      // Count Recusaram ("false")
      const { count: recusaramCount, error: errR } = await supabase
        .from('pesquisas')
        .select('id', { count: 'exact', head: true })
        .eq('aceite_participacao', 'false');

      if (errR) throw errR;

      // Count Ausentes ("ausente")
      const { count: ausentesCount, error: errAus } = await supabase
        .from('pesquisas')
        .select('id', { count: 'exact', head: true })
        .eq('aceite_participacao', 'ausente');

      if (errAus) throw errAus;

      const aceitaram = aceitaramCount || 0;
      const recusaram = recusaramCount || 0;
      const ausentes = ausentesCount || 0;
      return { aceitaram, recusaram, ausentes, total: aceitaram + recusaram + ausentes };
    },
    staleTime: 1000 * 30, // 30s
  });
};
