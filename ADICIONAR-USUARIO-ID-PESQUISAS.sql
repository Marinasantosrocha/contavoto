-- ADICIONAR COLUNA usuario_id NA TABELA PESQUISAS
-- Esta coluna é necessária para relacionar pesquisas com usuários

-- 1. Adicionar a coluna usuario_id
ALTER TABLE pesquisas 
ADD COLUMN IF NOT EXISTS usuario_id INTEGER;

-- 2. Criar foreign key para usuários
ALTER TABLE pesquisas
ADD CONSTRAINT fk_pesquisas_usuario
FOREIGN KEY (usuario_id) 
REFERENCES usuarios(id)
ON DELETE SET NULL;

-- 3. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pesquisas_usuario_id 
ON pesquisas(usuario_id);

-- 4. Tentar popular usuario_id baseado no nome do entrevistador
-- (isso vai funcionar se os nomes dos entrevistadores forem únicos)
UPDATE pesquisas p
SET usuario_id = u.id
FROM usuarios u
WHERE p.entrevistador = u.nome
  AND p.usuario_id IS NULL;

-- 5. Verificar resultado
SELECT 
  COUNT(*) as total_pesquisas,
  COUNT(usuario_id) as com_usuario_id,
  COUNT(*) - COUNT(usuario_id) as sem_usuario_id
FROM pesquisas;

-- 6. Ver quais entrevistadores não foram mapeados
SELECT DISTINCT 
  p.entrevistador,
  p.usuario_id
FROM pesquisas p
WHERE p.usuario_id IS NULL
ORDER BY p.entrevistador;

-- 7. Ver mapeamento dos que foram encontrados
SELECT DISTINCT 
  p.entrevistador,
  p.usuario_id,
  u.nome as nome_usuario
FROM pesquisas p
LEFT JOIN usuarios u ON p.usuario_id = u.id
WHERE p.usuario_id IS NOT NULL
ORDER BY p.entrevistador;
