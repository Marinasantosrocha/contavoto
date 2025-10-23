-- Tabela de fila de transcrição
create table if not exists public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  pesquisa_id uuid not null,
  audio_url text not null,
  status text not null check (status in ('pendente','processando','ok','erro')) default 'pendente',
  tentativas int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função específica para esta tabela (evita conflito com a função genérica
-- usada em outras tabelas que têm a coluna 'atualizado_em')
create or replace function public.update_transcription_jobs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_transcription_jobs_updated_at on public.transcription_jobs;
create trigger trg_transcription_jobs_updated_at
  before update on public.transcription_jobs
  for each row execute function public.update_transcription_jobs_updated_at();

-- Índices úteis
create index if not exists idx_transcription_jobs_status on public.transcription_jobs(status);
create index if not exists idx_transcription_jobs_pesquisa on public.transcription_jobs(pesquisa_id);

-- RLS (em dev, permitir geral; em prod, restringir)
alter table public.transcription_jobs enable row level security;

-- Política permissiva para desenvolvimento (idempotente)
drop policy if exists "Allow all on transcription_jobs (dev)" on public.transcription_jobs;
create policy "Allow all on transcription_jobs (dev)"
  on public.transcription_jobs
  for all
  to public
  using (true)
  with check (true);
