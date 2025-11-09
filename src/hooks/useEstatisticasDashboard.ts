import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

export interface EstatisticasDashboard {
  totais: {
    total_aceitas: number;
    total_recusadas: number;
    total_ausentes: number;
    total_abordagens: number;
  };
  por_pesquisador: Array<{
    entrevistador: string;
    usuario_id: number;
    aceitas: number;
    recusadas: number;
    ausentes: number;
    total_entrevistas: number;
    duracao_media_minutos: number;
    intervalo_medio_minutos: number;
  }>;
}

interface FiltrosDashboard {
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos';
  cidade?: string | null;
  pesquisadorId?: number | null;
}

export const useEstatisticasDashboard = (filtros?: FiltrosDashboard) => {
  return useQuery({
    queryKey: ['estatisticas-dashboard', filtros],
    queryFn: async () => {
      // Calcular data_inicio e data_fim baseado no período
      let dataInicio: string | null = null;
      let dataFim: string | null = null;

      if (filtros?.periodo && filtros.periodo !== 'todos') {
        const hoje = new Date();
        
        if (filtros.periodo === 'hoje') {
          dataInicio = new Date(hoje.setHours(0, 0, 0, 0)).toISOString();
          dataFim = new Date(hoje.setHours(23, 59, 59, 999)).toISOString();
        } else if (filtros.periodo === 'semana') {
          const semanaAtras = new Date();
          semanaAtras.setDate(hoje.getDate() - 7);
          dataInicio = semanaAtras.toISOString();
        } else if (filtros.periodo === 'mes') {
          const mesAtras = new Date();
          mesAtras.setMonth(hoje.getMonth() - 1);
          dataInicio = mesAtras.toISOString();
        }
      }

      const { data, error } = await supabase.rpc('buscar_estatisticas_dashboard', {
        p_data_inicio: dataInicio,
        p_data_fim: dataFim,
        p_cidade: filtros?.cidade || null,
        p_usuario_id: filtros?.pesquisadorId || null,
      });

      if (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
        throw error;
      }

      return data as EstatisticasDashboard;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
};

