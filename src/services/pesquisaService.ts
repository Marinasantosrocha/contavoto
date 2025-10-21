import { db, Formulario } from '../db/localDB';
import { supabase, isOnline } from './supabaseClient';

export class PesquisaService {
  private static isSyncing = false;

  // ============ FORMULÁRIOS ============
  
  static async salvarFormulario(formulario: Omit<Formulario, 'id' | 'criadoEm' | 'sincronizado'>) {
    const id = await db.formularios.add({
      ...formulario,
      criadoEm: new Date(),
      sincronizado: false,
    });

    if (isOnline()) {
      await this.sincronizar();
    }

    return id;
  }

  static async buscarFormularios() {
    return await db.formularios.toArray();
  }

  static async buscarFormularioPorId(id: number) {
    return await db.formularios.get(id);
  }

  // ============ PESQUISAS ============

  static async criarPesquisa(
    formularioId: number,
    entrevistador: string,
    endereco: string,
    bairro: string,
    cidade: string
  ): Promise<number> {
    const formulario = await db.formularios.get(formularioId);
    if (!formulario) {
      throw new Error('Formulário não encontrado');
    }

    // Obter ID do usuário logado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const usuario_id = user.id;

    // Tenta obter geolocalização
    let latitude: number | undefined;
    let longitude: number | undefined;
    
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        console.log('Geolocalização não disponível:', error);
      }
    }

    const id = await db.pesquisas.add({
      formularioId,
      formularioUuid: formulario.uuid,
      formularioNome: formulario.nome,
      endereco,
      bairro,
      cidade,
      entrevistador,
      usuario_id,
      respostas: {},
      iniciadaEm: new Date(),
      status: 'em_andamento',
      sincronizado: false,
      latitude,
      longitude,
    });

    return Number(id);
  }

  static async salvarResposta(pesquisaId: number, campoId: string, valor: any) {
    const pesquisa = await db.pesquisas.get(pesquisaId);
    if (!pesquisa) {
      throw new Error('Pesquisa não encontrada');
    }

    // Campos especiais salvos diretamente na estrutura da pesquisa
    if (campoId === 'aceite_participacao') {
      await db.pesquisas.update(pesquisaId, {
        aceite_participacao: valor,
        sincronizado: false,
      });
      return;
    }

    if (campoId === 'motivo_recusa') {
      await db.pesquisas.update(pesquisaId, {
        motivo_recusa: valor,
        sincronizado: false,
      });
      return;
    }

    // Demais campos são salvos em respostas
    const novasRespostas = {
      ...pesquisa.respostas,
      [campoId]: valor,
    };

    await db.pesquisas.update(pesquisaId, {
      respostas: novasRespostas,
      sincronizado: false,
    });
  }

  static async finalizarPesquisa(
    pesquisaId: number,
    nomeEntrevistado?: string,
    telefoneEntrevistado?: string
  ) {
    await db.pesquisas.update(pesquisaId, {
      status: 'finalizada',
      finalizadaEm: new Date(),
      nomeEntrevistado,
      telefoneEntrevistado,
      sincronizado: false,
    });

    // Enfileira job de mídia (caso exista áudio salvo antes do finish)
    try {
      const { enqueueAudioJob } = await import('./mediaQueue');
      await enqueueAudioJob(pesquisaId);
    } catch (e) {
      console.warn('Fila de mídia não disponível:', e);
    }

    if (isOnline()) {
      await this.sincronizar();
    }
  }

  static async cancelarPesquisa(pesquisaId: number) {
    await db.pesquisas.update(pesquisaId, {
      status: 'cancelada',
      sincronizado: false,
    });
  }

  static async deletarPesquisa(pesquisaId: number) {
    await db.pesquisas.update(pesquisaId, {
      deletado: true,
      sincronizado: false,
    });

    if (isOnline()) {
      await this.sincronizar();
    }
  }

  static async buscarPesquisas(filtro?: {
    status?: 'em_andamento' | 'finalizada' | 'cancelada';
    formularioId?: number;
  }) {
    let query = db.pesquisas.filter(p => !p.deletado);

    if (filtro?.status) {
      query = query.filter(p => p.status === filtro.status);
    }

    if (filtro?.formularioId) {
      query = query.filter(p => p.formularioId === filtro.formularioId);
    }

    return await query.reverse().sortBy('iniciadaEm');
  }

  static async buscarPesquisaPorId(id: number) {
    return await db.pesquisas.get(id);
  }

  static async contarPesquisas(usuario_id?: number) {
    const filtro = usuario_id 
      ? (p: any) => !p.deletado && p.usuario_id === usuario_id
      : (p: any) => !p.deletado;

    return {
      total: await db.pesquisas.filter(filtro).count(),
      emAndamento: await db.pesquisas.filter(p => filtro(p) && p.status === 'em_andamento').count(),
      finalizadas: await db.pesquisas.filter(p => filtro(p) && p.status === 'finalizada').count(),
      naoSincronizadas: await db.pesquisas.filter(p => filtro(p) && !p.sincronizado).count(),
    };
  }

  // ============ SINCRONIZAÇÃO ============

  static async sincronizar() {
    if (!isOnline() || this.isSyncing) {
      console.log('Offline ou sincronização já em andamento');
      return { sucesso: false, mensagem: 'Offline ou já sincronizando' };
    }

    this.isSyncing = true;
    console.log('🔄 Iniciando sincronização...');

    try {
      // 1. Sincronizar Formulários
      await this.sincronizarFormularios();

      // 2. Sincronizar Pesquisas
      await this.sincronizarPesquisas();

      console.log('✅ Sincronização concluída!');
      return { sucesso: true, mensagem: 'Sincronização concluída' };
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return { sucesso: false, mensagem: 'Erro na sincronização', error };
    } finally {
      this.isSyncing = false;
    }
  }

  private static async sincronizarFormularios() {
    const formulariosNaoSincronizados = await db.formularios
      .filter(f => !f.sincronizado)
      .toArray();

    for (const formulario of formulariosNaoSincronizados) {
      try {
        if (formulario.uuid) {
          // Atualizar
          const { error } = await supabase
            .from('formularios')
            .update({
              nome: formulario.nome,
              descricao: formulario.descricao,
              pre_candidato: formulario.preCandidato,
              telefone_contato: formulario.telefoneContato,
              campos: formulario.campos,
            })
            .eq('id', formulario.uuid);

          if (!error) {
            await db.formularios.update(formulario.id!, { sincronizado: true });
          }
        } else {
          // Inserir
          const { data, error } = await supabase
            .from('formularios')
            .insert({
              nome: formulario.nome,
              descricao: formulario.descricao,
              pre_candidato: formulario.preCandidato,
              telefone_contato: formulario.telefoneContato,
              campos: formulario.campos,
            })
            .select()
            .single();

          if (!error && data) {
            await db.formularios.update(formulario.id!, {
              uuid: data.id,
              sincronizado: true,
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao sincronizar formulário ${formulario.id}:`, error);
      }
    }
  }

  private static async sincronizarPesquisas() {
    const pesquisasNaoSincronizadas = await db.pesquisas
      .filter(p => !p.sincronizado)
      .toArray();

    console.log(`📤 ${pesquisasNaoSincronizadas.length} pesquisas para sincronizar`);

    for (const pesquisa of pesquisasNaoSincronizadas) {
      try {
        if (pesquisa.deletado && pesquisa.uuid) {
          // Deletar no Supabase
          const { error } = await supabase
            .from('pesquisas')
            .delete()
            .eq('id', pesquisa.uuid);

          if (!error) {
            await db.pesquisas.delete(pesquisa.id!);
            console.log(`🗑️ Pesquisa ${pesquisa.id} deletada`);
          }
        } else if (pesquisa.uuid) {
          // Atualizar
          const updateData: any = {
            endereco: pesquisa.endereco,
            bairro: pesquisa.bairro,
            cidade: pesquisa.cidade,
            numero_residencia: pesquisa.numeroResidencia,
            ponto_referencia: pesquisa.pontoReferencia,
            nome_entrevistado: pesquisa.nomeEntrevistado,
            telefone_entrevistado: pesquisa.telefoneEntrevistado,
            aceite_participacao: pesquisa.aceite_participacao,
            motivo_recusa: pesquisa.motivo_recusa,
            respostas: pesquisa.respostas,
            latitude: pesquisa.latitude,
            longitude: pesquisa.longitude,
            entrevistador: pesquisa.entrevistador,
            finalizada_em: pesquisa.finalizadaEm?.toISOString(),
            status: pesquisa.status,
          };

          // Adicionar campos de áudio (para UPDATE de pesquisas que já têm UUID)
          if (pesquisa.audio_duracao) {
            updateData.audio_duracao = pesquisa.audio_duracao;
          }
          if (pesquisa.transcricao_completa) {
            updateData.transcricao_completa = pesquisa.transcricao_completa;
          }
          if (pesquisa.processamento_ia_status) {
            updateData.processamento_ia_status = pesquisa.processamento_ia_status;
          }
          
          // Upload do áudio para UPDATE
          if (pesquisa.audioBlob && pesquisa.uuid) {
            try {
              const timestamp = new Date().getTime();
              const fileName = `audio_${pesquisa.uuid}_${timestamp}.webm`;
              
              console.log(`📤 Fazendo upload do áudio (UPDATE): ${fileName}`);
              
              const { error: uploadError } = await supabase
                .storage
                .from('audio-pesquisa')
                .upload(fileName, pesquisa.audioBlob, {
                  contentType: 'audio/webm',
                  cacheControl: '3600',
                  upsert: false
                });

              if (!uploadError) {
                const { data: urlData } = supabase
                  .storage
                  .from('audio-pesquisa')
                  .getPublicUrl(fileName);
                
                updateData.audio_url = urlData.publicUrl;
                console.log(`✅ Áudio enviado: ${urlData.publicUrl}`);
              }
            } catch (audioError) {
              console.error('❌ Erro no upload do áudio:', audioError);
            }
          }

          const { error } = await supabase
            .from('pesquisas')
            .update(updateData)
            .eq('id', pesquisa.uuid);

          if (!error) {
            await db.pesquisas.update(pesquisa.id!, { sincronizado: true });
            console.log(`✅ Pesquisa ${pesquisa.id} atualizada`);
            try {
              const { processMediaQueueOnce } = await import('./mediaQueue');
              await processMediaQueueOnce();
            } catch {}
          }
        } else {
          // Inserir
          const insertData: any = {
            formulario_id: pesquisa.formularioUuid,
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
            respostas: pesquisa.respostas,
            latitude: pesquisa.latitude,
            longitude: pesquisa.longitude,
            entrevistador: pesquisa.entrevistador,
            iniciada_em: pesquisa.iniciadaEm.toISOString(),
            finalizada_em: pesquisa.finalizadaEm?.toISOString(),
            status: pesquisa.status,
          };

          // Adicionar campos de áudio (duração e transcrição apenas)
          // O audio_url será adicionado DEPOIS do INSERT
          if (pesquisa.audio_duracao) {
            insertData.audio_duracao = pesquisa.audio_duracao;
          }
          if (pesquisa.transcricao_completa) {
            insertData.transcricao_completa = pesquisa.transcricao_completa;
          }
          if (pesquisa.processamento_ia_status) {
            insertData.processamento_ia_status = pesquisa.processamento_ia_status;
          }

          const { data, error } = await supabase
            .from('pesquisas')
            .insert(insertData)
            .select()
            .single();

          if (!error && data) {
            // Atualizar UUID localmente
            await db.pesquisas.update(pesquisa.id!, {
              uuid: data.id,
            });
            
            console.log(`✅ Pesquisa ${pesquisa.id} inserida com UUID ${data.id}`);
            // Atualiza job de mídia com uuid e processa uma vez
            try {
              const { mediaJobs } = db;
              const job = await mediaJobs.where({ pesquisaId: pesquisa.id! }).first();
              if (job && !job.uuid) {
                await mediaJobs.update(job.id!, { uuid: data.id, status: 'pendente', proximaTentativa: Date.now() });
              }
              const { processMediaQueueOnce } = await import('./mediaQueue');
              await processMediaQueueOnce();
            } catch {}
            
            // 🎙️ AGORA fazer upload do áudio (já temos o UUID)
            if (pesquisa.audioBlob) {
              try {
                const timestamp = new Date().getTime();
                const fileName = `audio_${data.id}_${timestamp}.webm`;
                
                console.log(`📤 Fazendo upload do áudio: ${fileName}`);
                
                const { error: uploadError } = await supabase
                  .storage
                  .from('audio-pesquisa')
                  .upload(fileName, pesquisa.audioBlob, {
                    contentType: 'audio/webm',
                    cacheControl: '3600',
                    upsert: false
                  });

                if (uploadError) {
                  console.error('❌ Erro ao fazer upload do áudio:', uploadError);
                } else {
                  // Gerar URL pública
                  const { data: urlData } = supabase
                    .storage
                    .from('audio-pesquisa')
                    .getPublicUrl(fileName);
                  
                  const audioUrl = urlData.publicUrl;
                  console.log(`✅ Áudio enviado: ${audioUrl}`);
                  
                  // Atualizar pesquisa com audio_url
                  const { error: updateError } = await supabase
                    .from('pesquisas')
                    .update({
                      audio_url: audioUrl,
                      audio_duracao: pesquisa.audio_duracao,
                      transcricao_completa: pesquisa.transcricao_completa,
                      processamento_ia_status: pesquisa.processamento_ia_status
                    })
                    .eq('id', data.id);
                  
                  if (!updateError) {
                    console.log(`✅ Áudio URL atualizado na pesquisa ${data.id}`);
                  }
                }
              } catch (audioError) {
                console.error('❌ Erro no processo de upload:', audioError);
              }
            }
            
            // Marcar como sincronizado de dados (o job cuidará do áudio)
            await db.pesquisas.update(pesquisa.id!, { sincronizado: true });
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao sincronizar pesquisa ${pesquisa.id}:`, error);
      }
    }
  }

  // ============ UTILIDADES ============

  static async limparTudo() {
    await db.formularios.clear();
    await db.pesquisas.clear();
    console.log('🧹 Banco local limpo');
  }

  static async inicializarFormularioModelo() {
    const count = await db.formularios.count();
    if (count === 0) {
      // Importa AMBOS os formulários
      const { 
        formularioPortaAPortaModelo,
        formularioPortaAPortaCompleto 
      } = await import('../data/formularioModelo');
      
      // Adicionar formulário de teste (4 perguntas)
      await this.salvarFormulario(formularioPortaAPortaModelo);
      console.log('✅ Formulário de teste criado (4 perguntas)');
      
      // Adicionar formulário completo
      await this.salvarFormulario(formularioPortaAPortaCompleto);
      console.log('✅ Formulário completo criado');
    }
  }
}



