// Chamadas REST diretas à API do Gemini (evita diferenças de versão do SDK)
import { CampoFormulario } from '../db/localDB';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const API_BASE = 'https://generativelanguage.googleapis.com/v1';

// Candidatos de modelos compatíveis (ordem de preferência)
// Preferimos 2.5 > 2.0 > 1.5 e "flash" > "pro" para latência/custo
const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-latest',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
] as const;

async function generateContentWithFallback(prompt: string) {
  let lastErr: unknown = null;
  // 1) Tenta modelos descobertos dinamicamente para esta chave
  const dynamic = await getDynamicModelCandidates();
  const candidates = [...dynamic, ...MODEL_CANDIDATES];

  for (const id of candidates) {
    try {
      const texto = await generateViaREST(id, prompt);
      return texto;
    } catch (e: any) {
      lastErr = e;
      const msg = typeof e?.message === 'string' ? e.message : '';
      // Tenta o próximo modelo apenas para erros de modelo/rota não suportados
      if (msg.includes('404') || msg.includes('not found') || msg.includes('is not supported')) {
        continue;
      }
      // Para outros erros (ex.: 401/403), não adianta trocar de modelo
      throw e;
    }
  }
  throw lastErr ?? new Error('Nenhum modelo Gemini disponível no momento');
}

// Obtém modelos pela API e ordena por preferência (flash > pro; preferir 1.5 / 2.x)
async function getDynamicModelCandidates(): Promise<string[]> {
  try {
    const names = await listarModelos(); // ex.: ["models/gemini-1.5-flash", ...]
    const ids = names
      .map((n) => (typeof n === 'string' ? n.split('/').pop() || n : n))
      .filter(Boolean) as string[];

    // Regras simples de preferência
    const scored = ids.map((id) => ({ id, score: scoreModelId(id) }));
    scored.sort((a, b) => b.score - a.score);
    // Remove duplicados mantendo ordem
    const unique: string[] = [];
    for (const { id } of scored) {
      if (!unique.includes(id)) unique.push(id);
    }
    return unique;
  } catch {
    return [];
  }
}

function scoreModelId(id: string): number {
  const s = id.toLowerCase();
  let score = 0;
  if (s.includes('flash')) score += 50; // preferir flash para custo/latência
  if (s.includes('pro')) score += 30;
  // Preferir fortemente 2.x (especialmente 2.5), depois 1.5
  if (/(^|[-])2\.5(\.|$)/i.test(s)) score += 40; // 2.5 top
  else if (/(^|[-])2(\.|$)/i.test(s)) score += 30; // demais 2.x
  else if (/(^|[-])1\.5($|[-])/i.test(s)) score += 10;
  if (s.endsWith('latest')) score += 5;
  return score;
}

async function generateViaREST(model: string, prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY ausente. Defina a chave no .env');
  }
  const url = `${API_BASE}/models/${encodeURIComponent(model)}:generateContent`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error('Resposta do Gemini sem texto');
  return texto as string;
}

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

  // Chama a API do Gemini (com fallback de modelos)
  const texto = await generateContentWithFallback(prompt);

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
  // Filtra campos pessoais (serão digitados manualmente, não transcritos)
  const camposParaTranscricao = campos.filter(campo => {
    const campoComGrupo = campo as CampoFormulario & { grupo?: string };
    return campoComGrupo.grupo !== 'pessoais';
  });
  
  // Lista os campos esperados (apenas os que não são pessoais)
  const listaCampos = camposParaTranscricao.map(campo => {
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

  // Filtra campos pessoais (não devem ser preenchidos pela IA)
  const camposParaValidar = campos.filter(campo => {
    const campoComGrupo = campo as CampoFormulario & { grupo?: string };
    return campoComGrupo.grupo !== 'pessoais';
  });

  // Valida cada campo (apenas os que não são pessoais)
  for (const campo of camposParaValidar) {
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
    const texto = await generateContentWithFallback('Responda apenas: OK');
    return texto.includes('OK');
  } catch (error) {
    console.error('Erro ao testar Gemini:', error);
    return false;
  }
}

/**
 * Lista os modelos disponíveis para a chave atual (nome completo vindo da API)
 */
export async function listarModelos(): Promise<string[]> {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY ausente');
  const url = `${API_BASE}/models`;
  const res = await fetch(url, {
    headers: {
      'x-goog-api-key': API_KEY,
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ListModels HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const names = (data?.models || []).map((m: any) => m.name as string);
  return names;
}
