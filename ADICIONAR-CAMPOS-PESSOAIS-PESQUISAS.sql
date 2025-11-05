-- Adicionar colunas para dados pessoais na tabela pesquisas
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE pesquisas
ADD COLUMN IF NOT EXISTS data_nascimento TEXT,
ADD COLUMN IF NOT EXISTS autorizacao_contato TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Comentários das colunas
COMMENT ON COLUMN pesquisas.data_nascimento IS 'Data de nascimento no formato DD/MM ou DD/MM/AAAA';
COMMENT ON COLUMN pesquisas.autorizacao_contato IS 'Autorização para receber contato: "Sim, autorizo" ou "Não autorizo"';
COMMENT ON COLUMN pesquisas.whatsapp IS 'Número do WhatsApp (apenas números, DDD + número)';

