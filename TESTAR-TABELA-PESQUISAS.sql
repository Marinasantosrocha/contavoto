-- ============================================
-- TESTAR: Tabela de pesquisas aceitas
-- ============================================

-- 1. Executar a função (deve estar criada primeiro via FUNCAO-BUSCAR-TODAS-PESQUISAS-TABELA.sql)
SELECT * FROM buscar_todas_pesquisas_tabela(10, 0);

-- 2. Ver dados diretamente na tabela
SELECT 
  id,
  cidade,
  endereco,
  SPLIT_PART(entrevistador, ' ', 1) as primeiro_nome,
  nome_entrevistado,
  data_nascimento,
  autorizacao_contato,
  whatsapp,
  aceite_participacao
FROM pesquisas
WHERE aceite_participacao = 'true'
ORDER BY iniciada_em DESC
LIMIT 10;

-- 3. Verificar quantas têm WhatsApp preenchido
SELECT 
  COUNT(*) as total_aceitas,
  COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as com_whatsapp,
  COUNT(CASE WHEN autorizacao_contato IS NOT NULL AND autorizacao_contato != '' THEN 1 END) as com_autorizacao,
  COUNT(CASE WHEN data_nascimento IS NOT NULL AND data_nascimento != '' THEN 1 END) as com_aniversario
FROM pesquisas
WHERE aceite_participacao = 'true';

-- 4. Ver exemplo de dados (primeiros 5 registros)
SELECT 
  cidade,
  endereco,
  entrevistador as entrevistador_completo,
  SPLIT_PART(entrevistador, ' ', 1) as primeiro_nome,
  nome_entrevistado as nome,
  data_nascimento as aniversario,
  autorizacao_contato,
  whatsapp
FROM pesquisas
WHERE aceite_participacao = 'true'
ORDER BY iniciada_em DESC
LIMIT 5;

