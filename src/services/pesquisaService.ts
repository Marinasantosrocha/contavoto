import { db, Formulario, Pesquisa } from '../db/localDB';
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
      respostas: {},
      iniciadaEm: new Date(),
      status: 'em_andamento',
      sincronizado: false,
      latitude,
      longitude,
    });

    return id;
  }

  static async salvarResposta(pesquisaId: number, campoId: string, valor: any) {
    const pesquisa = await db.pesquisas.get(pesquisaId);
    if (!pesquisa) {
      throw new Error('Pesquisa não encontrada');
    }

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

  static async contarPesquisas() {
    return {
      total: await db.pesquisas.filter(p => !p.deletado).count(),
      emAndamento: await db.pesquisas.filter(p => !p.deletado && p.status === 'em_andamento').count(),
      finalizadas: await db.pesquisas.filter(p => !p.deletado && p.status === 'finalizada').count(),
      naoSincronizadas: await db.pesquisas.filter(p => !p.deletado && !p.sincronizado).count(),
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
          const { error } = await supabase
            .from('pesquisas')
            .update({
              endereco: pesquisa.endereco,
              bairro: pesquisa.bairro,
              cidade: pesquisa.cidade,
              numero_residencia: pesquisa.numeroResidencia,
              ponto_referencia: pesquisa.pontoReferencia,
              nome_entrevistado: pesquisa.nomeEntrevistado,
              telefone_entrevistado: pesquisa.telefoneEntrevistado,
              respostas: pesquisa.respostas,
              latitude: pesquisa.latitude,
              longitude: pesquisa.longitude,
              entrevistador: pesquisa.entrevistador,
              finalizada_em: pesquisa.finalizadaEm?.toISOString(),
              status: pesquisa.status,
            })
            .eq('id', pesquisa.uuid);

          if (!error) {
            await db.pesquisas.update(pesquisa.id!, { sincronizado: true });
            console.log(`✅ Pesquisa ${pesquisa.id} atualizada`);
          }
        } else {
          // Inserir
          const { data, error } = await supabase
            .from('pesquisas')
            .insert({
              formulario_id: pesquisa.formularioUuid,
              formulario_nome: pesquisa.formularioNome,
              endereco: pesquisa.endereco,
              bairro: pesquisa.bairro,
              cidade: pesquisa.cidade,
              numero_residencia: pesquisa.numeroResidencia,
              ponto_referencia: pesquisa.pontoReferencia,
              nome_entrevistado: pesquisa.nomeEntrevistado,
              telefone_entrevistado: pesquisa.telefoneEntrevistado,
              respostas: pesquisa.respostas,
              latitude: pesquisa.latitude,
              longitude: pesquisa.longitude,
              entrevistador: pesquisa.entrevistador,
              iniciada_em: pesquisa.iniciadaEm.toISOString(),
              finalizada_em: pesquisa.finalizadaEm?.toISOString(),
              status: pesquisa.status,
            })
            .select()
            .single();

          if (!error && data) {
            await db.pesquisas.update(pesquisa.id!, {
              uuid: data.id,
              sincronizado: true,
            });
            console.log(`✅ Pesquisa ${pesquisa.id} inserida com UUID ${data.id}`);
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
      // Importa o formulário modelo
      const { formularioPortaAPortaModelo } = await import('../data/formularioModelo');
      await this.salvarFormulario(formularioPortaAPortaModelo);
      console.log('✅ Formulário modelo criado');
    }
  }
}

