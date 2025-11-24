// Worker para transcrever apenas pesquisas pendentes
// Processa 5 pesquisas por vez: criadas em 16-11-2025, com áudio, sem resposta de IA

import dotenv from 'dotenv';
dotenv.config({ override: true });
import { supabaseAdmin } from './supabaseAdminClient.js';
import OpenAI from 'openai';
import os from 'os';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

const geminiApiKey = process.env.GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const STT_PROVIDER = process.env.STT_PROVIDER || 'openai';
const BATCH_SIZE = 5; // Fixo: sempre 5 pesquisas

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// ============ Funções de Transcrição ============
async function downloadToTemp(url, nameHint = 'audio.webm') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar áudio: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `${Date.now()}_${nameHint}`);
  await fs.writeFile(tmp, buf);
  return tmp;
}

async function transcribeWithOpenAI(filePath) {
  if (!client) throw new Error('OPENAI_API_KEY ausente');
  const readStream = createReadStream(filePath);
  const transcription = await client.audio.transcriptions.create({
    file: readStream,
    model: 'whisper-1',
    language: 'pt',
  });
  return transcription.text || '';
}

async function transcreverComGemini(audioUrl) {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não definido para transcrição');
  }
  
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Falha ao baixar áudio: ${res.status}`);
  const audioBuffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          inline_data: {
            mime_type: 'audio/webm',
            data: audioBase64
          }
        }, {
          text: 'Transcreva este áudio em português brasileiro. Retorne apenas o texto transcrito, sem explicações.'
        }]
      }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini transcrição falhou: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error('Gemini não retornou transcrição');
  
  return texto.trim();
}

async function transcreverAudio(audioUrl) {
  if (!audioUrl) throw new Error('URL do áudio não fornecida');
  
  if (STT_PROVIDER === 'gemini') {
    if (geminiApiKey) {
      try {
        console.log('🎤 Tentando transcrição com Gemini...');
        return await transcreverComGemini(audioUrl);
      } catch (e) {
        console.warn(`⚠️ Gemini falhou: ${e.message}`);
        if (openaiApiKey) {
          console.log('🔄 Tentando fallback para OpenAI...');
          const tmpFile = await downloadToTemp(audioUrl, `transcribe_${Date.now()}.webm`);
          try {
            return await transcribeWithOpenAI(tmpFile);
          } finally {
            try { await fs.unlink(tmpFile); } catch {}
          }
        }
        throw e;
      }
    } else if (openaiApiKey) {
      console.log('⚠️ Gemini não configurado, usando OpenAI...');
      const tmpFile = await downloadToTemp(audioUrl, `transcribe_${Date.now()}.webm`);
      try {
        return await transcribeWithOpenAI(tmpFile);
      } finally {
        try { await fs.unlink(tmpFile); } catch {}
      }
    } else {
      throw new Error('Nem GEMINI_API_KEY nem OPENAI_API_KEY estão configurados');
    }
  } else if (STT_PROVIDER === 'openai') {
    if (openaiApiKey) {
      try {
        const tmpFile = await downloadToTemp(audioUrl, `transcribe_${Date.now()}.webm`);
        try {
          return await transcribeWithOpenAI(tmpFile);
        } finally {
          try { await fs.unlink(tmpFile); } catch {}
        }
      } catch (e) {
        console.warn(`⚠️ OpenAI falhou: ${e.message}`);
        if (geminiApiKey) {
          console.log('🔄 Tentando fallback para Gemini...');
          return await transcreverComGemini(audioUrl);
        }
        throw e;
      }
    } else if (geminiApiKey) {
      console.log('⚠️ OpenAI não configurado, usando Gemini...');
      return await transcreverComGemini(audioUrl);
    } else {
      throw new Error('Nem OPENAI_API_KEY nem GEMINI_API_KEY estão configurados');
    }
  } else {
    throw new Error(`STT_PROVIDER não suportado: ${STT_PROVIDER}. Use 'openai' ou 'gemini'`);
  }
}

async function atualizarTranscricao(pesquisaId, transcricao) {
  const { error } = await supabaseAdmin
    .from('pesquisas')
    .update({
      transcricao_completa: transcricao,
      stt_status: 'concluido',
      stt_erro: null,
    })
    .eq('id', pesquisaId);
  if (error) throw error;
}

// ============ Funções de IA ============
async function listGeminiModels() {
  if (!geminiApiKey) return [];
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.models || []).map((m) => m.name).filter(Boolean);
  } catch {
    return [];
  }
}

function scoreModelId(id) {
  const s = String(id).toLowerCase();
  let score = 0;
  if (s.includes('flash')) score += 50;
  if (s.includes('pro')) score += 30;
  if (/(^|[-])2\.5(\.|$)/.test(s)) score += 40;
  else if (/(^|[-])2(\.|$)/.test(s)) score += 30;
  else if (/(^|[-])1\.5($|[-])/.test(s)) score += 10;
  if (s.endsWith('latest')) score += 5;
  return score;
}

async function resolveGeminiModel() {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY não definido');
  try {
    const names = await listGeminiModels();
    const ids = names.map((n) => (typeof n === 'string' ? n.split('/').pop() || n : n));
    ids.sort((a, b) => scoreModelId(b) - scoreModelId(a));
    const best = ids[0];
    if (best) {
      console.log(`✓ Modelo Gemini selecionado: ${best}`);
      return best;
    }
  } catch (e) {
    console.warn('Erro ao listar modelos Gemini:', e?.message || e);
  }
  console.log('Usando modelo fallback: gemini-2.5-flash');
  return 'gemini-2.5-flash';
}

function montarPrompt(transcricao, campos, candidato) {
  const listaCampos = (campos || [])
    .map((campo) => {
      let desc = `- ${campo.id} (${campo.tipo})`;
      if (campo.label) desc += `: "${campo.label}"`;
      if (Array.isArray(campo.opcoes) && campo.opcoes.length > 0) {
        desc += ` | Opções: ${campo.opcoes.join(', ')}`;
      }
      return desc;
    })
    .join('\n');

  return `Você é um assistente que extrai dados estruturados de transcrições de entrevistas de pesquisa eleitoral.

