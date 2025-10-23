-- Garante enfileiramento de transcrição ao salvar/atualizar áudio
-- Idempotente: cria função, trigger e índice único parcial

-- Índice único parcial evita jobs duplicados para a mesma pesquisa em estados "ativos"
create unique index if not exists uq_transcription_jobs_ativos
on public.transcription_jobs(pesquisa_id)
where status in ('pendente','processando');

-- Função que enfileira job de transcrição quando apropriado
create or replace function public.enqueue_transcription_job_from_pesquisas()
returns trigger as $$
begin
  -- Apenas quando há áudio
  if new.audio_url is not null then
    -- Se a STT ainda não foi concluída (qualquer estado diferente de 'concluido' ou null)
    if coalesce(new.stt_status, 'pendente') <> 'concluido' then
      -- Cria job se não existir um pendente/processando
      if not exists (
        select 1 from public.transcription_jobs j
        where j.pesquisa_id = new.id
          and j.status in ('pendente','processando')
      ) then
        insert into public.transcription_jobs (pesquisa_id, audio_url, status, tentativas)
        values (new.id, new.audio_url, 'pendente', 0)
        on conflict do nothing;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger: após inserir ou atualizar audio_url/stt_status
drop trigger if exists trg_enqueue_stt on public.pesquisas;
create trigger trg_enqueue_stt
after insert or update of audio_url, stt_status on public.pesquisas
for each row execute function public.enqueue_transcription_job_from_pesquisas();
