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

  // Busca o usuário logado
  const usuarioStr = localStorage.getItem('usuario') || localStorage.getItem('user');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;

  // Upload para Supabase
  const { error } = await supabase
    .from('pesquisas')
    .upsert({
      id: pesquisa.id,
      formulario_id: pesquisa.formularioId,
      usuario_id: usuario?.id || null,
      endereco: pesquisa.endereco,
      bairro: pesquisa.bairro,
      cidade: pesquisa.cidade,
      respostas: pesquisa.respostas,
      status: pesquisa.status,
      aceite_participacao: pesquisa.aceite_participacao,
      motivo_recusa: pesquisa.motivo_recusa,
      finalizada_em: pesquisa.finalizadaEm,
      created_at: pesquisa.iniciadaEm,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  // Marca como sincronizada
  await db.pesquisas.update(pesquisaId, {
    sincronizado: true,
  });
}
