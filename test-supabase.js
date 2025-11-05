// Teste de Conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dlcwglnzibgaiwmqriol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsY3dnbG56aWJnYWl3bXFyaW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTMzNzgsImV4cCI6MjA3NjAyOTM3OH0.rFcqLhc1gIAA57xx-ts6h_1b_36VNDFcENsQYFm-P3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue acessar a tabela formularios
    console.log('📋 Testando acesso à tabela formularios...');
    const { data: formularios, error: formulariosError } = await supabase
      .from('formularios')
      .select('*')
      .limit(1);
    
    if (formulariosError) {
      console.error('❌ Erro ao acessar formularios:', formulariosError.message);
    } else {
      console.log('✅ Tabela formularios acessível!', formularios);
    }

    // Teste 2: Verificar se consegue acessar a tabela usuarios
    console.log('👥 Testando acesso à tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    if (usuariosError) {
      console.error('❌ Erro ao acessar usuarios:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios acessível!', usuarios);
    }

    // Teste 3: Verificar se consegue acessar a tabela pesquisas
    console.log('📊 Testando acesso à tabela pesquisas...');
    const { data: pesquisas, error: pesquisasError } = await supabase
      .from('pesquisas')
      .select('*')
      .limit(1);
    
    if (pesquisasError) {
      console.error('❌ Erro ao acessar pesquisas:', pesquisasError.message);
    } else {
      console.log('✅ Tabela pesquisas acessível!', pesquisas);
    }

    // Teste 4: Verificar autenticação
    console.log('🔐 Testando sistema de autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ Sistema de auth funcionando (usuário não logado):', authError.message);
    } else {
      console.log('✅ Sistema de auth funcionando!', user ? 'Usuário logado' : 'Usuário não logado');
    }

    console.log('🎉 Teste de conexão concluído!');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testConnection();



