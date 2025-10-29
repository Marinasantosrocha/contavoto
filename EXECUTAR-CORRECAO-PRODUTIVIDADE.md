# Correção da Função de Produtividade

## Problema Identificado

A função `calcular_produtividade()` estava contando incorretamente o número de entrevistas devido a um problema no LEFT JOIN que multiplicava as contagens.

Por exemplo:
- Se um entrevistador tinha 400 entrevistas
- E tinha vários intervalos válidos
- O LEFT JOIN multiplicava: 400 × número de intervalos = 7656 (valor incorreto)

## Solução

A nova função calcula as métricas separadamente:
1. **Métricas de duração**: conta total de entrevistas e duração média
2. **Métricas de intervalo**: calcula média dos intervalos válidos (≤ 60 min)
3. **Junção**: combina as duas métricas sem multiplicar contagens

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo `CORRIGIR-FUNCAO-PRODUTIVIDADE.sql`
4. Cole no editor e clique em **Run**
5. Verifique o resultado: deve mostrar valores corretos (por volta de 400 entrevistas totais)

### Opção 2: Via SQL direto no banco

Execute o arquivo SQL no seu banco:
```bash
psql -U seu_usuario -d seu_banco -f CORRIGIR-FUNCAO-PRODUTIVIDADE.sql
```

## Verificação

Após executar, teste com:
```sql
SELECT * FROM calcular_produtividade();
```

Os resultados devem mostrar:
- **total_entrevistas**: número real de entrevistas por pesquisador (~400 no total)
- **duracao_media_minutos**: tempo médio de cada entrevista
- **intervalo_medio_minutos**: tempo médio entre entrevistas (apenas intervalos ≤ 60min)

## Mudanças no Dashboard

Também foram removidas do dashboard:
- ✅ Seção "Perfil dos Entrevistados" (faixa etária e tempo de moradia)
- ✅ A função de produtividade agora conta corretamente as entrevistas

## Resultado Esperado

Com ~400 pesquisas no banco, você deve ver algo como:
- Elaine Danyere: ~200-250 entrevistas
- Amanda Gracielle: ~150-200 entrevistas

Valores realistas ao invés dos 7656 incorretos!
