import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PesquisaService } from '../services/pesquisaService';
import { pesquisaKeys } from './usePesquisas';
import { formularioKeys } from './useFormularios';

// Hook para sincronizar dados
export const useSincronizar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PesquisaService.sincronizar(),
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



