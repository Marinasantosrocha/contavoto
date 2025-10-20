import { db } from '../db/localDB';
import { supabase } from './supabaseClient';
import { processarTranscricaoComIA, ResultadoIA } from './geminiService';
import { formularioPortaAPortaModelo } from '../data/formularioModelo';

/**
 * Faz upload do áudio para o Supabase Storage
 */
async function uploadAudioParaStorage(
  audioBlob: Blob,
  _pesquisaId: number,
  pesquisaUuid: string
): Promise<string> {
  try {
    // Nome do arquivo: pesquisa_[uuid]_[timestamp].webm
    const timestamp = Date.now();
    const fileName = `pesquisa_${pesquisaUuid}_${timestamp}.webm`;
    const filePath = `${fileName}`;

    // Upload para o bucket pesquisas-audio
    const { error } = await supabase.storage
      .from('pesquisas-audio')
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error('Erro ao fazer upload do áudio:', error);
      throw error;
    }

    // Obtém URL pública
    const { data: urlData } = supabase.storage
      .from('pesquisas-audio')
      .getPublicUrl(filePath);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Erro no upload de áudio:', error);
    throw error;
  }
}

/**
 * Processa uma pesquisa: upload de áudio + IA + salva resultados
 */
export async function processarPesquisaComIA(pesquisaId: number): Promise<boolean> {
  try {
    console.log(`🤖 Iniciando processamento da pesquisa ${pesquisaId}`);

    // 1. Busca a pesquisa no IndexedDB
    const pesquisa = await db.pesquisas.get(pesquisaId);
    if (!pesquisa) {
      console.error('Pesquisa não encontrada');
      return false;
    }

    // Verifica se tem áudio
    if (!pesquisa.audioBlob) {
      console.log('Pesquisa sem áudio - pulando processamento');
      return false;
    }

    // Verifica se já foi processado
    if (pesquisa.processamento_ia_status === 'concluido') {
      console.log('Pesquisa já processada - pulando');
      return true;
    }

    // 2. Atualiza status para "processando"
    await db.pesquisas.update(pesquisaId, {
      processamento_ia_status: 'processando'
    });

    // 3. Upload do áudio
    console.log('📤 Fazendo upload do áudio...');
    let audioUrl = pesquisa.audio_url;

    if (!audioUrl && pesquisa.audioBlob) {
      audioUrl = await uploadAudioParaStorage(
        pesquisa.audioBlob,
        pesquisaId,
        pesquisa.uuid || String(pesquisaId)
      );

      // Salva URL no IndexedDB
      await db.pesquisas.update(pesquisaId, {
        audio_url: audioUrl
      });

      console.log('✅ Áudio enviado:', audioUrl);
    }

    // 4. Processa com IA (se tiver transcrição)
    let resultadoIA: ResultadoIA | null = null;

    if (pesquisa.transcricao_completa) {
      console.log('🧠 Processando com Gemini...');
      
      resultadoIA = await processarTranscricaoComIA(
        pesquisa.transcricao_completa,
        formularioPortaAPortaModelo.campos,
        formularioPortaAPortaModelo.preCandidato
      );

      console.log('✅ IA processada:', resultadoIA.status);

      // 5. Salva resultados da IA
      await db.pesquisas.update(pesquisaId, {
        processamento_ia_status: resultadoIA.status === 'sucesso' ? 'concluido' : 'erro',
        processamento_ia_confianca: resultadoIA.confianca
      });

      // 6. Mescla respostas da IA com respostas existentes
      if (resultadoIA.respostas && Object.keys(resultadoIA.respostas).length > 0) {
        const respostasAtuais = pesquisa.respostas || {};
        const respostasMescladas = { ...respostasAtuais, ...resultadoIA.respostas };

        await db.pesquisas.update(pesquisaId, {
          respostas: respostasMescladas
        });

        console.log('✅ Respostas mescladas');
      }
    }

    // 7. Sincroniza com Supabase
    console.log('🔄 Sincronizando com Supabase...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Usuário não autenticado');
      return false;
    }

    // Prepara dados para sincronização
    const dadosSync: any = {
      usuario_id: user.id,
      formulario_nome: pesquisa.formularioNome,
      endereco: pesquisa.endereco,
      bairro: pesquisa.bairro,
      cidade: pesquisa.cidade,
      numero_residencia: pesquisa.numeroResidencia,
      ponto_referencia: pesquisa.pontoReferencia,
      nome_entrevistado: pesquisa.nomeEntrevistado,
      telefone_entrevistado: pesquisa.telefoneEntrevistado,
      aceite_participacao: pesquisa.aceite_participacao,
      motivo_recusa: pesquisa.motivo_recusa,
      audio_url: audioUrl,
      audio_duracao: pesquisa.audio_duracao,
      transcricao_completa: pesquisa.transcricao_completa,
      processamento_ia_status: pesquisa.processamento_ia_status,
      processamento_ia_confianca: pesquisa.processamento_ia_confianca,
      perguntas_feitas: pesquisa.perguntas_feitas,
      respostas: pesquisa.respostas,
      latitude: pesquisa.latitude,
      longitude: pesquisa.longitude,
      status: pesquisa.status,
      finalizada_em: pesquisa.finalizadaEm
    };

    // Insere ou atualiza no Supabase
    const { error } = await supabase
      .from('pesquisas')
      .upsert(dadosSync, {
        onConflict: 'uuid'
      });

    if (error) {
      console.error('Erro ao sincronizar com Supabase:', error);
      throw error;
    }

    // Marca como sincronizado
    await db.pesquisas.update(pesquisaId, {
      sincronizado: true
    });

    console.log('✅ Processamento completo!');
    return true;

  } catch (error) {
    console.error('❌ Erro ao processar pesquisa:', error);

    // Marca como erro
    await db.pesquisas.update(pesquisaId, {
      processamento_ia_status: 'erro'
    });

    return false;
  }
}

/**
 * Processa todas as pesquisas pendentes (em lote)
 */
export async function processarPesquisasPendentes(): Promise<void> {
  try {
    console.log('🔍 Buscando pesquisas pendentes...');

    // Busca pesquisas finalizadas e não sincronizadas
    const pesquisasPendentes = await db.pesquisas
      .where('status')
      .equals('finalizada')
      .and(p => !p.sincronizado && p.audioBlob != null)
      .toArray();

    console.log(`📊 Encontradas ${pesquisasPendentes.length} pesquisas para processar`);

    // Processa uma por vez
    for (const pesquisa of pesquisasPendentes) {
      if (pesquisa.id) {
        console.log(`\n--- Processando pesquisa ${pesquisa.id} ---`);
        await processarPesquisaComIA(pesquisa.id);
      }
    }

    console.log('\n✅ Processamento em lote concluído!');

  } catch (error) {
    console.error('❌ Erro ao processar lote:', error);
  }
}

/**
 * Verifica se deve processar automaticamente
 * (quando online e tem pesquisas pendentes)
 */
export async function verificarEProcessarAutomaticamente(): Promise<void> {
  if (!navigator.onLine) {
    console.log('⚠️ Offline - processamento adiado');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('⚠️ Usuário não autenticado - processamento adiado');
    return;
  }

  await processarPesquisasPendentes();
}
