-- VERIFICAR-FOREIGN-KEY-RESPOSTAS.sql
--
-- Este script verifica a foreign key entre respostas_formulario_buritizeiro e pesquisas

-- 1. Ver estrutura da tabela respostas_formulario_buritizeiro
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

-- 2. Ver foreign keys da tabela
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'respostas_formulario_buritizeiro';

-- 3. Teste simples de JOIN
SELECT 
    COUNT(*) AS total_com_join
FROM 
    public.respostas_formulario_buritizeiro rfb
INNER JOIN 
    public.pesquisas p ON rfb.pesquisa_id = p.id
WHERE 
    p.aceite_participacao = 'true';

-- 4. Ver se pesquisa_id tem valores válidos
SELECT 
    COUNT(DISTINCT pesquisa_id) AS pesquisas_distintas,
    COUNT(*) AS total_respostas
FROM 
    public.respostas_formulario_buritizeiro
WHERE 
    pesquisa_id IS NOT NULL;

