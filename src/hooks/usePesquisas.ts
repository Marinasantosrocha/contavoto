import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PesquisaService } from '../services/pesquisaService';

// Query Keys
export const pesquisaKeys = {
  all: ['pesquisas'] as const,
  lists: () => [...pesquisaKeys.all, 'list'] as const,
  list: (filtro?: { status?: string; formularioId?: number }) => 
    [...pesquisaKeys.lists(), filtro] as const,
  details: () => [...pesquisaKeys.all, 'detail'] as const,
  detail: (id: number) => [...pesquisaKeys.details(), id] as const,
  stats: () => [...pesquisaKeys.all, 'stats'] as const,
};

// Hook para buscar estatísticas
export const useEstatisticasPesquisas = (usuario_id?: number) => {
  return useQuery({
    queryKey: [...pesquisaKeys.stats(), usuario_id],
    queryFn: () => PesquisaService.contarPesquisas(usuario_id),
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });
};

// Hook para buscar lista de pesquisas
export const usePesquisas = (filtro?: { status?: 'em_andamento' | 'finalizada' | 'cancelada'; formularioId?: number }) => {
  return useQuery({
    queryKey: pesquisaKeys.list(filtro),
    queryFn: () => PesquisaService.buscarPesquisas(filtro),
    staleTime: 1000 * 30, // 30 segundos
  });
};

// Hook para buscar uma pesquisa específica
export const usePesquisa = (id: number | null) => {
  return useQuery({
    queryKey: pesquisaKeys.detail(id!),
    queryFn: () => PesquisaService.buscarPesquisaPorId(id!),
    enabled: id !== null,
  });
};

// Hook para criar nova pesquisa
export const useCriarPesquisa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      formularioId,
      entrevistador,
      endereco,
      bairro,
      cidade,
    }: {
      formularioId: number;
      entrevistador: string;
      endereco: string;
      bairro: string;
      cidade: string;
    }) => PesquisaService.criarPesquisa(formularioId, entrevistador, endereco, bairro, cidade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.stats() });
    },
  });
};

// Hook para salvar resposta
export const useSalvarResposta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pesquisaId, campoId, valor }: { pesquisaId: number; campoId: string; valor: any }) =>
      PesquisaService.salvarResposta(pesquisaId, campoId, valor),
    onMutate: async ({ pesquisaId, campoId, valor }) => {
      // Otimistic update
      await queryClient.cancelQueries({ queryKey: pesquisaKeys.detail(pesquisaId) });
      
      const previousData = queryClient.getQueryData(pesquisaKeys.detail(pesquisaId));
      
      queryClient.setQueryData(pesquisaKeys.detail(pesquisaId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          respostas: {
            ...old.respostas,
            [campoId]: valor,
          },
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Reverte em caso de erro
      if (context?.previousData) {
        queryClient.setQueryData(pesquisaKeys.detail(variables.pesquisaId), context.previousData);
      }
    },
  });
};

// Hook para finalizar pesquisa
export const useFinalizarPesquisa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pesquisaId,
      nomeEntrevistado,
      telefoneEntrevistado,
    }: {
      pesquisaId: number;
      nomeEntrevistado?: string;
      telefoneEntrevistado?: string;
    }) => PesquisaService.finalizarPesquisa(pesquisaId, nomeEntrevistado, telefoneEntrevistado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.detail(variables.pesquisaId) });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.stats() });
    },
  });
};

// Hook para cancelar pesquisa
export const useCancelarPesquisa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pesquisaId: number) => PesquisaService.cancelarPesquisa(pesquisaId),
    onSuccess: (_, pesquisaId) => {
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.detail(pesquisaId) });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.stats() });
    },
  });
};

// Hook para deletar pesquisa
export const useDeletarPesquisa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pesquisaId: number) => PesquisaService.deletarPesquisa(pesquisaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.stats() });
    },
  });
};

// Hook para buscar lista de pesquisadores
export const usePesquisadores = () => {
  return useQuery({
    queryKey: ['pesquisadores'],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('tipo_usuario_id', 1) // Apenas pesquisadores
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};


