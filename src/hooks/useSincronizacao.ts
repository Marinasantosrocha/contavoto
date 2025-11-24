import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PesquisaService } from '../services/pesquisaService';
import { verificarEProcessarAutomaticamente } from '../services/syncService';
import { pesquisaKeys } from './usePesquisas';
import { formularioKeys } from './useFormularios';

// Hook para sincronizar dados
export const useSincronizar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 1. Sincroniza dados básicos
      const result = await PesquisaService.sincronizar();
      
      // 2. Processa áudio + IA (se online)
      if (result.sucesso && navigator.onLine) {
        try {
          await verificarEProcessarAutomaticamente();
        } catch (error) {
          console.error('Erro ao processar com IA:', error);
          // Não falha a sincronização por causa disso
        }
      }
      
      return result;
    },
    onSuccess: (result) => {
      if (result.sucesso) {
        // Invalida todos os caches para recarregar dados atualizados
        queryClient.invalidateQueries({ queryKey: pesquisaKeys.all });
        queryClient.invalidateQueries({ queryKey: formularioKeys.all });
      }
    },
  });
};

// Hook para limpar todos os dados (debug)
export const useLimparTudo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PesquisaService.limparTudo(),
    onSuccess: () => {
      // Limpa todo o cache do React Query
      queryClient.clear();
    },
  });
};









