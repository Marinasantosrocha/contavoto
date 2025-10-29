-- Adiciona coluna para controle de status de transcrição pós-sincronização
-- Execute no Supabase SQL Editor

ALTER TABLE IF EXISTS public.pesquisas
ADD COLUMN IF NOT EXISTS stt_status TEXT CHECK (stt_status IN ('nao_iniciado', 'pendente', 'processando', 'concluido', 'erro'));

-- Valor padrão para registros existentes
UPDATE public.pesquisas
SET stt_status = CASE
  WHEN transcricao_completa IS NOT NULL AND transcricao_completa != '' THEN 'concluido'
  WHEN audio_url IS NOT NULL THEN 'pendente'
  ELSE 'nao_iniciado'
END
WHERE stt_status IS NULL;

-- Adiciona coluna para mensagem de erro de STT (opcional)
ALTER TABLE IF EXISTS public.pesquisas
ADD COLUMN IF NOT EXISTS stt_erro TEXT;

-- Índice para buscar pesquisas pendentes de transcrição
CREATE INDEX IF NOT EXISTS idx_pesquisas_stt_status 
ON public.pesquisas(stt_status) 
WHERE stt_status IN ('pendente', 'processando');

COMMENT ON COLUMN public.pesquisas.stt_status IS 'Status da transcrição pós-upload: nao_iniciado, pendente, processando, concluido, erro';
COMMENT ON COLUMN public.pesquisas.stt_erro IS 'Mensagem de erro da última tentativa de transcrição';
