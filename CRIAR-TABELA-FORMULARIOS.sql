-- Estrutura simples para armazenar formulários interpretados de PDF
CREATE TABLE IF NOT EXISTS formularios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    perguntas JSONB NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    criado_por INT -- id do usuário que enviou
);

-- Exemplo de uso do campo perguntas:
-- [
--   { "pergunta": "Qual seu nome?", "tipo": "texto" },
--   { "pergunta": "Idade", "tipo": "numero" }
-- ]
