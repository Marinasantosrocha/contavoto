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

// Hook para buscar estatísticas do dia atual (offline)
export const useEstatisticasDia = (usuario_id?: number) => {
  return useQuery({
    queryKey: [...pesquisaKeys.stats(), 'dia', usuario_id],
    queryFn: () => PesquisaService.contarEstatisticasDia(usuario_id),
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
      queryClient.invalidateQueries({ queryKey: pesquisaKeys.stats() }); // Invalida também estatísticas do dia
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
        .select('id, nome')
        .eq('tipo_usuario_id', 1) // Tipo 1 = Pesquisador
        .eq('ativo', true) // Apenas usuários ativos
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para buscar cidades únicas do Supabase
export const useCidades = () => {
  return useQuery({
    queryKey: ['cidades'],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      const { data, error } = await supabase
        .from('pesquisas')
        .select('cidade')
        .not('cidade', 'is', null)
        .order('cidade');
      
      if (error) throw error;
      
      // Extrair cidades únicas
      const cidadesUnicas = [...new Set((data || []).map((p: any) => p.cidade))];
      return cidadesUnicas.sort((a, b) => a.localeCompare(b));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para buscar TODAS as pesquisas usando RPC com paginação
export const usePesquisasSupabase = () => {
  return useQuery({
    queryKey: ['todas-pesquisas-supabase'],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      
      console.log('🔍 Buscando TODAS as pesquisas via RPC paginado...');
      
      const allPesquisas: any[] = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`📄 Buscando lote: LIMIT ${limit} OFFSET ${offset}...`);
        
        const { data, error } = await supabase.rpc('buscar_pesquisas_paginadas', {
          p_limit: limit,
          p_offset: offset
        });
        
        if (error) {
          console.error('❌ Erro ao buscar pesquisas via RPC:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          allPesquisas.push(...data);
          console.log(`✅ Lote retornou ${data.length} registros (Total: ${allPesquisas.length})`);
          
          // Se retornou menos que o limit, não há mais dados
          if (data.length < limit) {
            hasMore = false;
          }
          
          offset += limit;
        } else {
          hasMore = false;
        }
        
        // Limite de segurança (20 páginas = 20.000 registros)
        if (offset >= 20000) {
          console.warn('⚠️ Limite de 20.000 registros atingido');
          hasMore = false;
        }
      }
      
      console.log('🎉 Total de pesquisas carregadas:', allPesquisas.length);
      console.log('📍 Cidades encontradas:', [...new Set(allPesquisas.map((p: any) => p.cidade).filter(Boolean))]);
      
      return allPesquisas;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - cache mais longo pois busca tudo
  });
};

// Hook para buscar todas as pesquisas para exibir em tabela (paginado com filtros)
export const usePesquisasTabela = (
  periodo: string = 'todos',
  cidade: string | null = null,
  entrevistador: string | null = null,
  limit: number = 100,
  offset: number = 0
) => {
  return useQuery({
    queryKey: ['pesquisas-tabela', periodo, cidade, entrevistador, limit, offset],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      
      const { data, error } = await supabase.rpc('buscar_todas_pesquisas_tabela', {
        p_periodo: periodo,
        p_cidade: cidade,
        p_entrevistador: entrevistador,
        p_limit: limit,
        p_offset: offset
      });
      
      if (error) {
        console.error('❌ Erro ao buscar pesquisas para tabela:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para buscar cidades únicas usando RPC (com fallback)
export const useCidadesUnicas = () => {
  return useQuery({
    queryKey: ['cidades-unicas'],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      
      console.log('🏙️ Tentando buscar cidades únicas via RPC...');
      
      const rpcResult = await supabase.rpc('get_cidades_unicas');
      
      // Se RPC funcionar, usar ele
      if (!rpcResult.error && rpcResult.data) {
        const cidades = (rpcResult.data || []).map((item: any) => item.cidade);
        console.log('✅ Cidades únicas (RPC):', cidades);
        return cidades;
      }
      
      // FALLBACK: Query normal
      console.warn('⚠️ RPC cidades falhou, usando query normal:', rpcResult.error);
      
      const { data, error } = await supabase
        .from('pesquisas')
        .select('cidade')
        .not('cidade', 'is', null);
      
      if (error) throw error;
      
      const cidadesUnicas = [...new Set((data || []).map((p: any) => p.cidade))];
      console.log('✅ Cidades únicas (fallback):', cidadesUnicas);
      
      return cidadesUnicas.sort((a, b) => a.localeCompare(b));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para buscar entrevistadores únicos usando RPC
export const useEntrevistadoresUnicos = (filtros?: {
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos';
  cidade?: string | null;
}) => {
  return useQuery({
    queryKey: ['entrevistadores-unicos', filtros],
    queryFn: async () => {
      const { supabase } = await import('../services/supabaseClient');
      
      console.log('👥 Buscando entrevistadores únicos via RPC com filtros:', filtros);
      
      const { data, error } = await supabase.rpc('get_entrevistadores_unicos', {
        filtro_periodo: filtros?.periodo || 'todos',
        filtro_cidade: filtros?.cidade || null
      });
      
      if (error) {
        console.error('❌ Erro ao buscar entrevistadores:', error);
        throw error;
      }
      
      const entrevistadores = (data || []).map((item: any) => item.entrevistador);
      console.log('✅ Entrevistadores únicos:', entrevistadores);
      
      return entrevistadores;
    },
    staleTime: 1000 * 60, // 1 minuto
  });
};


