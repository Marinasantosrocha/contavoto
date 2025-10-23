import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './ConfiguracoesPage.css';

interface PendenciaSTT {
  id: string;
  formulario_nome: string;
  entrevistador: string;
  audio_url: string | null;
  audio_duracao: number | null;
  stt_status: string | null;
  stt_erro: string | null;
  iniciado_em?: string;
  finalizada_em?: string | null;
}

export function TranscricoesPage({ onVoltar }: { onVoltar: () => void }) {
  const [itens, setItens] = useState<PendenciaSTT[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarPendentes() {
    setLoading(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('id, formulario_nome, entrevistador, audio_url, audio_duracao, stt_status, stt_erro, iniciada_em:iniciada_em, finalizada_em')
        .or('stt_status.is.null,stt_status.eq.pendente,stt_status.eq.erro,stt_status.eq.processando')
        .not('audio_url', 'is', null)
        .order('atualizado_em', { ascending: true })
        .limit(1000);

      if (error) throw error;
      setItens((data || []) as any);
    } catch (e: any) {
      setErro(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarPendentes();
  }, []);

  async function executarSincronizacao() {
    if (!navigator.onLine) {
      alert('Você está offline. Conecte-se à internet para sincronizar.');
      return;
    }
    setSyncing(true);
    setErro(null);
    try {
      // 1) Processar uploads de mídia pendentes
      try {
        const { processMediaQueueOnce } = await import('../services/mediaQueue');
        await processMediaQueueOnce();
      } catch {}

      // 2) Sincronizar formulários e pesquisas
      const { PesquisaService } = await import('../services/pesquisaService');
      await PesquisaService.sincronizar();

      // 2.1) Garantir enfileiramento para pendências (fallback seguro)
      try {
        const { ensureJobsForPendingTranscriptions } = await import('../services/transcriptionJobService');
        await ensureJobsForPendingTranscriptions();
      } catch {}

      // 3) Processar IA (se aplicável no app)
      try {
        const { verificarEProcessarAutomaticamente } = await import('../services/syncService');
        await verificarEProcessarAutomaticamente();
      } catch {}

      await carregarPendentes();
      alert('Sincronização executada. Lista atualizada.');
    } catch (e: any) {
      setErro(e.message || String(e));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Transcrições e IA</h2>
        <button className="btn btn-secondary" onClick={onVoltar}>Voltar</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <strong>Pendências de Transcrição</strong>
            <p className="muted">Listando entrevistas finalizadas com áudio, sem transcrição.</p>
          </div>
          <div className="actions">
            <button className="btn" onClick={executarSincronizacao} disabled={syncing || !navigator.onLine}>
              {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
            <button className="btn btn-primary" onClick={carregarPendentes} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar lista'}
            </button>
          </div>
        </div>

        {erro && <div className="alert alert-error">{erro}</div>}

        <div className="table">
          <div className="table-row table-header">
            <div>ID</div>
            <div>Formulário</div>
            <div>Entrevistador</div>
            <div>Duração</div>
            <div>Status STT</div>
            <div>Erro</div>
          </div>
          {itens.map((p) => (
            <div key={p.id} className="table-row">
              <div>{p.id.slice(0,8)}…</div>
              <div>{p.formulario_nome}</div>
              <div>{p.entrevistador}</div>
              <div>{p.audio_duracao ? `${p.audio_duracao}s` : '-'}</div>
              <div>
                <span className={`badge badge-${(p.stt_status||'pendente')}`}>
                  {p.stt_status || 'pendente'}
                </span>
              </div>
              <div className="muted" title={p.stt_erro || ''}>{p.stt_erro?.slice(0,40) || '-'}</div>
            </div>
          ))}
          {itens.length === 0 && !loading && (
            <div className="table-row">
              <div className="muted" style={{ gridColumn: '1 / -1' }}>Sem pendências no momento.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <strong>Como processar</strong>
        </div>
        <ol className="list">
          <li>Abra o “programinha” de processamento no PC (worker).</li>
          <li>Ele vai ler essa lista e começar a transcrever automaticamente.</li>
          <li>Ao concluir, a transcrição aparece na pesquisa e o status muda para OK.</li>
        </ol>
      </div>
    </div>
  );
}
