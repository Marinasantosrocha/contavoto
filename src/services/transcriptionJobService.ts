import { supabase } from './supabaseClient';

export type TranscriptionJobStatus = 'pendente' | 'processando' | 'ok' | 'erro';

export interface TranscriptionJob {
  id?: string;
  pesquisa_id: string;
  audio_url: string;
  status: TranscriptionJobStatus;
  tentativas: number;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function enqueueTranscriptionJob(pesquisaUuid: string, audioUrl: string) {
  try {
    const payload: Omit<TranscriptionJob, 'id'> = {
      pesquisa_id: pesquisaUuid,
      audio_url: audioUrl,
      status: 'pendente',
      tentativas: 0,
      last_error: null,
    };

    const { error } = await supabase.from('transcription_jobs').insert(payload);
    if (error) {
      console.warn('Falha ao enfileirar job de transcrição:', error.message || error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e: any) {
    console.warn('Erro ao enfileirar job de transcrição:', e);
    return { ok: false, error: e };
  }
}

/**
 * Garante que todas as pesquisas com áudio e sem transcrição tenham um job na fila.
 * Útil para o modo superadmin ao rodar "Sincronizar agora".
 */
export async function ensureJobsForPendingTranscriptions() {
  // Busca pesquisas pendentes
  const pendentesQuery = supabase
    .from('pesquisas')
    .select('id, audio_url')
    .or('stt_status.is.null,stt_status.eq.pendente,stt_status.eq.erro,stt_status.eq.processando')
    .not('audio_url', 'is', null)
    .limit(1000);

  const { data: pendentes, error: pendErr } = await pendentesQuery;
  if (pendErr) {
    console.warn('Falha ao consultar pendências para enfileirar:', pendErr);
    return { ok: false, error: pendErr };
  }

  for (const p of pendentes || []) {
    if (!p.id || !p.audio_url) continue;
    // Verifica se já há job pendente/processando
    const { data: jobs, error: jobErr } = await supabase
      .from('transcription_jobs')
      .select('id, status')
      .eq('pesquisa_id', p.id)
      .in('status', ['pendente', 'processando'])
      .limit(1);
    if (jobErr) {
      console.warn('Erro ao verificar jobs existentes:', jobErr);
      continue;
    }
    if (!jobs || jobs.length === 0) {
      await enqueueTranscriptionJob(p.id, p.audio_url);
    }
  }
  return { ok: true };
}
