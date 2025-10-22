-- CRIAR-RESPOSTAS-BURITIZEIRO.sql
-- Objetivo: Criar a tabela "respostas_formulario_buritizeiro" e um fluxo automático
-- (função + trigger) que preenche/atualiza essa tabela sempre que as colunas
-- public.pesquisas.respostas_ia (jsonb) e/ou public.pesquisas.observacoes_ia (text)
-- forem gravadas/atualizadas.
--
-- Assumptions (confirme e ajuste se necessário):
-- 1) Tabela-fonte: public.pesquisas
-- 2) Colunas de origem: respostas_ia jsonb, observacoes_ia text
-- 3) Chave primária de pesquisas: id uuid
-- 4) Não alteramos a IA nem as tabelas existentes; só criamos uma tabela colunares
--    e automatizamos o preenchimento via trigger.
--
-- Se seus nomes/tipos diferirem, ajuste os pontos marcados abaixo.

-- 0) Extensão para gerar UUIDs, se não estiver ativa
create extension if not exists pgcrypto;

-- 1) Tabela de respostas normalizadas (1 linha por pesquisa)
create table if not exists public.respostas_formulario_buritizeiro (
  id uuid primary key default gen_random_uuid(),
  pesquisa_id uuid not null references public.pesquisas(id) on delete cascade,

  -- Dados do respondente
  nome_morador text,
  faixa_etaria text,
  tempo_moradia text,

  -- Respostas das perguntas (cada uma em sua coluna)
  pavimentacao text,
  estradas text,
  limpeza_urbana text,
  iluminacao_publica text,
  atendimento_saude text,
  acesso_saude text,
  educacao text,
  seguranca_publica text,
  problema_cidade text,
  area_avanco text,
  voz_em_brasilia text,
  melhoria_com_representante text,
  prioridade_deputado text,
  autorizacao_contato text,
  whatsapp text,

  -- Observação livre gerada pela IA
  observacao text,

  -- Metadados
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Guarda o JSON bruto para auditoria/recálculo se necessário
  fonte_json jsonb
);

-- Garantir 1 linha por pesquisa
create unique index if not exists ux_respostas_buritizeiro_pesquisa
  on public.respostas_formulario_buritizeiro(pesquisa_id);

-- 2) Helpers de normalização
create or replace function public._normalize_opiniao(val text)
returns text language sql immutable as $$
  select case trim(lower(coalesce(val,'')))
    when 'melhoraram' then 'Melhorou'
    when 'melhorou' then 'Melhorou'
    when 'piorou' then 'Piorou'
    when 'pioraram' then 'Piorou'
    when 'igual' then 'Igual'
    when 'não sabe' then 'Não sabe'
    when 'nao sabe' then 'Não sabe'
    else nullif(val,'')
  end;
$$;

create or replace function public._parse_date_br(val text)
returns date language plpgsql immutable as $$
declare d text;
begin
  if val is null or btrim(val) = '' then
    return null;
  end if;
  -- aceita 07/09/1991, 7/9/1991, 07-09-1991 e também somente ano (ex.: 1991 → 30/06/1991)
  d := replace(replace(val,'-','/'),' ','');
  if d ~ '^[0-3]?\d/[0-1]?\d/\d{4}$' then
    return to_date(d,'DD/MM/YYYY');
  end if;
  -- Apenas ano (4 dígitos): usar 30/06 como aproximação para cálculo de idade
  if d ~ '^\d{4}$' then
    return to_date('30/06/' || d, 'DD/MM/YYYY');
  end if;
  return null; -- não força parse se formato diferente
end;
$$;

create or replace function public._normalize_whatsapp(val text)
returns text language plpgsql immutable as $$
declare only_digits text;
begin
  if val is null then return null; end if;
  only_digits := regexp_replace(val, '\\D', '', 'g');
  if length(only_digits) < 10 then
    return null;
  end if;
  -- opcional: normalizar para +55xxxxxxxxxxx (com suposição simples)
  if position('55' in only_digits) = 1 then
    return '+' || only_digits;
  end if;
  return only_digits; -- mantém só os dígitos
end;
$$;

