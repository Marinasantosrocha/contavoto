import { useState, useEffect } from 'react';

export interface PoliticaVisualizacao {
  tipo_usuario: string;
  pode_ver_pesquisas: boolean;
  pode_ver_estatisticas: boolean;
  pode_gerenciar_usuarios: boolean;
  pode_gerenciar_formularios: boolean;
  pode_exportar_dados: boolean;
  pode_acessar_relatorios: boolean;
}

const POLITICAS_STORAGE_KEY = 'contavoto_politicas';

const politicasPadrao: PoliticaVisualizacao[] = [
  {
    tipo_usuario: 'superadmin',
    pode_ver_pesquisas: true,
    pode_ver_estatisticas: true,
    pode_gerenciar_usuarios: true,
    pode_gerenciar_formularios: true,
    pode_exportar_dados: true,
    pode_acessar_relatorios: true,
  },
  {
    tipo_usuario: 'admin',
    pode_ver_pesquisas: true,
    pode_ver_estatisticas: true,
    pode_gerenciar_usuarios: true,
    pode_gerenciar_formularios: true,
    pode_exportar_dados: true,
    pode_acessar_relatorios: false,
  },
  {
    tipo_usuario: 'suporte',
    pode_ver_pesquisas: true,
    pode_ver_estatisticas: true,
    pode_gerenciar_usuarios: false,
    pode_gerenciar_formularios: false,
    pode_exportar_dados: false,
    pode_acessar_relatorios: false,
  },
  {
    tipo_usuario: 'candidato',
    pode_ver_pesquisas: true,
    pode_ver_estatisticas: true,
    pode_gerenciar_usuarios: false,
    pode_gerenciar_formularios: false,
    pode_exportar_dados: false,
    pode_acessar_relatorios: false,
  },
  {
    tipo_usuario: 'pesquisador',
    pode_ver_pesquisas: true,
    pode_ver_estatisticas: false,
    pode_gerenciar_usuarios: false,
    pode_gerenciar_formularios: false,
    pode_exportar_dados: false,
    pode_acessar_relatorios: false,
  },
];

export const usePoliticas = () => {
  const [politicas, setPoliticas] = useState<PoliticaVisualizacao[]>(politicasPadrao);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar políticas do localStorage
    const politicasSalvas = localStorage.getItem(POLITICAS_STORAGE_KEY);
    if (politicasSalvas) {
      try {
        setPoliticas(JSON.parse(politicasSalvas));
      } catch (error) {
        console.error('Erro ao carregar políticas:', error);
        setPoliticas(politicasPadrao);
      }
    }
    setIsLoading(false);
  }, []);

  const salvarPoliticas = (novasPoliticas: PoliticaVisualizacao[]) => {
    setPoliticas(novasPoliticas);
    localStorage.setItem(POLITICAS_STORAGE_KEY, JSON.stringify(novasPoliticas));
  };

  const resetarPoliticas = () => {
    setPoliticas(politicasPadrao);
    localStorage.setItem(POLITICAS_STORAGE_KEY, JSON.stringify(politicasPadrao));
  };

  const getPoliticaPorTipo = (tipoUsuario: string): PoliticaVisualizacao | undefined => {
    return politicas.find(p => p.tipo_usuario === tipoUsuario);
  };

  const verificarPermissao = (tipoUsuario: string, permissao: keyof PoliticaVisualizacao): boolean => {
    const politica = getPoliticaPorTipo(tipoUsuario);
    if (!politica) return false;
    
    // Superadmin sempre tem todas as permissões
    if (tipoUsuario === 'superadmin') return true;
    
    return politica[permissao] === true;
  };

  return {
    politicas,
    isLoading,
    salvarPoliticas,
    resetarPoliticas,
    getPoliticaPorTipo,
    verificarPermissao,
  };
};


