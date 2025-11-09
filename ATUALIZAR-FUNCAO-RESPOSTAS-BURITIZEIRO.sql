-- ATUALIZAR-FUNCAO-RESPOSTAS-BURITIZEIRO.sql
-- Objetivo: Atualizar a função upsert_respostas_buritizeiro para incluir
-- os 3 novos campos: conhece_deputado_federal, deputado_renda_municipal, importancia_deputado

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
  
  -- NOVOS CAMPOS
  v_conhece_deputado text;
  v_deputado_renda text;
  v_importancia_deputado text;

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
  
  -- EXTRAIR NOVOS CAMPOS
  v_conhece_deputado := nullif(p_ia->>'conhece_deputado_federal','');
  v_deputado_renda := nullif(p_ia->>'deputado_renda_municipal','');
  v_importancia_deputado := nullif(p_ia->>'importancia_deputado','');

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
      conhece_deputado_federal, deputado_renda_municipal, importancia_deputado,
      criado_em, atualizado_em
    ) values (
      p_pesquisa_id, p_ia, p_observacao,
      v_nome, v_faixa, v_tempo,
      v_pav, v_estradas, v_limpeza, v_ilum,
      v_atend, v_acesso, v_educ, v_seg,
      v_problema, v_avanco, v_voz, v_melhoria,
      v_prioridade, v_autoriza, v_whats,
      v_conhece_deputado, v_deputado_renda, v_importancia_deputado,
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
        conhece_deputado_federal = coalesce(v_conhece_deputado, r.conhece_deputado_federal),
        deputado_renda_municipal = coalesce(v_deputado_renda, r.deputado_renda_municipal),
        importancia_deputado = coalesce(v_importancia_deputado, r.importancia_deputado),
        atualizado_em = now()
    where r.pesquisa_id = p_pesquisa_id;
  end if;
end;
$$;