-- Normalização e derivação de faixa etária
create or replace function public._normalize_faixa(val text)
returns text language sql immutable as $$
  select case trim(lower(coalesce(val,'')))
    when '16–24' then '16–24'
    when '16-24' then '16–24'
    when '16 a 24' then '16–24'
    when '25–34' then '25–34'
    when '25-34' then '25–34'
    when '25 a 34' then '25–34'
    when '35–44' then '35–44'
    when '35-44' then '35–44'
    when '35 a 44' then '35–44'
    when '45–59' then '45–59'
    when '45-59' then '45–59'
    when '45 a 59' then '45–59'
    when '60+' then '60+'
    when '60 +'
      then '60+'
    when 'prefere não dizer' then 'Prefere não dizer'
    when 'prefere nao dizer' then 'Prefere não dizer'
    else nullif(val,'')
  end;
$$;

create or replace function public._derive_faixa_por_idade(idade integer)
returns text language sql immutable as $$
  select case
    when idade is null then null
    when idade between 16 and 24 then '16–24'
    when idade between 25 and 34 then '25–34'
    when idade between 35 and 44 then '35–44'
    when idade between 45 and 59 then '45–59'
    when idade >= 60 then '60+'
    else null
  end;
$$;

create or replace function public._derive_faixa_por_data(dn date)
returns text language plpgsql immutable as $$
declare anos int;
begin
  if dn is null then return null; end if;
  anos := extract(year from age(current_date, dn));
  return public._derive_faixa_por_idade(anos);
end;
$$;

-- 3) Função principal de UPSERT a partir do JSON da IA e da observação
create or replace function public.upsert_respostas_buritizeiro(
  p_pesquisa_id uuid,
  p_ia jsonb default '{}'::jsonb,
  p_observacao text default null
) returns void language plpgsql as $$
declare
  v_nome text;
  v_data_nasc date;
  v_faixa_input text;
  v_faixa_derivada text;
  v_faixa text;
  v_tempo text;

  v_pav text; v_estradas text; v_limpeza text; v_ilum text;
  v_atend text; v_acesso text; v_educ text; v_seg text;
  v_problema text; v_avanco text; v_voz text; v_melhoria text;
  v_prioridade text; v_autoriza text; v_whats text;

  v_exist record;
begin
  -- Valores normalizados a partir do JSON
  v_nome := nullif(p_ia->>'nome_morador','');
  v_data_nasc := public._parse_date_br(p_ia->>'data_nascimento');
  -- faixa pode vir explícita nas opções ou ser derivada da data/ano
  v_faixa_input := public._normalize_faixa(p_ia->>'faixa_etaria');
  v_faixa_derivada := public._derive_faixa_por_data(v_data_nasc);
  v_faixa := coalesce(v_faixa_input, v_faixa_derivada);
  v_tempo := nullif(p_ia->>'tempo_moradia','');

  v_pav := public._normalize_opiniao(p_ia->>'pavimentacao');
  v_estradas := public._normalize_opiniao(p_ia->>'estradas');
  v_limpeza := public._normalize_opiniao(p_ia->>'limpeza_urbana');
  v_ilum := public._normalize_opiniao(p_ia->>'iluminacao_publica');
  v_atend := public._normalize_opiniao(p_ia->>'atendimento_saude');
  v_acesso := public._normalize_opiniao(p_ia->>'acesso_saude');
  v_educ := public._normalize_opiniao(p_ia->>'educacao');
  v_seg := public._normalize_opiniao(p_ia->>'seguranca_publica');
  v_problema := nullif(p_ia->>'problema_cidade','');
  v_avanco := nullif(p_ia->>'area_avanco','');
  v_voz := nullif(p_ia->>'voz_em_brasilia','');
  v_melhoria := nullif(p_ia->>'melhoria_com_representante','');
  v_prioridade := nullif(p_ia->>'prioridade_deputado','');
  v_autoriza := nullif(p_ia->>'autorizacao_contato','');
  v_whats := public._normalize_whatsapp(p_ia->>'whatsapp');

  select * into v_exist
  from public.respostas_formulario_buritizeiro
  where pesquisa_id = p_pesquisa_id;

  if v_exist is null then
    -- Insert inicial
    insert into public.respostas_formulario_buritizeiro as r (
      pesquisa_id, fonte_json, observacao,
      nome_morador, faixa_etaria, tempo_moradia,
      pavimentacao, estradas, limpeza_urbana, iluminacao_publica,
      atendimento_saude, acesso_saude, educacao, seguranca_publica,
      problema_cidade, area_avanco, voz_em_brasilia, melhoria_com_representante,
      prioridade_deputado, autorizacao_contato, whatsapp,
      criado_em, atualizado_em
    ) values (
      p_pesquisa_id, p_ia, p_observacao,
      v_nome, v_faixa, v_tempo,
      v_pav, v_estradas, v_limpeza, v_ilum,
      v_atend, v_acesso, v_educ, v_seg,
      v_problema, v_avanco, v_voz, v_melhoria,
      v_prioridade, v_autoriza, v_whats,
      now(), now()
    );
  else
    -- Update preservando o que não veio neste evento (coalesce com valores atuais)
    update public.respostas_formulario_buritizeiro r
    set fonte_json = case when p_ia is not null and p_ia <> '{}'::jsonb then p_ia else r.fonte_json end,
        observacao = coalesce(p_observacao, r.observacao),
  nome_morador = coalesce(v_nome, r.nome_morador),
  faixa_etaria = coalesce(v_faixa, r.faixa_etaria),
        tempo_moradia = coalesce(v_tempo, r.tempo_moradia),
        pavimentacao = coalesce(v_pav, r.pavimentacao),
        estradas = coalesce(v_estradas, r.estradas),
        limpeza_urbana = coalesce(v_limpeza, r.limpeza_urbana),
        iluminacao_publica = coalesce(v_ilum, r.iluminacao_publica),
        atendimento_saude = coalesce(v_atend, r.atendimento_saude),
        acesso_saude = coalesce(v_acesso, r.acesso_saude),
        educacao = coalesce(v_educ, r.educacao),
        seguranca_publica = coalesce(v_seg, r.seguranca_publica),
        problema_cidade = coalesce(v_problema, r.problema_cidade),
        area_avanco = coalesce(v_avanco, r.area_avanco),
        voz_em_brasilia = coalesce(v_voz, r.voz_em_brasilia),
        melhoria_com_representante = coalesce(v_melhoria, r.melhoria_com_representante),
        prioridade_deputado = coalesce(v_prioridade, r.prioridade_deputado),
        autorizacao_contato = coalesce(v_autoriza, r.autorizacao_contato),
        whatsapp = coalesce(v_whats, r.whatsapp),
        atualizado_em = now()
    where r.pesquisa_id = p_pesquisa_id;
  end if;
