import { supabase } from './supabaseClient';

export interface User {
  id: string;
  telefone: string;
  nome: string;
  tipo_usuario: 'superadmin' | 'admin' | 'suporte' | 'candidato' | 'pesquisador';
  ativo: boolean;
  formularios_permitidos: string[];
  nivel_permissao: number;
}

export class AuthService {
  // Fazer login com telefone e senha
  static async login(telefone: string, senha: string) {
    console.log('Tentando login com:', { telefone, senha });
    
    // Buscar o usuário pelo telefone
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefone', telefone)
      .eq('ativo', true)
      .single();

    console.log('Resultado da query:', { userData, error });

    if (error || !userData) {
      console.error('Erro na query:', error);
      console.error('Dados do usuário:', userData);
      throw new Error('Telefone não encontrado ou usuário inativo');
    }

    console.log('Usuário encontrado:', userData);

    // Verificar senha (em produção, use hash)
    if (userData.senha !== senha) {
      console.log('Senha incorreta. Esperada:', senha, 'Recebida:', userData.senha);
      throw new Error('Senha incorreta');
    }

    // Buscar dados do tipo de usuário
    const { data: tipoData, error: tipoError } = await supabase
      .from('tipos_usuarios')
      .select('*')
      .eq('id', userData.tipo_usuario_id)
      .single();

    if (tipoError || !tipoData) {
      throw new Error('Tipo de usuário não encontrado');
    }

    const user = {
      id: userData.id,
      telefone: userData.telefone,
      nome: userData.nome,
      tipo_usuario: tipoData.nome,
      ativo: userData.ativo,
      formularios_permitidos: [],
      nivel_permissao: tipoData.nivel_permissao
    } as User;

    // Salvar no localStorage
    localStorage.setItem('user', JSON.stringify(user));

    return { user };
  }

  // Fazer logout
  static async logout() {
    localStorage.removeItem('user');
  }

  // Registrar novo usuário
  static async register(nome: string, telefone: string, senha: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        nome,
        telefone,
        senha, // Em produção, use hash
        tipo_usuario_id: 1, // Padrão: pesquisador
        ativo: true
      })
      .select(`
        id,
        nome,
        telefone,
        ativo,
        tipo_usuario_id,
        tipos_usuarios!inner(
          id,
          nome,
          descricao,
          nivel_permissao
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const user = {
      id: data.id,
      telefone: data.telefone,
      nome: data.nome,
      tipo_usuario: data.tipos_usuarios.nome,
      ativo: data.ativo,
      formularios_permitidos: [],
      nivel_permissao: data.tipos_usuarios.nivel_permissao
    } as User;

    // Salvar no localStorage
    localStorage.setItem('user', JSON.stringify(user));

    return { user };
  }

  // Obter dados do usuário logado
  static async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  }

  // Verificar se usuário está autenticado
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}