**Candidato:** ${candidato || 'Não especificado'}

**Campos do formulário:**
${listaCampos}

**Transcrição da entrevista:**
${transcricao}

**Instruções:**
1. Leia a transcrição e identifique as respostas para cada campo
2. Para campos com opções, escolha APENAS uma das opções listadas (case-insensitive)
3. Para campos de texto livre, extraia a resposta literal
4. Se não houver resposta clara, use null
5. Retorne um JSON válido no formato: { "respostas": { "campo_id": "valor", ... }, "observacoes": "texto ou null" }
6. O campo "observacoes" deve conter observações relevantes sobre a entrevista, ou null se não houver nada relevante a observar
7. Não adicione explicações, apenas o JSON

**Responda agora com o JSON:**`;
}

async function processarIAComGemini(transcricao, campos, candidato, modelName) {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY ausente');
  const mdl = modelName || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(mdl)}:generateContent`;
  
  const prompt = montarPrompt(transcricao, campos, candidato);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini HTTP ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error('Resposta do Gemini sem texto');
  
  let json = String(texto).trim();
  if (json.startsWith('```')) {
    json = json.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  }
  
  const jsonMatch = json.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('IA não retornou JSON válido');
  
  const resultado = JSON.parse(jsonMatch[0]);
  
  // Extrair respostas e observações
  // Pode vir como { "respostas": {...}, "observacoes": "..." } ou apenas { "campo_id": "valor" }
  let respostas = {};
  let observacoes = null;
  
  if (resultado.respostas) {
    // Formato novo: { "respostas": {...}, "observacoes": "..." }
    respostas = resultado.respostas;
    observacoes = resultado.observacoes || resultado.observacoes_ia || null;
  } else {
    // Formato antigo: { "campo_id": "valor", ... } - sem campo observacoes
    respostas = resultado;
    observacoes = null; // Não tem observações neste formato
  }
  
  // Garantir que sempre retorna observacoes (null se não tiver)
  return {
    respostas: respostas,
    observacoes: observacoes
  };
}