end;
$$;

-- 4) Função de trigger: lê direto de public.pesquisas
-- Ajuste nomes da tabela/colunas caso os seus sejam diferentes
create or replace function public.trg_upsert_respostas_buritizeiro_fn()
returns trigger language plpgsql as $$
begin
  -- Se nenhum dos dois foi informado, não faz nada
  if new.respostas_ia is null and new.observacoes_ia is null then
    return new;
  end if;

  perform public.upsert_respostas_buritizeiro(
    new.id::uuid,
    coalesce(new.respostas_ia, '{}'::jsonb),
    new.observacoes_ia
  );

  return new;
end;
$$;

-- 5) Trigger: dispara em insert e em updates dessas colunas
-- Ajuste o schema/nome da tabela se necessário
do $$ begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'pesquisas'
  ) then
    -- Drop e recria para garantir estado idempotente
    if exists (
      select 1 from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where t.tgname = 'trg_upsert_respostas_buritizeiro'
        and n.nspname = 'public' and c.relname = 'pesquisas'
    ) then
      drop trigger trg_upsert_respostas_buritizeiro on public.pesquisas;
    end if;

    create trigger trg_upsert_respostas_buritizeiro
    after insert or update of respostas_ia, observacoes_ia on public.pesquisas
    for each row
    when (new.respostas_ia is not null or new.observacoes_ia is not null)
    execute function public.trg_upsert_respostas_buritizeiro_fn();
  end if;
end $$;

-- 6) Backfill opcional (execute manualmente quando quiser)
-- Descomente a linha abaixo para preencher a tabela a partir dos dados já existentes
-- insert into public.respostas_formulario_buritizeiro (pesquisa_id, fonte_json, observacao)
-- select p.id, p.respostas_ia, p.observacoes_ia
-- from public.pesquisas p
-- where (p.respostas_ia is not null or p.observacoes_ia is not null)
-- on conflict (pesquisa_id) do nothing;
--
-- Alternativamente, rodar a função para aproveitar normalização/coalesce:
-- select public.upsert_respostas_buritizeiro(p.id::uuid, coalesce(p.respostas_ia,'{}'::jsonb), p.observacoes_ia)
-- from public.pesquisas p
-- where (p.respostas_ia is not null or p.observacoes_ia is not null);
