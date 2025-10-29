-- Opcional: manter as respostas geradas pela IA separadas das respostas finais
-- Execute somente se você quer separar (senão, já usamos a coluna `respostas` existente)

-- Adiciona coluna para armazenar respostas brutas da IA
ALTER TABLE IF EXISTS public.pesquisas
ADD COLUMN IF NOT EXISTS respostas_ia jsonb;

-- Adiciona coluna para observações/notas da IA (se necessário)
ALTER TABLE IF EXISTS public.pesquisas
ADD COLUMN IF NOT EXISTS observacoes_ia text;

-- Índice GIN opcional para consultas em jsonb
CREATE INDEX IF NOT EXISTS idx_pesquisas_respostas_ia_gin
ON public.pesquisas
USING GIN (respostas_ia);
