// Script para processar IA (Gemini) de pesquisas pendentes
// Também transcreve áudios quando necessário antes de processar com IA

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
const BATCH_SIZE = parseInt(process.env.IA_BATCH_SIZE || '5', 10);

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

if (!geminiApiKey) {
  console.error('GEMINI_API_KEY não definido. Saindo.');
  process.exit(1);
}

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
  // Gemini pode transcrever áudio diretamente
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não definido para transcrição');
  }
  
  // Baixar áudio e converter para base64
  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error(`Falha ao baixar áudio: ${res.status}`);
  const audioBuffer = await res.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  
  // Usar Gemini 2.5 Flash para transcrição
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

async function transcreverComAPILocal(audioUrl) {
  // Usa API local de Whisper (gratuita, sem quota)
  const apiUrl = process.env.TRANSCRIPTION_API_URL || 'http://localhost:3004/api/transcribe';
  
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl })
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API local falhou: ${res.status} - ${error}`);
  }
  
  const data = await res.json();
  if (!data.success || !data.texto) {
    throw new Error(`API local retornou erro: ${data.error || 'Sem texto'}`);
  }
  
  return data.texto;
}

async function transcreverAudio(audioUrl) {
  if (!audioUrl) throw new Error('URL do áudio não fornecida');
  
  // Lógica de fallback inteligente: tenta provider configurado, depois o outro automaticamente
  if (STT_PROVIDER === 'gemini') {
    // Tentar Gemini primeiro
    if (geminiApiKey) {
      try {
        console.log('🎤 Tentando transcrição com Gemini...');
        return await transcreverComGemini(audioUrl);
      } catch (e) {
        console.warn(`⚠️ Gemini falhou: ${e.message}`);
        // Fallback automático para OpenAI se disponível
        if (openaiApiKey) {
          console.log('🔄 Tentando fallback para OpenAI...');
          const tmpFile = await downloadToTemp(audioUrl, `transcribe_${Date.now()}.webm`);
          try {
            return await transcribeWithOpenAI(tmpFile);
          } finally {
            try { await fs.unlink(tmpFile); } catch {}
          }
        }
        throw e; // Se não houver fallback, lança o erro
      }
    } else if (openaiApiKey) {
      // Se Gemini não configurado mas OpenAI sim, usar OpenAI
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
    // Tentar OpenAI primeiro
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
        // Fallback automático para Gemini se disponível
        if (geminiApiKey) {
          console.log('🔄 Tentando fallback para Gemini...');
          return await transcreverComGemini(audioUrl);
        }
        throw e; // Se não houver fallback, lança o erro
      }
    } else if (geminiApiKey) {
      // Se OpenAI não configurado mas Gemini sim, usar Gemini
      console.log('⚠️ OpenAI não configurado, usando Gemini...');
      return await transcreverComGemini(audioUrl);
    } else {
      throw new Error('Nem OPENAI_API_KEY nem GEMINI_API_KEY estão configurados');
    }
  } else if (STT_PROVIDER === 'local') {
    // Usa API local de Whisper (gratuita)
    return await transcreverComAPILocal(audioUrl);
  } else {
    throw new Error(`STT_PROVIDER não suportado: ${STT_PROVIDER}. Use 'openai', 'gemini' ou 'local'`);
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
  if (/(^|[-])2\.5(\.|$)/.test(s)) score += 40; // preferir 2.5
  else if (/(^|[-])2(\.|$)/.test(s)) score += 30; // demais 2.x
  else if (/(^|[-])1\.5($|[-])/.test(s)) score += 10;
  if (s.endsWith('latest')) score += 5;
  return score;
}

async function resolveGeminiModel() {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY não definido');
  try {
    const names = await listGeminiModels(); // ex.: ["models/gemini-2.5-flash", ...]
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
  // fallback estático
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
5. Retorne APENAS um JSON válido no formato: { "campo_id": "valor", ... }
6. Não adicione explicações, apenas o JSON

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
  
  return JSON.parse(jsonMatch[0]);
}

async function fetchPesquisa(pesquisaId) {
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

async function updatePesquisaIA(pesquisaId, respostasIA) {
  const { error } = await supabaseAdmin
    .from('pesquisas')
    .update({
      respostas_ia: respostasIA,
      processamento_ia_status: 'concluido',
      observacoes_ia: null  // Limpar observações de erro anteriores quando processa com sucesso
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

async function fetchPesquisasPendentes(limit) {
  // Buscar pesquisas criadas em 16-11-2025 que tenham áudios
  // Essas pesquisas serão retranscritas e reprocessadas
  // Usa criado_em (data de criação no banco) ao invés de iniciada_em
  const dataInicio = '2025-11-16T00:00:00.000Z';
  const dataFim = '2025-11-16T23:59:59.999Z';
  
  const { data, error } = await supabaseAdmin
    .from('pesquisas')
    .select('id, transcricao_completa, audio_url, formulario_id, stt_status, stt_erro, processamento_ia_status, criado_em')
    .not('audio_url', 'is', null)
    .gte('criado_em', dataInicio)
    .lte('criado_em', dataFim)
    .order('criado_em', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('Erro ao buscar pesquisas:', error);
    throw error;
  }
  console.log(`Query executada: pesquisas criadas entre ${dataInicio} e ${dataFim} com audio_url não nulo`);
  return data || [];
}

async function processar(pesquisa, modelName) {
  try {
    console.log(`Processando pesquisa ${pesquisa.id} (erro anterior: ${pesquisa.stt_erro || 'N/A'})...`);
    
    const pesquisaCompleta = await fetchPesquisa(pesquisa.id);
    const formulario = await fetchFormulario(pesquisaCompleta.formulario_id);
    
    if (!formulario || !formulario.campos) {
      console.log(`Pesquisa ${pesquisa.id}: sem formulário ou campos`);
      return;
    }
    
    if (!pesquisaCompleta.audio_url) {
      console.log(`Pesquisa ${pesquisa.id}: sem áudio. Pulando.`);
      return;
    }
    
    // SEMPRE retranscrever o áudio (mesmo que já exista transcrição)
    console.log(`📝 Retranscrevendo áudio da pesquisa ${pesquisa.id}...`);
    let transcricao;
    try {
      // Atualizar status para processando e limpar erro anterior
      await supabaseAdmin
        .from('pesquisas')
        .update({ stt_status: 'processando', stt_erro: null })
        .eq('id', pesquisa.id);
      
      transcricao = await transcreverAudio(pesquisaCompleta.audio_url);
      await atualizarTranscricao(pesquisa.id, transcricao);
      console.log(`✓ Transcrição concluída para pesquisa ${pesquisa.id}`);
    } catch (e) {
      const msg = e?.message || String(e);
      console.error(`✗ Erro na transcrição da pesquisa ${pesquisa.id}:`, msg);
      await supabaseAdmin
        .from('pesquisas')
        .update({ stt_status: 'erro', stt_erro: msg })
        .eq('id', pesquisa.id);
      throw new Error(`Falha na transcrição: ${msg}`);
    }
    
    // Processar com IA
    console.log(`🤖 Processando IA para pesquisa ${pesquisa.id}...`);
    const respostasIA = await processarIAComGemini(
      transcricao,
      formulario.campos,
      formulario.pre_candidato,
      modelName
    );
    
    await updatePesquisaIA(pesquisa.id, respostasIA);
    console.log(`✓ Pesquisa ${pesquisa.id} processada com sucesso`);
    
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(`✗ Erro na pesquisa ${pesquisa.id}:`, msg);
    await markPesquisaIAErro(pesquisa.id, msg);
  }
}

async function main() {
  console.log('Processador de IA iniciado...');
  console.log('Este worker reprocessa pesquisas criadas em 16-11-2025 que tenham áudios.');
  console.log('Retranscreve os áudios e processa com IA.');
  
  // Verificar configuração de transcrição
  if (STT_PROVIDER === 'gemini') {
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY não definido. Transcrição com Gemini não será possível.');
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
  } else if (STT_PROVIDER === 'local') {
    const apiUrl = process.env.TRANSCRIPTION_API_URL || 'http://localhost:3004/api/transcribe';
    console.log(`📡 Usando API local de Whisper: ${apiUrl}`);
    console.log('💡 Certifique-se de que a API local está rodando (npm start na pasta api/)');
  }
  
  // Resolver modelo Gemini
  const modelName = await resolveGeminiModel();
  console.log('Modelo Gemini selecionado:', modelName);
  
  let totalProcessadas = 0;
  let rodada = 1;
  
  // Verificar quantas pesquisas existem antes de processar
  const { count } = await supabaseAdmin
    .from('pesquisas')
    .select('*', { count: 'exact', head: true })
    .not('audio_url', 'is', null)
    .gte('criado_em', '2025-11-16T00:00:00.000Z')
    .lte('criado_em', '2025-11-16T23:59:59.999Z');
  console.log(`\n📊 Total de pesquisas de 16-11-2025 com áudios no banco: ${count || 0}`);
  
  // Loop até processar todas
  while (true) {
    console.log(`\n--- Rodada ${rodada} ---`);
    
    // Buscar pesquisas criadas em 16-11-2025 com áudios
    const pesquisas = await fetchPesquisasPendentes(BATCH_SIZE);
    console.log(`Encontradas ${pesquisas.length} pesquisas de 16-11-2025 com áudios`);
    
    if (pesquisas.length === 0) {
      console.log('\n✓ Todas as pesquisas de 16-11-2025 foram reprocessadas!');
      console.log(`Total processado: ${totalProcessadas} pesquisas`);
      break;
    }
    
    // Processar em lote
    for (const pesquisa of pesquisas) {
      await processar(pesquisa, modelName);
      totalProcessadas++;
    }
    
    console.log(`Processadas ${pesquisas.length} pesquisas nesta rodada`);
    rodada++;
    
    // Pequeno delay entre rodadas para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nProcessamento concluído!');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

