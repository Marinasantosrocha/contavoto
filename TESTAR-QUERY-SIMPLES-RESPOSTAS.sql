-- TESTAR-QUERY-SIMPLES-RESPOSTAS.sql
--
-- Este script testa a query mais simples possível para buscar respostas

-- 1. Contar respostas para pesquisas aceitas (SEM NENHUM FILTRO)
SELECT 
    COUNT(*) AS total_respostas
FROM 
    public.respostas_formulario_buritizeiro rfb
INNER JOIN 
    public.pesquisas p ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true'
    AND p.status != 'cancelada';

-- 2. Ver algumas respostas (apenas as colunas principais)
SELECT 
    rfb.id,
    rfb.pesquisa_id,
    rfb.saude_publica,
    rfb.educacao,
    rfb.seguranca_publica,
    p.cidade,
    p.entrevistador,
    p.iniciada_em
FROM 
    public.respostas_formulario_buritizeiro rfb
INNER JOIN 
    public.pesquisas p ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true'
    AND p.status != 'cancelada'
LIMIT 10;

-- 3. Ver estrutura completa da tabela respostas_formulario_buritizeiro
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

