import React, { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onTranscript: (transcript: string) => void;
  question: string;
}

export function AudioRecorder({ onTranscript, question }: AudioRecorderProps) {
  const {
    isRecording,
    isProcessing,
    audioBlob,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    transcribeAudio,
  } = useAudioRecorder();
  
  // Estado local para controlar transcrição em tempo real
  const [isRealtimeProcessing, setIsRealtimeProcessing] = useState(false);

  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleTranscribe = async () => {
    if (audioBlob) {
      try {
        const result = await transcribeAudio(audioBlob);
        if (result) {
          onTranscript(result);
          setShowTranscript(true);
        }
      } catch (error) {
        console.error('Erro na transcrição:', error);
        alert('Transcrição de arquivo não disponível. Use "Transcrever ao Vivo" para melhor precisão.');
      }
    }
  };

  const handleRealtimeTranscribe = async () => {
    try {
      // Importar o serviço de transcrição
      const { TranscriptionService } = await import('../services/transcriptionService');
      const transcriptionService = new TranscriptionService();
      
      if (transcriptionService.isSupported()) {
        // Mostrar instrução para o usuário
        const userConfirmed = confirm(
          '🎤 Transcrição ao Vivo (OFFLINE)\n\n' +
          '✅ Funciona sem internet\n' +
          '✅ Usa modelo local do navegador\n' +
          '✅ Transcrição em português brasileiro\n\n' +
          'Clique em "OK" e fale sua resposta claramente.\n' +
          'O sistema irá transcrever automaticamente.\n\n' +
          'Certifique-se de que o microfone está funcionando.'
        );
        
        if (userConfirmed) {
          setIsRealtimeProcessing(true);
          const result = await transcriptionService.transcribeRealtime();
          if (result && result.trim()) {
            onTranscript(result);
            setShowTranscript(true);
          } else {
            alert('Não foi possível capturar a fala. Tente novamente ou digite manualmente.');
          }
          setIsRealtimeProcessing(false);
        }
      } else {
        alert('Transcrição não suportada neste navegador. Use Chrome ou Edge para melhor compatibilidade.');
      }
    } catch (error) {
      console.error('Erro na transcrição em tempo real:', error);
      setIsRealtimeProcessing(false);
      alert('Erro na transcrição. Verifique se o microfone está funcionando ou digite manualmente.');
    }
  };

  const handleAcceptTranscript = () => {
    onTranscript(transcript);
    clearRecording();
    setShowTranscript(false);
  };

  const handleRejectTranscript = () => {
    setShowTranscript(false);
  };

  const handlePlayAudio = () => {
    if (audioBlob && !isPlaying) {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        setAudioUrl(null);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleStopAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.pause();
      audio.currentTime = 0;
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-header">
        <h3>🎤 Gravação de Resposta</h3>
        <p className="question-text">{question}</p>
      </div>

      <div className="recorder-controls">
        {!isRecording && !audioBlob && (
          <button 
            onClick={handleStartRecording}
            className="btn btn-primary btn-large"
            disabled={isProcessing}
          >
            🎤 Iniciar Gravação
          </button>
        )}

        {isRecording && (
          <div className="recording-status">
            <div className="recording-indicator">
              <div className="pulse-dot"></div>
              <span>Gravando... Fale agora</span>
            </div>
            <button 
              onClick={handleStopRecording}
              className="btn btn-danger"
            >
              ⏹️ Parar Gravação
            </button>
          </div>
        )}

        {audioBlob && !transcript && !showTranscript && (
          <div className="audio-ready">
            <div className="audio-info">
              <span>✅ Áudio gravado com sucesso!</span>
              <p>Tamanho: {Math.round(audioBlob.size / 1000)}KB</p>
            </div>
            <div className="audio-playback">
              <button 
                onClick={isPlaying ? handleStopAudio : handlePlayAudio}
                className={`btn ${isPlaying ? 'btn-danger' : 'btn-success'}`}
              >
                {isPlaying ? '⏹️ Parar' : '▶️ Ouvir Gravação'}
              </button>
            </div>
            <div className="audio-actions">
              <button 
                onClick={handleRealtimeTranscribe}
                className="btn btn-primary"
                disabled={isRealtimeProcessing}
              >
                {isRealtimeProcessing ? '⏳ Transcrevendo...' : '🎤 Transcrever ao Vivo'}
              </button>
              <button 
                onClick={clearRecording}
                className="btn btn-secondary"
              >
                🗑️ Descartar
              </button>
            </div>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#6c757d', textAlign: 'center' }}>
              💡 Transcrição funciona OFFLINE - Use "Transcrever ao Vivo" para melhor precisão
            </small>
          </div>
        )}

        {transcript && showTranscript && (
          <div className="transcript-review">
            <h4>📝 Transcrição Gerada:</h4>
            <div className="transcript-text">
              {transcript}
            </div>
            <div className="transcript-actions">
              <button 
                onClick={handleAcceptTranscript}
                className="btn btn-primary"
              >
                ✅ Aceitar Resposta
              </button>
              <button 
                onClick={handleRejectTranscript}
                className="btn btn-secondary"
              >
                ❌ Rejeitar
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <style jsx>{`
        .audio-recorder {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 32px;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          margin: 24px 0;
        }

        .recorder-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .recorder-header h3 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .question-text {
          font-size: 18px;
          color: #64748b;
          font-weight: 500;
          line-height: 1.6;
        }

        .recorder-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .recording-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-radius: 16px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .audio-ready {
          text-align: center;
        }

        .audio-info {
          margin-bottom: 20px;
        }

        .audio-info span {
          font-size: 18px;
          font-weight: 600;
          color: #10b981;
        }

        .audio-info p {
          color: #64748b;
          margin-top: 8px;
        }

        .audio-playback {
          margin: 16px 0;
          display: flex;
          justify-content: center;
        }

        .audio-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .transcript-review {
          text-align: center;
        }

        .transcript-review h4 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .transcript-text {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(10px);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
          border: 2px solid rgba(59, 130, 246, 0.2);
        }

        .transcript-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .error-message {
          margin-top: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 2px solid #fca5a5;
          border-radius: 16px;
          text-align: center;
        }

        .error-message span {
          color: #dc2626;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .audio-recorder {
            padding: 24px;
          }

          .audio-actions,
          .transcript-actions {
            flex-direction: column;
          }

          .recording-indicator {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
