import 'dotenv/config';
import { supabaseAdmin } from './supabaseAdminClient.js';
import OpenAI from 'openai';
import os from 'os';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

const openaiApiKey = process.env.OPENAI_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const STT_PROVIDER = process.env.STT_PROVIDER || 'openai';
const BATCH_SIZE = parseInt(process.env.STT_BATCH_SIZE || '3', 10);
const LOOP_DELAY_MS = parseInt(process.env.STT_LOOP_DELAY_MS || '10000', 10);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPendingJobs(limit) {
  const { data, error } = await supabaseAdmin
    .from('transcription_jobs')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function markJobStatus(jobId, status, fields = {}) {
  const { error } = await supabaseAdmin
    .from('transcription_jobs')
    .update({ status, ...fields })
    .eq('id', jobId);
  if (error) throw error;
}

async function updatePesquisaSTT(pesquisaId, patch) {
  const { error } = await supabaseAdmin
    .from('pesquisas')
    .update(patch)
    .eq('id', pesquisaId);
  if (error) throw error;
}

async function fetchPesquisa(pesquisaId) {
  const { data, error } = await supabaseAdmin
    .from('pesquisas')
    .select('id, formulario_id, respostas, transcricao_completa')
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
  // Usa ReadStream para compatibilidade com Node (evita depender de File em ambiente Node)
  const readStream = createReadStream(filePath);
  const transcription = await client.audio.transcriptions.create({
    file: readStream,
    model: 'whisper-1',
    language: 'pt',
  });
  return transcription.text || '';
}

// ============ IA (Gemini) ============
function montarPrompt(transcricao, campos, candidato) {
  const listaCampos = (campos || [])
    .map((campo) => {
      let desc = `- ${campo.id} (${campo.tipo})`;
      if (campo.label) desc += `: "${campo.label}"`;
      if (Array.isArray(campo.opcoes) && campo.opcoes.length > 0) {
        desc += ` | Opções: ${campo.opcoes.join(', ')}`;
      }
      if (campo.obrigatorio) desc += ' [OBRIGATÓRIO]';
      return desc;
    })
    .join('\n');

  const promptCandidato = candidato ? `O candidato mencionado é: ${candidato}\n\n` : '';
  return `Você é um assistente de IA especializado em análise de pesquisas eleitorais.

${promptCandidato}TRANSCRIÇÃO DA ENTREVISTA:
---
${transcricao}
---

CAMPOS ESPERADOS:
${listaCampos}

INSTRUÇÕES:
1. Extraia respostas objetivas para os campos listados
2. Para campos com opções, responda com um valor exatamente igual a uma das opções
3. Para campos livres, extraia o melhor texto curto correspondente
4. Defina um nível de confiança (0-100) para cada campo
5. Se não houver informação, use null e confiança 0

FORMATO (JSON):
{
  "respostas": { "campo_id": "valor ou null" },
  "confianca": { "campo_id": 0 },
  "observacoes": "..."
}

Retorne apenas o JSON.`;
}

async function geminiGenerateJSON(prompt) {
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY ausente');
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
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
  return JSON.parse(json);
}

async function processarIASeHabilitado(pesquisaId, transcricao) {
  if (!geminiApiKey) {
    // IA não habilitada no worker; manter como pendente para outro processamento
    return;
  }
  const pesquisa = await fetchPesquisa(pesquisaId);
  const formulario = await fetchFormulario(pesquisa.formulario_id);
  const campos = formulario?.campos || [];
  const candidato = formulario?.pre_candidato;
  const prompt = montarPrompt(transcricao, campos, candidato);
  const resultado = await geminiGenerateJSON(prompt);
  const respostasIA = resultado?.respostas || {};
  const confianca = resultado?.confianca || {};
  const observacoes = resultado?.observacoes || null;

  // Mescla respostas IA com existentes (IA completa valores faltantes)
  const respostasMescladas = { ...(pesquisa.respostas || {}), ...respostasIA };
  const patch = {
    respostas: respostasMescladas,
    processamento_ia_status: 'concluido',
    processamento_ia_confianca: confianca,
  };
  // Se colunas opcionais existirem, o update vai ignorar silenciosamente se não existirem
  if (observacoes) patch.observacoes_ia = observacoes;
  if (Object.keys(respostasIA).length > 0) patch.respostas_ia = respostasIA;
  await updatePesquisaSTT(pesquisaId, patch);
}

async function processJob(job) {
  try {
    console.log(`Processando job ${job.id} para pesquisa ${job.pesquisa_id}`);
    await markJobStatus(job.id, 'processando');
    await updatePesquisaSTT(job.pesquisa_id, { stt_status: 'processando', stt_erro: null });

    if (!job.audio_url) throw new Error('Job sem audio_url');

    const tmpFile = await downloadToTemp(job.audio_url, `job_${job.id}.webm`);

    let text = '';
    if (STT_PROVIDER === 'openai') {
      text = await transcribeWithOpenAI(tmpFile);
    } else {
      throw new Error(`STT_PROVIDER não suportado: ${STT_PROVIDER}`);
    }

    await updatePesquisaSTT(job.pesquisa_id, {
      transcricao_completa: text,
      stt_status: 'concluido',
      stt_erro: null,
      processamento_ia_status: 'pendente',
    });

    await markJobStatus(job.id, 'ok', { tentativas: job.tentativas + 1, last_error: null });
    console.log(`Job ${job.id} concluído.`);
    // Tenta processar IA no worker (se chave estiver configurada)
    try {
      await processarIASeHabilitado(job.pesquisa_id, text);
    } catch (e) {
      console.error('IA (Gemini) falhou no worker:', e?.message || e);
      // Mantém processamento_ia_status como 'pendente' para outro componente tratar
    }
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(`Erro no job ${job.id}:`, msg);
    try {
      await markJobStatus(job.id, 'erro', { tentativas: (job.tentativas || 0) + 1, last_error: msg });
      await updatePesquisaSTT(job.pesquisa_id, { stt_status: 'erro', stt_erro: msg });
    } catch {}
  }
}

async function mainLoop() {
  console.log('STT Worker iniciado. Provider:', STT_PROVIDER);
  if (STT_PROVIDER === 'openai' && !openaiApiKey) {
    console.error('OPENAI_API_KEY não definido. Saindo.');
    process.exit(1);
  }
  while (true) {
    try {
      const jobs = await fetchPendingJobs(BATCH_SIZE);
      if (jobs.length === 0) {
        await sleep(LOOP_DELAY_MS);
        continue;
      }
      for (const job of jobs) {
        await processJob(job);
      }
    } catch (e) {
      console.error('Loop erro:', e);
      await sleep(LOOP_DELAY_MS);
    }
  }
}

mainLoop().catch(err => {
  console.error('Worker falhou:', err);
  process.exit(1);
});
