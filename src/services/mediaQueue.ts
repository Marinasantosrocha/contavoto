import { db, MediaJob } from '../db/localDB';
import { supabase, isOnline } from './supabaseClient';

function backoffMillis(tentativas: number) {
  // 5s, 15s, 30s, 60s ... (cap em 5 min)
  const base = [5000, 15000, 30000, 60000];
  return base[Math.min(tentativas, base.length - 1)];
}

export async function enqueueAudioJob(pesquisaId: number, uuid?: string) {
  await db.mediaJobs.add({
    pesquisaId,
    uuid,
    tipo: 'audio',
    status: 'pendente',
    tentativas: 0,
    criadoEm: Date.now(),
  });
}

export async function processMediaQueueOnce() {
  if (!isOnline()) return;

  const now = Date.now();
  const jobs = await db.mediaJobs
    .filter(j => j.status !== 'ok' && (!j.proximaTentativa || j.proximaTentativa <= now))
    .toArray();

  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (e: any) {
      console.error('Erro no job de mídia:', e);
    }
  }
}

async function processJob(job: MediaJob) {
  const pesquisa = await db.pesquisas.get(job.pesquisaId);
  if (!pesquisa) {
    // Nada a fazer, remover job
    await db.mediaJobs.delete(job.id!);
    return;
  }

  // Precisamos do uuid remoto da pesquisa
  let uuid = job.uuid || pesquisa.uuid;
  if (!uuid) {
    // Sem uuid ainda: não subimos o áudio aqui.
    // O fluxo de sincronização principal deve criar/atualizar a pesquisa e atribuir o uuid.
    // Reagendar o job para daqui a 15s.
    await db.mediaJobs.update(job.id!, {
      tentativas: job.tentativas + 1,
      proximaTentativa: Date.now() + backoffMillis(job.tentativas),
      ultimoErro: 'Aguardando UUID da pesquisa para upload do áudio.'
    });
    return;
  }

  if (!pesquisa.audioBlob) {
    // Sem áudio, nada a enviar: concluir job
    await db.mediaJobs.update(job.id!, { status: 'ok' });
    return;
  }

  // Enviar áudio
  await db.mediaJobs.update(job.id!, { status: 'enviando' });

  const timestamp = Date.now();
  const fileName = `audio_${uuid}_${timestamp}.webm`;

  const { error: uploadError } = await supabase
    .storage
    .from('audio-pesquisa')
    .upload(fileName, pesquisa.audioBlob, {
      contentType: 'audio/webm',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    await db.mediaJobs.update(job.id!, {
      status: 'erro',
      tentativas: job.tentativas + 1,
      proximaTentativa: Date.now() + backoffMillis(job.tentativas),
      ultimoErro: String(uploadError.message || uploadError),
    });
    return;
  }

  const { data: urlData } = supabase
    .storage
    .from('audio-pesquisa')
    .getPublicUrl(fileName);

  const audioUrl = urlData.publicUrl;

  // Atualiza pesquisa remota e local com audio_url
  if (uuid) {
    await supabase
      .from('pesquisas')
      .update({ audio_url: audioUrl, audio_duracao: pesquisa.audio_duracao, transcricao_completa: pesquisa.transcricao_completa })
      .eq('id', uuid);
  }

  await db.pesquisas.update(job.pesquisaId, { audio_url: audioUrl, sincronizado: true });
  await db.mediaJobs.update(job.id!, { status: 'ok' });
}
