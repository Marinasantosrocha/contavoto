/**
 * Servidor Express para API de Transcrição
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transcribeHandler from './transcribe.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'transcription-api' });
});

// Endpoint de transcrição
app.post('/api/transcribe', transcribeHandler);

// Erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API de Transcrição rodando em http://localhost:${PORT}`);
  console.log(`📡 Endpoint: POST http://localhost:${PORT}/api/transcribe`);
});
