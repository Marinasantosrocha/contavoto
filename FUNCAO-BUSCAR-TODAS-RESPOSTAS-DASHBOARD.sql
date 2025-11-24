-- FUNCAO-BUSCAR-TODAS-RESPOSTAS-DASHBOARD.sql
--
-- Esta função retorna TODAS as respostas do formulário buritizeiro
-- apenas para pesquisas:
--   - com aceite_participacao = 'true'
--   - status != 'cancelada'
-- Já traz junto cidade, entrevistador e iniciada_em para que o
-- frontend possa aplicar os mesmos filtros do dashboard.
--
-- Para executar no Supabase SQL Editor:
--   SELECT * FROM public.buscar_todas_respostas_dashboard();
--
-- IMPORTANTE: use SECURITY DEFINER para contornar RLS de forma controlada.

DROP FUNCTION IF EXISTS public.buscar_todas_respostas_dashboard();

CREATE OR REPLACE FUNCTION public.buscar_todas_respostas_dashboard()
RETURNS TABLE (
  id uuid,
  pesquisa_id uuid,
  iniciada_em timestamptz,
  cidade text,
  entrevistador text,
  tempo_moradia text,
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
  conhece_deputado_federal text,
  deputado_renda_municipal text,
  importancia_deputado text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.pesquisa_id,
    p.iniciada_em,
    p.cidade,
    p.entrevistador,
    r.tempo_moradia,
    r.pavimentacao,
    r.estradas,
    r.limpeza_urbana,
    r.iluminacao_publica,
    r.atendimento_saude,
    r.acesso_saude,
    r.educacao,
    r.seguranca_publica,
    r.problema_cidade,
    r.area_avanco,
    r.voz_em_brasilia,
    r.melhoria_com_representante,
    r.prioridade_deputado,
    r.autorizacao_contato,
    r.whatsapp,
    r.conhece_deputado_federal,
    r.deputado_renda_municipal,
    r.importancia_deputado
  FROM
    public.respostas_formulario_buritizeiro r
    INNER JOIN public.pesquisas p ON p.id = r.pesquisa_id
  WHERE
    p.aceite_participacao = 'true'
    AND p.status <> 'cancelada'
  ORDER BY
    p.iniciada_em DESC;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_todas_respostas_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_todas_respostas_dashboard() TO service_role;


