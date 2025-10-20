import { GoogleGenerativeAI } from '@google/generative-ai';
import { CampoFormulario } from '../db/localDB';

// Inicializa o Gemini com a chave da API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY as string);

// Usa o modelo Gemini 1.5 Flash (rápido e barato)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Resultado da análise da IA
 */
export interface ResultadoIA {
  respostas: { [campoId: string]: any };
  confianca: { [campoId: string]: number };
  observacoes: string;
  status: 'sucesso' | 'parcial' | 'erro';
}

/**
 * Processa a transcrição completa da pesquisa usando IA
 * 
 * @param transcricao - Texto completo da transcrição (com marcadores de tempo)
 * @param campos - Lista de campos do formulário
 * @param candidato - Nome do candidato (opcional)
 * @returns Respostas extraídas e nível de confiança
 */
export async function processarTranscricaoComIA(
  transcricao: string,
  campos: CampoFormulario[],
  candidato?: string
): Promise<ResultadoIA> {
  try {
    // Monta o prompt para o Gemini
    const prompt = montarPrompt(transcricao, campos, candidato);

    // Chama a API do Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const texto = response.text();

    // Parse da resposta JSON
    const dados = extrairJSON(texto);

    // Valida e formata o resultado
    return validarResultado(dados, campos);

  } catch (error) {
    console.error('Erro ao processar transcrição com IA:', error);
    return {
      respostas: {},
      confianca: {},
      observacoes: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`,
      status: 'erro'
    };
  }
}

/**
 * Monta o prompt para o Gemini
 */
function montarPrompt(
  transcricao: string,
  campos: CampoFormulario[],
  candidato?: string
): string {
  // Lista os campos esperados
  const listaCampos = campos.map(campo => {
    let descricao = `- ${campo.id} (${campo.tipo})`;
    
    if (campo.label) {
      descricao += `: "${campo.label}"`;
    }
    
    if (campo.opcoes && campo.opcoes.length > 0) {
      descricao += ` | Opções: ${campo.opcoes.join(', ')}`;
    }
    
    if (campo.obrigatorio) {
      descricao += ' [OBRIGATÓRIO]';
    }
    
    return descricao;
  }).join('\n');

  const promptCandidato = candidato ? `O candidato mencionado é: ${candidato}\n\n` : '';

  return `Você é um assistente de IA especializado em análise de pesquisas eleitorais.

Sua tarefa é extrair informações estruturadas de uma transcrição de entrevista porta-a-porta.

${promptCandidato}TRANSCRIÇÃO DA ENTREVISTA:
---
${transcricao}
---

CAMPOS ESPERADOS:
${listaCampos}

INSTRUÇÕES:
1. Analise a transcrição cuidadosamente
2. Extraia as respostas para cada campo listado acima
3. Use os marcadores de tempo [Xs - Pergunta N: ...] para identificar cada pergunta
4. Para campos com opções, use EXATAMENTE um dos valores listados
5. Para campos de texto livre, extraia a resposta do morador
6. Para campos numéricos, extraia apenas o número
7. Se uma resposta não estiver clara, atribua confiança baixa (0-50)
8. Se uma pergunta NÃO foi feita, deixe o campo vazio (null)

NÍVEL DE CONFIANÇA (0-100):
- 90-100: Resposta clara e explícita
- 70-89: Resposta inferida com alta probabilidade
- 50-69: Resposta inferida com média probabilidade
- 0-49: Resposta incerta ou não mencionada

FORMATO DE RESPOSTA (JSON):
{
  "respostas": {
    "campo_id": "valor extraído ou null",
    ...
  },
  "confianca": {
    "campo_id": 85,
    ...
  },
  "observacoes": "Comentários sobre a análise (opcional)"
}

Retorne APENAS o JSON, sem texto adicional antes ou depois.`;
}

/**
 * Extrai JSON da resposta do Gemini
 */
function extrairJSON(texto: string): any {
  try {
    // Remove markdown code blocks se houver
    let json = texto.trim();
    
    if (json.startsWith('```json')) {
      json = json.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (json.startsWith('```')) {
      json = json.replace(/```\s*/g, '').replace(/```\s*$/g, '');
    }
    
    json = json.trim();
    
    return JSON.parse(json);
  } catch (error) {
    console.error('Erro ao fazer parse do JSON:', error);
    console.log('Texto recebido:', texto);
    throw new Error('Resposta da IA não está em formato JSON válido');
  }
}

/**
 * Valida e formata o resultado da IA
 */
function validarResultado(dados: any, campos: CampoFormulario[]): ResultadoIA {
  const respostas: { [campoId: string]: any } = {};
  const confianca: { [campoId: string]: number } = {};

  // Valida cada campo
  for (const campo of campos) {
    const valor = dados.respostas?.[campo.id];
    const conf = dados.confianca?.[campo.id] || 0;

    // Valida opções (radio, checkbox, select)
    if (campo.opcoes && campo.opcoes.length > 0) {
      if (valor && campo.opcoes.includes(valor)) {
        respostas[campo.id] = valor;
        confianca[campo.id] = Math.min(100, Math.max(0, conf));
      } else if (valor) {
        // Valor não está nas opções - tenta encontrar correspondência
        const opcaoCorrespondente = encontrarOpcaoSimilar(valor, campo.opcoes);
        if (opcaoCorrespondente) {
          respostas[campo.id] = opcaoCorrespondente;
          confianca[campo.id] = Math.max(0, conf - 10); // Reduz confiança
        } else {
          respostas[campo.id] = null;
          confianca[campo.id] = 0;
        }
      } else {
        respostas[campo.id] = null;
        confianca[campo.id] = 0;
      }
    } else {
      // Campo de texto livre ou número
      respostas[campo.id] = valor || null;
      confianca[campo.id] = valor ? Math.min(100, Math.max(0, conf)) : 0;
    }
  }

  // Calcula status geral
  let status: 'sucesso' | 'parcial' | 'erro' = 'sucesso';
  const camposObrigatorios = campos.filter(c => c.obrigatorio);
  const camposPreenchidos = camposObrigatorios.filter(c => respostas[c.id] != null);
  
  if (camposPreenchidos.length === 0) {
    status = 'erro';
  } else if (camposPreenchidos.length < camposObrigatorios.length) {
    status = 'parcial';
  }

  return {
    respostas,
    confianca,
    observacoes: dados.observacoes || '',
    status
  };
}

/**
 * Encontra opção similar usando comparação de strings
 */
function encontrarOpcaoSimilar(valor: string, opcoes: string[]): string | null {
  const valorNormalizado = valor.toLowerCase().trim();
  
  // Busca correspondência exata (case-insensitive)
  const exactMatch = opcoes.find(op => op.toLowerCase() === valorNormalizado);
  if (exactMatch) return exactMatch;
  
  // Busca correspondência parcial
  const partialMatch = opcoes.find(op => 
    op.toLowerCase().includes(valorNormalizado) ||
    valorNormalizado.includes(op.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  return null;
}

/**
 * Testa a conexão com o Gemini
 */
export async function testarConexaoGemini(): Promise<boolean> {
  try {
    const result = await model.generateContent('Responda apenas: OK');
    const response = await result.response;
    const texto = response.text();
    return texto.includes('OK');
  } catch (error) {
    console.error('Erro ao testar Gemini:', error);
    return false;
  }
}
