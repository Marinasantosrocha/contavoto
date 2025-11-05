import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PesquisaService } from '../services/pesquisaService';
import { Formulario } from '../db/localDB';

// Query Keys
export const formularioKeys = {
  all: ['formularios'] as const,
  detail: (id: number) => ['formularios', id] as const,
};

// Hook para buscar todos os formulários
export const useFormularios = () => {
  return useQuery({
    queryKey: formularioKeys.all,
    queryFn: () => PesquisaService.buscarFormularios(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};

// Hook para buscar um formulário específico
export const useFormulario = (id: number | null) => {
  return useQuery({
    queryKey: formularioKeys.detail(id!),
    queryFn: () => PesquisaService.buscarFormularioPorId(id!),
    enabled: id !== null, // Só executa se id existir
  });
};

// Hook para salvar formulário
export const useSalvarFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formulario: Omit<Formulario, 'id' | 'criadoEm' | 'sincronizado'>) =>
      PesquisaService.salvarFormulario(formulario),
    onSuccess: () => {
      // Invalida cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: formularioKeys.all });
    },
  });
};

// Hook para inicializar formulário modelo
export const useInicializarFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PesquisaService.inicializarFormularioModelo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formularioKeys.all });
    },
  });
};




