/**
 * API de Transcrição com Whisper (Node.js)
 * 
 * Endpoint: POST /api/transcribe
 * Body: { audio_url: string, pesquisa_id: string }
 * 
 * Fluxo:
 * 1. Baixa áudio do Supabase Storage
 * 2. Transcreve com Whisper (via @xenova/transformers)
 * 3. Retorna { texto, confianca, duracao }
 * 
 * Dependências:
 * - @xenova/transformers v2.17.2 (Whisper WASM/ONNX, roda em Node sem GPU)
 */

import { pipeline } from '@xenova/transformers';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache do modelo Whisper (carrega uma vez na primeira requisição)
let transcriber = null;

async function initTranscriber() {
  if (!transcriber) {
    console.log('🔄 Carregando modelo Whisper (primeira vez, pode demorar ~1-2min)...');
    // Modelo pequeno PT (português): Xenova/whisper-small
    // Alternativa maior e mais precisa: Xenova/whisper-medium ou Xenova/whisper-large-v2
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
      // Forçar português
      language: 'portuguese',
      task: 'transcribe',
    });
    console.log('✅ Modelo Whisper carregado!');
  }
  return transcriber;
}

/**
 * Baixa áudio do URL público do Supabase Storage
 */
async function downloadAudio(audioUrl) {
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Erro ao baixar áudio: ${response.statusText}`);
  }
  
  // Salva temporariamente
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
  const buffer = await response.buffer();
  fs.writeFileSync(tempFile, buffer);
  
  return tempFile;
}

/**
 * Handler principal
 */
export default async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { audio_url, pesquisa_id } = req.body;
    
    if (!audio_url) {
      return res.status(400).json({ error: 'audio_url é obrigatório' });
    }

    console.log(`🎙️ Iniciando transcrição da pesquisa ${pesquisa_id || 'N/A'}`);
    console.log(`📥 Baixando áudio: ${audio_url}`);
    
    // 1. Baixar áudio
    const audioPath = await downloadAudio(audio_url);
    console.log(`✅ Áudio baixado: ${audioPath}`);
    
    // 2. Transcrever
    console.log('🧠 Transcrevendo com Whisper...');
    const model = await initTranscriber();
    const result = await model(audioPath, {
      return_timestamps: false, // Se quiser timestamps, mude para true
      chunk_length_s: 30, // Processa em chunks de 30s (otimização)
    });
    
    // 3. Limpar arquivo temporário
    fs.unlinkSync(audioPath);
    
    const texto = result.text || '';
    console.log(`✅ Transcrição concluída: ${texto.length} caracteres`);
    
    // Retorna resultado
    return res.status(200).json({
      success: true,
      texto,
      confianca: 85, // Whisper não retorna confiança nativa; usar valor fixo ou calcular heurística
      duracao: texto.split(' ').length * 0.3, // Estimativa: ~0.3s por palavra
    });

  } catch (error) {
    console.error('❌ Erro na transcrição:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro desconhecido',
    });
  }
};
