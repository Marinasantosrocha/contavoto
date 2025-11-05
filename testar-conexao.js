// ==========================================
// TESTE DE CONEXÃO COM SUPABASE
// ==========================================

import { supabase } from './src/services/supabaseClient.js';

async function testarConexao() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Contar usuários
    console.log('📊 Testando query simples...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, nome, telefone, ativo')
      .limit(5);
    
    if (errorUsuarios) {
      console.error('❌ Erro na query de usuários:', errorUsuarios);
      return;
    }
    
    console.log('✅ Usuários encontrados:', usuarios);
    
    // Teste 2: Buscar usuário específico
    console.log('🔍 Testando busca por telefone...');
    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefone', '38998143436')
      .eq('ativo', true)
      .single();
    
    if (errorUsuario) {
      console.error('❌ Erro na busca do usuário:', errorUsuario);
      return;
    }
    
    console.log('✅ Usuário encontrado:', usuario);
    
    // Teste 3: Buscar tipo de usuário
    console.log('🔍 Testando busca do tipo de usuário...');
    const { data: tipo, error: errorTipo } = await supabase
      .from('tipos_usuarios')
      .select('*')
      .eq('id', usuario.tipo_usuario_id)
      .single();
    
    if (errorTipo) {
      console.error('❌ Erro na busca do tipo:', errorTipo);
      return;
    }
    
    console.log('✅ Tipo de usuário encontrado:', tipo);
    
    // Teste 4: Simular login
    console.log('🔐 Testando login...');
    if (usuario.senha === '123456') {
      console.log('✅ Login seria bem-sucedido!');
      console.log('👤 Usuário:', {
        id: usuario.id,
        nome: usuario.nome,
        telefone: usuario.telefone,
        tipo_usuario: tipo.nome,
        nivel_permissao: tipo.nivel_permissao
      });
    } else {
      console.log('❌ Senha incorreta');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar teste
testarConexao();



