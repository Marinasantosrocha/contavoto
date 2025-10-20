import { supabase } from './supabaseClient';

export interface UploadFotoResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Faz upload de uma foto para o Supabase Storage
 * @param file - Arquivo de imagem
 * @param userId - ID do usuário (usado no nome do arquivo)
 * @returns URL pública da foto ou erro
 */
export const uploadFotoUsuario = async (
  file: File,
  userId: number
): Promise<UploadFotoResult> => {
  try {
    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      return {
        url: '',
        path: '',
        error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.'
      };
    }

    // Validar tamanho (máximo 5MB)
    const tamanhoMaximo = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > tamanhoMaximo) {
      return {
        url: '',
        path: '',
        error: 'Arquivo muito grande. Tamanho máximo: 5MB.'
      };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extensao = file.name.split('.').pop();
    const nomeArquivo = `usuario_${userId}_${timestamp}.${extensao}`;
    const caminhoArquivo = `avatars/${nomeArquivo}`;

    // Fazer upload
    const { error } = await supabase.storage
      .from('avatars')
      .upload(caminhoArquivo, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      return {
        url: '',
        path: '',
        error: error.message
      };
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(caminhoArquivo);

    return {
      url: urlData.publicUrl,
      path: caminhoArquivo,
      error: undefined
    };
  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    return {
      url: '',
      path: '',
      error: error.message || 'Erro desconhecido ao fazer upload'
    };
  }
};

/**
 * Deleta uma foto do Storage
 * @param path - Caminho da foto no storage
 */
export const deletarFotoUsuario = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    if (error) {
      console.error('Erro ao deletar foto:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    return false;
  }
};

/**
 * Atualiza a URL da foto no banco de dados
 * @param userId - ID do usuário
 * @param fotoUrl - URL da foto
 */
export const atualizarFotoUsuario = async (
  userId: number,
  fotoUrl: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ foto_url: fotoUrl })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar URL da foto:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar foto no banco:', error);
    return false;
  }
};

/**
 * Processo completo: upload + atualização no banco
 * @param file - Arquivo de imagem
 * @param userId - ID do usuário
 * @param fotoAntigaPath - Caminho da foto antiga (para deletar)
 */
export const trocarFotoUsuario = async (
  file: File,
  userId: number,
  fotoAntigaPath?: string
): Promise<{ sucesso: boolean; url?: string; erro?: string }> => {
  try {
    // 1. Fazer upload da nova foto
    const resultado = await uploadFotoUsuario(file, userId);
    
    if (resultado.error) {
      return { sucesso: false, erro: resultado.error };
    }

    // 2. Atualizar no banco de dados
    const atualizou = await atualizarFotoUsuario(userId, resultado.url);
    
    if (!atualizou) {
      // Rollback: deletar foto que acabou de fazer upload
      await deletarFotoUsuario(resultado.path);
      return { sucesso: false, erro: 'Erro ao atualizar banco de dados' };
    }

    // 3. Deletar foto antiga (se existir)
    if (fotoAntigaPath) {
      await deletarFotoUsuario(fotoAntigaPath);
    }

    return { sucesso: true, url: resultado.url };
  } catch (error: any) {
    return { sucesso: false, erro: error.message || 'Erro desconhecido' };
  }
};
