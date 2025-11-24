-- VERIFICAR-FILTROS-DASHBOARD.sql
--
-- Este script verifica se os filtros do dashboard estão eliminando as respostas

-- 1. Ver quantas pesquisas aceitas existem (sem filtros de período)
SELECT 
    COUNT(*) AS pesquisas_aceitas_total
FROM 
    public.pesquisas
WHERE 
    aceite_participacao = 'true'
    AND status != 'cancelada';

-- 2. Ver quantas dessas têm respostas
SELECT 
    COUNT(DISTINCT p.id) AS pesquisas_aceitas_com_respostas
FROM 
    public.pesquisas p
INNER JOIN 
    public.respostas_formulario_buritizeiro rfb ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true'
    AND p.status != 'cancelada';

-- 3. Ver se as 669 pesquisas que o dashboard encontra têm respostas
-- (Essa query vai mostrar a distribuição)
SELECT 
    CASE 
        WHEN rfb.id IS NOT NULL THEN 'Com respostas'
        ELSE 'Sem respostas'
    END AS status_resposta,
    COUNT(*) AS total
FROM 
    public.pesquisas p
LEFT JOIN 
    public.respostas_formulario_buritizeiro rfb ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true'
    AND p.status != 'cancelada'
GROUP BY 
    CASE 
        WHEN rfb.id IS NOT NULL THEN 'Com respostas'
        ELSE 'Sem respostas'
    END;

-- 4. Ver IDs de algumas pesquisas aceitas que NÃO têm respostas
SELECT 
    p.id,
    p.entrevistador,
    p.cidade,
    p.iniciada_em
FROM 
    public.pesquisas p
LEFT JOIN 
    public.respostas_formulario_buritizeiro rfb ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true'
    AND p.status != 'cancelada'
    AND rfb.id IS NULL
LIMIT 10;

