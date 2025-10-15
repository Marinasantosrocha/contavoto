// ==========================================
// TESTE DE CONEXÃO COM SUPABASE
// ==========================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarConexao() {
  try {
    // Teste 1: Contar usuários
    console.log('\n📊 Teste 1: Contando usuários...');
    const { data: usuarios, error: errorUsuarios } = await supabase
      .from('usuarios')
      .select('id, nome, telefone, ativo')
      .limit(5);
    
    if (errorUsuarios) {
      console.error('❌ Erro na query de usuários:', errorUsuarios);
      return;
    }
    
    console.log('✅ Usuários encontrados:', usuarios.length);
    console.log('📋 Dados:', usuarios);
    
    // Teste 2: Buscar usuário específico
    console.log('\n🔍 Teste 2: Buscando usuário 38998143436...');
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
    console.log('\n🔍 Teste 3: Buscando tipo de usuário...');
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
    console.log('\n🔐 Teste 4: Simulando login...');
    if (usuario.senha === '123456') {
      console.log('✅ Login seria bem-sucedido!');
      console.log('👤 Dados do usuário:', {
        id: usuario.id,
        nome: usuario.nome,
        telefone: usuario.telefone,
        tipo_usuario: tipo.nome,
        nivel_permissao: tipo.nivel_permissao
      });
    } else {
      console.log('❌ Senha incorreta');
      console.log('Senha esperada: 123456');
      console.log('Senha recebida:', usuario.senha);
    }
    
    console.log('\n🎉 Todos os testes passaram! A conexão está funcionando.');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar teste
testarConexao();
