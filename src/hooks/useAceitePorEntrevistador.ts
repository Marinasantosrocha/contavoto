import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export interface AceiteEntrevistadorContagem {
  aceitas: number;
  ausentes: number; // recusou ou não aceitou
  total: number;
}

export type AceitePorEntrevistadorMap = Record<string, AceiteEntrevistadorContagem>;

// Agrupa counts de aceite_participacao por entrevistador no Supabase
export const useAceitePorEntrevistador = () => {
  return useQuery<AceitePorEntrevistadorMap>({
    queryKey: ['aceite-por-entrevistador'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('entrevistador, aceite_participacao');

      if (error) throw error;

      const map: AceitePorEntrevistadorMap = {};
      for (const row of data || []) {
        const nome = row.entrevistador || '—';
        if (!map[nome]) map[nome] = { aceitas: 0, ausentes: 0, total: 0 };
        if (row.aceite_participacao === true) map[nome].aceitas += 1;
        else if (row.aceite_participacao === false) map[nome].ausentes += 1;
        map[nome].total += (row.aceite_participacao === true || row.aceite_participacao === false) ? 1 : 0;
      }
      return map;
    },
    staleTime: 1000 * 30,
  });
};
