import { useEffect, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { db } from '../db/localDB';
import './AutoSync.css';

interface SyncStatus {
  isSync: boolean;
  total: number;
  current: number;
  currentPesquisaId?: number;
  error?: string;
}

/**
 * Componente que sincroniza automaticamente quando fica online
 * Mostra tela de status durante a sincronização
 */
export default function AutoSync() {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSync: false,
    total: 0,
    current: 0,
  });

  useEffect(() => {
    if (!isOnline) return;

    const checkAndSync = async () => {
      try {
        // Processa rapidamente a fila de mídia antes do sync
        try {
          const { processMediaQueueOnce } = await import('../services/mediaQueue');
          await processMediaQueueOnce();
        } catch {}

        // Garante enfileiramento de transcrições mesmo que não haja dados locais para sincronizar
        try {
          const { ensureJobsForPendingTranscriptions } = await import('../services/transcriptionJobService');
          await ensureJobsForPendingTranscriptions();
        } catch {}

        // Verifica se há pesquisas não sincronizadas
        const pesquisas = await db.pesquisas
          .filter((p) => !p.sincronizado)
          .toArray();

        if (pesquisas.length === 0) return;

        // Inicia sincronização
        setSyncStatus({
          isSync: true,
          total: pesquisas.length,
          current: 0,
        });

        // Sincroniza uma por uma
        for (let i = 0; i < pesquisas.length; i++) {
          const pesquisa = pesquisas[i];
          
          if (!pesquisa.id) continue;
          
          setSyncStatus({
            isSync: true,
            total: pesquisas.length,
            current: i + 1,
            currentPesquisaId: pesquisa.id,
          });

          try {
            // Aqui vai a lógica de sincronização
            await sincronizarPesquisa(pesquisa.id);
            
            // Aguarda um pouco entre cada sincronização
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`Erro ao sincronizar pesquisa ${pesquisa.id}:`, error);
            setSyncStatus({
              isSync: true,
              total: pesquisas.length,
              current: i + 1,
              currentPesquisaId: pesquisa.id,
              error: `Erro na pesquisa ${pesquisa.id}`,
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // Finaliza sincronização
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const { processMediaQueueOnce } = await import('../services/mediaQueue');
          await processMediaQueueOnce();
        } catch {}
        // Garante que todas as pesquisas com áudio e sem transcrição tenham job na fila
        try {
          const { ensureJobsForPendingTranscriptions } = await import('../services/transcriptionJobService');
          await ensureJobsForPendingTranscriptions();
        } catch (e) {
          console.warn('Não foi possível garantir enfileiramento de transcrições:', e);
        }
        // Dispara processamento de IA somente para superadmin
        try {
          const userStr = localStorage.getItem('user') || localStorage.getItem('usuario');
          const user = userStr ? JSON.parse(userStr) : null;
          const mapTipoToId = (tipo: string | undefined): number | undefined => {
            switch (tipo) {
              case 'pesquisador': return 1;
              case 'candidato': return 2;
              case 'suporte': return 3;
              case 'admin': return 4;
              case 'superadmin': return 5;
              default: return undefined;
            }
          };
          const tipoUsuarioId: number | undefined = typeof user?.tipo_usuario_id === 'number'
            ? user.tipo_usuario_id
            : mapTipoToId(user?.tipo_usuario);
          const isSuperAdmin = tipoUsuarioId === 5;
          if (isSuperAdmin) {
            const { verificarEProcessarAutomaticamente } = await import('../services/syncService');
            await verificarEProcessarAutomaticamente();
          }
        } catch (e) {
          console.error('Erro ao avaliar processamento de IA:', e);
        }
        setSyncStatus({
          isSync: false,
          total: 0,
          current: 0,
        });
      } catch (error) {
        console.error('Erro ao verificar sincronização:', error);
        setSyncStatus({
          isSync: false,
          total: 0,
          current: 0,
        });
      }
    };

    // Aguarda 2 segundos após ficar online para iniciar sincronização
    const timeout = setTimeout(checkAndSync, 2000);

    return () => clearTimeout(timeout);
  }, [isOnline]);

  // Não renderiza nada se não estiver sincronizando
  if (!syncStatus.isSync) return null;

  return (
    <div className="auto-sync-overlay">
      <div className="auto-sync-container">
        <div className="auto-sync-icon">
          <div className="sync-spinner"></div>
        </div>

        <h2 className="auto-sync-title">Sincronizando Dados</h2>
        
        <p className="auto-sync-subtitle">
          Aguarde enquanto enviamos as pesquisas para o servidor
        </p>

        <div className="sync-progress">
          <div className="sync-progress-bar">
            <div 
              className="sync-progress-fill"
              style={{ width: `${(syncStatus.current / syncStatus.total) * 100}%` }}
            ></div>
          </div>
          
          <p className="sync-progress-text">
            {syncStatus.current} de {syncStatus.total} pesquisas
          </p>
        </div>

        {syncStatus.currentPesquisaId && (
          <div className="sync-current-item">
            <div className="sync-current-icon">📄</div>
            <div className="sync-current-text">
              <span className="sync-current-label">Enviando:</span>
              <span className="sync-current-value">Pesquisa #{syncStatus.currentPesquisaId}</span>
            </div>
            {syncStatus.error ? (
              <div className="sync-current-status error">❌</div>
            ) : (
              <div className="sync-current-status success">✓</div>
            )}
          </div>
        )}

        {syncStatus.error && (
          <div className="sync-error">
            ⚠️ {syncStatus.error}
          </div>
        )}

        <p className="sync-warning">
          ⚠️ Não feche o aplicativo durante a sincronização
        </p>
      </div>
    </div>
  );
}

// Função auxiliar para sincronizar uma pesquisa
async function sincronizarPesquisa(pesquisaId: number): Promise<void> {
  const { supabase } = await import('../services/supabaseClient');

  const pesquisa = await db.pesquisas.get(pesquisaId);
  if (!pesquisa) throw new Error('Pesquisa não encontrada');

  // Monta payload compatível com o schema atual (criado_em/atualizado_em no banco; sem usuario_id)
  const payloadBase: any = {
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
    iniciada_em: pesquisa.iniciadaEm ? new Date(pesquisa.iniciadaEm).toISOString() : new Date().toISOString(),
    finalizada_em: pesquisa.finalizadaEm ? new Date(pesquisa.finalizadaEm).toISOString() : null,
    status: pesquisa.status,
  };

  if (pesquisa.uuid) {
    // UPDATE quando já existe no servidor
    const { error } = await supabase
      .from('pesquisas')
      .update(payloadBase)
      .eq('id', pesquisa.uuid);
    if (error) throw error;
    await db.pesquisas.update(pesquisaId, { sincronizado: true });
  } else {
    // INSERT quando ainda não tem UUID remoto
    const { data, error } = await supabase
      .from('pesquisas')
      .insert(payloadBase)
      .select()
      .single();
    if (error) throw error;
    if (data?.id) {
      await db.pesquisas.update(pesquisaId, { uuid: data.id, sincronizado: true });
      // Atualiza job de mídia, se existir, com o novo uuid
      try {
        const { mediaJobs } = db;
        const job = await mediaJobs.where({ pesquisaId }).first();
        if (job && !job.uuid) {
          await mediaJobs.update(job.id!, { uuid: data.id, status: 'pendente', proximaTentativa: Date.now() });
        }
      } catch {}
    }
  }
}
