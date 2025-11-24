-- ============================================
-- VERIFICAR: Campo WhatsApp na tabela pesquisas
-- ============================================

-- Ver se a coluna whatsapp existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pesquisas' 
AND column_name IN ('whatsapp', 'autorizacao_contato', 'data_nascimento');

-- Ver pesquisas com aceite = true e seus dados
SELECT 
  id,
  cidade,
  entrevistador,
  nome_entrevistado,
  data_nascimento,
  autorizacao_contato,
  whatsapp,
  aceite_participacao
FROM pesquisas
WHERE aceite_participacao = 'true'
ORDER BY iniciada_em DESC
LIMIT 10;

-- Contar quantas pesquisas têm whatsapp preenchido
SELECT 
  COUNT(*) as total,
  COUNT(whatsapp) FILTER (WHERE whatsapp IS NOT NULL AND whatsapp != '') as com_whatsapp,
  COUNT(autorizacao_contato) FILTER (WHERE autorizacao_contato IS NOT NULL AND autorizacao_contato != '') as com_autorizacao
FROM pesquisas
WHERE aceite_participacao = 'true';

-- Ver os dados da tabela respostas_formulario_buritizeiro (onde pode estar o whatsapp)
SELECT 
  p.id as pesquisa_id,
  p.nome_entrevistado,
  r.whatsapp as whatsapp_respostas,
  r.autorizacao_contato as autorizacao_respostas,
  p.whatsapp as whatsapp_pesquisas,
  p.autorizacao_contato as autorizacao_pesquisas
FROM pesquisas p
LEFT JOIN respostas_formulario_buritizeiro r ON r.pesquisa_id = p.id
WHERE p.aceite_participacao = 'true'
ORDER BY p.iniciada_em DESC
LIMIT 10;