async function fetchPesquisaCompleta(pesquisaId) {
  const { data, error } = await supabaseAdmin
    .from('pesquisas')
    .select('id, formulario_id, respostas, transcricao_completa, audio_url, stt_status, stt_erro')
    .eq('id', pesquisaId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchFormulario(formularioId) {
  if (!formularioId) return null;
  const { data, error } = await supabaseAdmin
    .from('formularios')
    .select('id, nome, pre_candidato, campos')
    .eq('id', formularioId)
    .single();
  if (error) throw error;
  return data;
}

async function updatePesquisaIA(pesquisaId, resultadoIA) {
  // resultadoIA pode ser { respostas: {...}, observacoes: "..." } ou apenas { campo_id: "valor" }
  const respostasIA = resultadoIA.respostas || resultadoIA;
  const observacoes = resultadoIA.observacoes || null;
  
  const { error } = await supabaseAdmin
    .from('pesquisas')
    .update({
      respostas_ia: respostasIA,
      processamento_ia_status: 'concluido',
      observacoes_ia: observacoes  // Sempre atualiza: null se não tiver, texto se tiver
    })
    .eq('id', pesquisaId);
  if (error) throw error;
}

async function markPesquisaIAErro(pesquisaId, erro) {
  const { error } = await supabaseAdmin
    .from('pesquisas')
    .update({
      processamento_ia_status: 'erro',
      observacoes_ia: erro
    })
    .eq('id', pesquisaId);
  if (error) throw error;
}

async function fetchPesquisasPendentes() {
  // Buscar pesquisas criadas em 16-11-2025 que tenham áudio mas SEM resposta de IA concluída
  const dataInicio = '2025-11-16T00:00:00.000Z';
  const dataFim = '2025-11-16T23:59:59.999Z';
  
  // Buscar todas as pesquisas do dia com áudio
  const { data, error } = await supabaseAdmin
    .from('pesquisas')
    .select('id, audio_url, stt_status, stt_erro, processamento_ia_status, respostas_ia, formulario_id, criado_em')
    .not('audio_url', 'is', null)
    .neq('audio_url', '')
    .gte('criado_em', dataInicio)
    .lte('criado_em', dataFim)
    .order('criado_em', { ascending: true })
    .limit(100); // Buscar mais para filtrar depois
    
  if (error) {
    console.error('Erro ao buscar pesquisas:', error);
    throw error;
  }
  
  console.log(`Query executada: pesquisas criadas entre ${dataInicio} e ${dataFim}`);
  console.log(`Total encontrado no banco: ${data?.length || 0} pesquisas com áudio`);
  
  // Filtrar localmente: apenas as que NÃO têm resposta de IA concluída
  const pesquisasFiltradas = (data || []).filter(p => {
    // Verificar se tem respostas_ia válidas (pode ser objeto ou string JSON)
    let temRespostaIA = false;
    if (p.respostas_ia) {
      if (typeof p.respostas_ia === 'object') {
        temRespostaIA = Object.keys(p.respostas_ia).length > 0;
      } else if (typeof p.respostas_ia === 'string') {
        try {
          const parsed = JSON.parse(p.respostas_ia);
          temRespostaIA = typeof parsed === 'object' && Object.keys(parsed).length > 0;
        } catch {
          temRespostaIA = false; // JSON inválido = não tem resposta válida
        }
      }
    }
    
    const processamentoConcluido = p.processamento_ia_status === 'concluido';
    
    // Incluir se NÃO tem resposta IA válida OU processamento não está concluído
    const semRespostaIA = !temRespostaIA || !processamentoConcluido;
    
    return semRespostaIA;
  }).slice(0, BATCH_SIZE); // Limitar a 5
  
  console.log(`Filtros aplicados: sem resposta de IA concluída`);
  console.log(`Encontradas ${pesquisasFiltradas.length} pesquisas após filtro (de ${data?.length || 0} total)`);
  
  // Debug: mostrar status das primeiras pesquisas encontradas
  if (pesquisasFiltradas.length > 0) {
    console.log(`\nPrimeiras pesquisas encontradas:`);
    pesquisasFiltradas.slice(0, 3).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ID: ${p.id.substring(0, 8)}... | stt: ${p.stt_status || 'null'} | ia_status: ${p.processamento_ia_status || 'null'} | tem_respostas_ia: ${!!p.respostas_ia}`);
    });
  }
  
  return pesquisasFiltradas;
}

async function processar(pesquisa, modelName) {
  try {
    console.log(`\n📝 Processando pesquisa ${pesquisa.id}...`);
    
    if (!pesquisa.audio_url) {
      console.log(`⚠️ Pesquisa ${pesquisa.id}: sem áudio. Pulando.`);
      return;
    }
    
    // Buscar dados completos da pesquisa e formulário
    const pesquisaCompleta = await fetchPesquisaCompleta(pesquisa.id);
    const formulario = await fetchFormulario(pesquisaCompleta.formulario_id);
    
    if (!formulario || !formulario.campos) {
      console.log(`⚠️ Pesquisa ${pesquisa.id}: sem formulário ou campos. Pulando.`);
      return;
    }
    
    // Atualizar status para processando
    await supabaseAdmin
      .from('pesquisas')
      .update({ stt_status: 'processando', stt_erro: null })
      .eq('id', pesquisa.id);
    
    // Transcrever áudio
    const transcricao = await transcreverAudio(pesquisa.audio_url);
    
    // Atualizar banco com transcrição
    await atualizarTranscricao(pesquisa.id, transcricao);
    
    console.log(`✓ Transcrição concluída para pesquisa ${pesquisa.id}`);
    console.log(`  Tamanho da transcrição: ${transcricao.length} caracteres`);
    
    // Processar com IA
    if (geminiApiKey) {
      try {
        console.log(`🤖 Processando IA para pesquisa ${pesquisa.id}...`);
        const resultadoIA = await processarIAComGemini(
          transcricao,
          formulario.campos,
          formulario.pre_candidato,
          modelName
        );
        
        await updatePesquisaIA(pesquisa.id, resultadoIA);
        const obsMsg = resultadoIA.observacoes ? ` (com observações)` : ` (sem observações)`;
        console.log(`✓ Processamento IA concluído para pesquisa ${pesquisa.id}${obsMsg}`);
      } catch (e) {
        const msg = e?.message || String(e);
        console.error(`✗ Erro no processamento IA da pesquisa ${pesquisa.id}:`, msg);
        await markPesquisaIAErro(pesquisa.id, msg);
        // Não lança erro aqui - a transcrição foi bem-sucedida
      }
    } else {
      console.log(`⚠️ GEMINI_API_KEY não configurada. Pulando processamento IA.`);
    }
    
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(`✗ Erro na pesquisa ${pesquisa.id}:`, msg);
    
    // Marcar como erro
    await supabaseAdmin
      .from('pesquisas')
      .update({ stt_status: 'erro', stt_erro: msg })
      .eq('id', pesquisa.id);
  }
}

async function main() {
  console.log('🎤 Worker de Transcrição e IA iniciado...');
  console.log('Este worker transcreve e processa com IA 5 pesquisas por vez.');
  console.log('Critérios: criadas em 16-11-2025, com áudio, sem resposta de IA.');
  
  if (STT_PROVIDER === 'gemini') {
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY não definido.');
      if (!openaiApiKey) {
        console.error('❌ OPENAI_API_KEY também não definido. Saindo.');
        process.exit(1);
      }
      console.log('⚠️ Usando OpenAI como fallback...');
    } else {
      console.log('🎤 Transcrição: Gemini (com fallback para OpenAI se necessário)');
    }
  } else if (STT_PROVIDER === 'openai') {
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY não definido.');
      if (geminiApiKey) {
        console.log('⚠️ Usando Gemini como fallback...');
      } else {
        console.error('❌ GEMINI_API_KEY também não definido. Saindo.');
        process.exit(1);
      }
    } else {
      console.log('🎤 Transcrição: OpenAI');
    }
  }
  
  // Resolver modelo Gemini para IA
  let modelName = null;
  if (geminiApiKey) {
    try {
      modelName = await resolveGeminiModel();
      console.log(`🤖 Processamento IA: Gemini (modelo: ${modelName})`);
    } catch (e) {
      console.warn(`⚠️ Não foi possível resolver modelo Gemini: ${e.message}`);
      console.log('⚠️ Processamento IA será pulado se Gemini não estiver disponível.');
    }
  } else {
    console.log('⚠️ GEMINI_API_KEY não configurada. Processamento IA será pulado.');
  }
  
  // Loop até processar todas as pesquisas
  let totalProcessadas = 0;
  let rodada = 1;
  
  while (true) {
    console.log(`\n--- Rodada ${rodada} ---`);
    
    // Buscar pesquisas pendentes (5 por vez)
    const pesquisas = await fetchPesquisasPendentes();
    console.log(`📊 Encontradas ${pesquisas.length} pesquisas para processar`);
    
    if (pesquisas.length === 0) {
      console.log('\n✓ Todas as pesquisas foram processadas!');
      console.log(`Total processado: ${totalProcessadas} pesquisas`);
      break;
    }
    
    // Processar as pesquisas desta rodada
    console.log(`🔄 Processando ${pesquisas.length} pesquisas...\n`);
    
    for (const pesquisa of pesquisas) {
      await processar(pesquisa, modelName);
      totalProcessadas++;
      // Pequeno delay entre pesquisas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✓ Rodada ${rodada} concluída. Processadas ${pesquisas.length} pesquisas.`);
    rodada++;
    
    // Pequeno delay entre rodadas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Processamento concluído!`);
  console.log(`Total processado: ${totalProcessadas} pesquisas`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

