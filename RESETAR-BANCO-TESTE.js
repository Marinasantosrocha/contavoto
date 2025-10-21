// Script para limpar banco local e recriar com formulário de teste
// Execute no Console do navegador (F12)

import { db } from './db/localDB';
import { PesquisaService } from './services/pesquisaService';

async function resetarParaTeste() {
  console.log('🧹 Limpando banco de dados local...');
  
  // Limpar tudo
  await db.formularios.clear();
  await db.pesquisas.clear();
  
  console.log('✅ Banco limpo!');
  console.log('🔄 Recarregue a página para criar o formulário de teste.');
}

// Executar
resetarParaTeste();
