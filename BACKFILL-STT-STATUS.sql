-- Normaliza status de STT para pesquisas que já possuem áudio
-- Rodar uma vez após criar o trigger de enfileiramento

update public.pesquisas
set stt_status = 'pendente'
where audio_url is not null
  and coalesce(stt_status, 'pendente') <> 'concluido';
