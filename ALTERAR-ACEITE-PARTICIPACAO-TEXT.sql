-- Alterar coluna aceite_participacao de BOOLEAN para TEXT
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, alterar o tipo da coluna convertendo valores booleanos para texto
ALTER TABLE pesquisas
ALTER COLUMN aceite_participacao TYPE TEXT USING 
  CASE 
    WHEN aceite_participacao = TRUE THEN 'true'
    WHEN aceite_participacao = FALSE THEN 'false'
    ELSE NULL
  END;

-- Comentário da coluna
COMMENT ON COLUMN pesquisas.aceite_participacao IS 'Aceite de participação: "true" (aceitou), "false" (recusou), "ausente" (não estava em casa)';

