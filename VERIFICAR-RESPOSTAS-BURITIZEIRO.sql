-- VERIFICAR-RESPOSTAS-BURITIZEIRO.sql
--
-- Este script verifica se existem respostas na tabela respostas_formulario_buritizeiro
-- e qual a relação com pesquisas aceitas.

-- 1. Contar total de respostas
SELECT 
    COUNT(*) AS total_respostas
FROM 
    public.respostas_formulario_buritizeiro;

-- 2. Contar respostas para pesquisas aceitas
SELECT 
    COUNT(DISTINCT rfb.id) AS respostas_com_aceite,
    COUNT(DISTINCT rfb.pesquisa_id) AS pesquisas_com_respostas
FROM 
    public.respostas_formulario_buritizeiro rfb
INNER JOIN 
    public.pesquisas p ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true';

-- 3. Ver estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name = 'respostas_formulario_buritizeiro'
ORDER BY 
    ordinal_position;

-- 4. Ver algumas respostas de exemplo (se houver)
SELECT 
    rfb.*,
    p.aceite_participacao
FROM 
    public.respostas_formulario_buritizeiro rfb
LEFT JOIN 
    public.pesquisas p ON rfb.pesquisa_id = p.id
LIMIT 5;

-- 5. Ver distribuição de respostas por aceite
SELECT 
    p.aceite_participacao,
    COUNT(rfb.id) AS total_respostas
FROM 
    public.pesquisas p
LEFT JOIN 
    public.respostas_formulario_buritizeiro rfb ON rfb.pesquisa_id = p.id
GROUP BY 
    p.aceite_participacao;

