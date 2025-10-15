// ==========================================
// SCRIPT DE TESTE DE CONEXÃO COM BANCO DE DADOS
// ==========================================

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
// Você pode alterar estes valores diretamente aqui ou usar variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dlcwglnzibgaiwmqriol.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsY3dnbG56aWJnYWl3bXFyaW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTMzNzgsImV4cCI6MjA3NjAyOTM3OH0.rFcqLhc1gIAA57xx-ts6h_1b_36VNDFcENsQYFm-P3c';

console.log('🚀 Iniciando testes de conexão...\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...\n');

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Contador de testes
let testesPassados = 0;
let testesFalhados = 0;

// Função auxiliar para logging
function logSucesso(mensagem) {
  console.log(`✅ ${mensagem}`);
  testesPassados++;
}

function logErro(mensagem, erro = null) {
  console.log(`❌ ${mensagem}`);
  if (erro) {
    console.log(`   Detalhes: ${erro.message || JSON.stringify(erro)}`);
  }
  testesFalhados++;
}

function logInfo(mensagem) {
  console.log(`ℹ️  ${mensagem}`);
}

// Função principal de testes
async function testarConexao() {
  console.log('═══════════════════════════════════════════');
  console.log('           TESTES DE CONEXÃO');
  console.log('═══════════════════════════════════════════\n');

  try {
    // ==========================================
    // TESTE 1: Conexão Básica
    // ==========================================
    console.log('🔌 TESTE 1: Verificando conexão básica...');
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      logSucesso('Conexão com banco de dados estabelecida!');
    } catch (error) {
      logErro('Falha na conexão básica', error);
      return; // Se a conexão básica falhar, não adianta continuar
    }
    console.log('');

    // ==========================================
    // TESTE 2: Tabela USUARIOS
    // ==========================================
    console.log('👥 TESTE 2: Testando tabela "usuarios"...');
    try {
      const { data: usuarios, error, count } = await supabase
        .from('usuarios')
        .select('id, nome, telefone, ativo, tipo_usuario_id', { count: 'exact' })
        .limit(3);
      
      if (error) throw error;
      
      logSucesso(`Tabela "usuarios" acessível (${count} registros)`);
      if (usuarios && usuarios.length > 0) {
        logInfo(`Exemplo: ${usuarios[0].nome} (${usuarios[0].telefone})`);
      } else if (count === 0) {
        logInfo('⚠️  Possíveis causas:');
        logInfo('   1. Nenhum usuário cadastrado ainda, OU');
        logInfo('   2. RLS (Row Level Security) está bloqueando o acesso');
        logInfo('');
        logInfo('💡 Soluções:');
        logInfo('   - Se não há usuários: Execute INSERIR-USUARIOS-SIMPLES.sql');
        logInfo('   - Se há usuários mas não aparecem: Execute DESABILITAR-RLS-TEMPORARIO.sql');
        logInfo('   - Para configurar RLS corretamente: Execute VERIFICAR-POLITICAS-RLS.sql');
      }
    } catch (error) {
      logErro('Erro ao acessar tabela "usuarios"', error);
    }
    console.log('');

    // ==========================================
    // TESTE 3: Tabela TIPOS_USUARIOS
    // ==========================================
    console.log('🏷️  TESTE 3: Testando tabela "tipos_usuarios"...');
    try {
      const { data: tipos, error, count } = await supabase
        .from('tipos_usuarios')
        .select('*', { count: 'exact' });
      
      if (error) throw error;
      
      logSucesso(`Tabela "tipos_usuarios" acessível (${count} tipos)`);
      if (tipos && tipos.length > 0) {
        tipos.forEach(tipo => {
          logInfo(`  - ${tipo.nome} (Nível: ${tipo.nivel_permissao})`);
        });
      }
    } catch (error) {
      logErro('Erro ao acessar tabela "tipos_usuarios"', error);
    }
    console.log('');

    // ==========================================
    // TESTE 4: Tabela FORMULARIOS
    // ==========================================
    console.log('📋 TESTE 4: Testando tabela "formularios"...');
    try {
      const { data: formularios, error, count } = await supabase
        .from('formularios')
        .select('id, nome, descricao', { count: 'exact' })
        .limit(3);
      
      if (error) throw error;
      
      logSucesso(`Tabela "formularios" acessível (${count} formulários)`);
      if (formularios && formularios.length > 0) {
        logInfo(`Exemplo: ${formularios[0].nome}`);
      }
    } catch (error) {
      logErro('Erro ao acessar tabela "formularios"', error);
    }
    console.log('');

    // ==========================================
    // TESTE 5: Tabela PESQUISAS
    // ==========================================
    console.log('📊 TESTE 5: Testando tabela "pesquisas"...');
    try {
      const { data: pesquisas, error, count } = await supabase
        .from('pesquisas')
        .select('id, status, criado_em', { count: 'exact' })
        .limit(3);
      
      if (error) throw error;
      
      logSucesso(`Tabela "pesquisas" acessível (${count} pesquisas)`);
      if (pesquisas && pesquisas.length > 0) {
        logInfo(`Última pesquisa: ${pesquisas[0].status} (${new Date(pesquisas[0].criado_em).toLocaleDateString('pt-BR')})`);
      }
    } catch (error) {
      logErro('Erro ao acessar tabela "pesquisas"', error);
    }
    console.log('');

    // ==========================================
    // TESTE 6: Tabela POLITICAS
    // ==========================================
    console.log('🏛️  TESTE 6: Testando tabela "politicas"...');
    try {
      const { data: politicas, error, count } = await supabase
        .from('politicas')
        .select('id, nome, partido', { count: 'exact' })
        .limit(3);
      
      if (error) throw error;
      
      logSucesso(`Tabela "politicas" acessível (${count} políticas)`);
      if (politicas && politicas.length > 0) {
        logInfo(`Exemplo: ${politicas[0].nome} - ${politicas[0].partido}`);
      }
    } catch (error) {
      logErro('Erro ao acessar tabela "politicas"', error);
    }
    console.log('');

    // ==========================================
    // TESTE 7: Sistema de Autenticação
    // ==========================================
    console.log('🔐 TESTE 7: Testando sistema de autenticação...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error && error.message !== 'Invalid Refresh Token: Already Used') {
        throw error;
      }
      
      logSucesso('Sistema de autenticação funcionando');
      if (data.session) {
        logInfo(`Sessão ativa: ${data.session.user.email}`);
      } else {
        logInfo('Nenhuma sessão ativa (esperado em teste)');
      }
    } catch (error) {
      logErro('Erro no sistema de autenticação', error);
    }
    console.log('');

    // ==========================================
    // TESTE 8: Teste de Relacionamento
    // ==========================================
    console.log('🔗 TESTE 8: Testando relacionamentos entre tabelas...');
    try {
      const { data: usuariosComTipo, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          telefone,
          tipos_usuarios (
            nome,
            nivel_permissao
          )
        `)
        .limit(1)
        .single();
      
      if (error) throw error;
      
      logSucesso('Relacionamentos funcionando corretamente');
      if (usuariosComTipo) {
        logInfo(`${usuariosComTipo.nome} é do tipo: ${usuariosComTipo.tipos_usuarios?.nome || 'N/A'}`);
      }
    } catch (error) {
      logErro('Erro ao testar relacionamentos', error);
    }
    console.log('');

    // ==========================================
    // TESTE 9: Teste de INSERT (Opcional)
    // ==========================================
    console.log('✍️  TESTE 9: Testando permissões de escrita...');
    try {
      // Tentativa de insert em tabela de teste
      const timestamp = new Date().toISOString();
      const { data, error } = await supabase
        .from('pesquisas')
        .select('count')
        .limit(0);
      
      if (error) throw error;
      
      logSucesso('Permissões de leitura OK');
      logInfo('(Teste de escrita não executado para evitar dados de teste)');
    } catch (error) {
      logErro('Erro ao verificar permissões', error);
    }
    console.log('');

  } catch (error) {
    console.error('💥 Erro crítico durante os testes:', error);
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('═══════════════════════════════════════════');
  console.log('              RESUMO DOS TESTES');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Testes passados: ${testesPassados}`);
  console.log(`❌ Testes falhados: ${testesFalhados}`);
  console.log(`📊 Total: ${testesPassados + testesFalhados}`);
  console.log('═══════════════════════════════════════════\n');

  if (testesFalhados === 0) {
    console.log('🎉 Parabéns! Todos os testes passaram com sucesso!');
    console.log('✨ O banco de dados está configurado corretamente.\n');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique as mensagens acima.');
    console.log('💡 Dica: Verifique se as tabelas existem e se as variáveis de ambiente estão corretas.\n');
  }
}

// Executar testes
testarConexao()
  .then(() => {
    console.log('✨ Testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });

