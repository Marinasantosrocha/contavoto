import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { TranscriptionService } from '../services/transcriptionService';

interface AudioRecorderProps {
  onTranscript: (transcript: string) => void;
  question: string;
  autoStart?: boolean;
  shouldStop?: boolean;
  autoTranscribeOnStop?: boolean;
  hideControls?: boolean; // quando true, não renderiza os botões internos
  onRecordingChange?: (isRecording: boolean) => void; // notifica quando começa/para de gravar
}

export function AudioRecorder({ onTranscript, question, autoStart = false, shouldStop = false, autoTranscribeOnStop = true, hideControls = false, onRecordingChange }: AudioRecorderProps) {
  const {
    isRecording,
    isProcessing,
    audioBlob,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  // Estado local
  const [isRealtimeProcessing, setIsRealtimeProcessing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  // estados e refs para transcrição em tempo real
  const transcriptionServiceRef = useRef<TranscriptionService | null>(null);
  const transcriptionPromiseRef = useRef<Promise<string> | null>(null);

  // Auto-start recording quando solicitado
  useEffect(() => {
    if (autoStart) {
      handleStartRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Parar automaticamente quando solicitado
  useEffect(() => {
    const doStop = async () => {
      if (shouldStop && isRecording) {
        await handleStopRecording();
      }
    };
    doStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStop]);


  const handleStartRecording = async () => {
    await startRecording();
    if (onRecordingChange) onRecordingChange(true);
    // Se queremos transcrever automaticamente no fim usando modo offline,
    // iniciamos o reconhecimento em tempo real agora e paramos no final
    if (autoTranscribeOnStop) {
      try {
        transcriptionServiceRef.current = new TranscriptionService();
        if (transcriptionServiceRef.current.isSupported()) {
          transcriptionPromiseRef.current = transcriptionServiceRef.current.transcribeRealtime();
        } else {
          // Se não suportado, apenas não inicia, e deixamos sem transcrição automática
          console.warn('Transcrição em tempo real não suportada neste navegador.');
        }
      } catch (err) {
        console.warn('Falha ao iniciar transcrição em tempo real:', err);
      }
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
    if (onRecordingChange) onRecordingChange(false);
    // Encerrar reconhecimento se estiver ativo e obter resultado
    if (autoTranscribeOnStop && transcriptionServiceRef.current) {
      try {
        transcriptionServiceRef.current.stop();
        if (transcriptionPromiseRef.current) {
          const result = await transcriptionPromiseRef.current;
          if (result) {
            onTranscript(result);
            setShowTranscript(true);
          }
        }
      } catch (err) {
        console.warn('Transcrição em tempo real falhou ao finalizar:', err);
      } finally {
        transcriptionServiceRef.current = null;
        transcriptionPromiseRef.current = null;
      }
    }
  };

  // transcrição sob demanda (botão "Transcrever ao Vivo") permanece abaixo

  const handleRealtimeTranscribe = async () => {
    try {
      const { TranscriptionService } = await import('../services/transcriptionService');
      const transcriptionService = new TranscriptionService();
      if (transcriptionService.isSupported()) {
        const userConfirmed = confirm(
          '🎤 Transcrição ao Vivo (OFFLINE)\n\n' +
          '✅ Funciona sem internet\n' +
          '✅ Usa modelo local do navegador\n' +
          '✅ Transcrição em português brasileiro\n\n' +
          'Clique em "OK" e fale sua resposta claramente.'
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
        alert('Transcrição não suportada neste navegador. Use Chrome ou Edge.');
      }
    } catch (err) {
      console.error('Erro na transcrição em tempo real:', err);
      setIsRealtimeProcessing(false);
      alert('Erro na transcrição. Verifique o microfone ou digite manualmente.');
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
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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
        <h3>Gravação de Resposta</h3>
        <p className="question-text">{question}</p>
      </div>

      {/* Transcrição posicionada logo abaixo da descrição do container */}
      {transcript && showTranscript && (
        <div className="transcript-review" style={{ marginTop: '8px', marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '8px' }}>Resposta transcrita</h4>
          <div className="transcript-text">{transcript}</div>
        </div>
      )}

      <div className="recorder-controls">
        {!hideControls && !isRecording && !audioBlob && (
          <button
            onClick={handleStartRecording}
            className="btn btn-primary btn-large"
            disabled={isProcessing}
          >
            Iniciar Gravação
          </button>
        )}

        {isRecording && (
          <div className="recording-status">
            <div className="recording-indicator">
              <div className="pulse-dot"></div>
              <span>Gravando... Fale agora</span>
            </div>
            {!hideControls && (
              <button onClick={handleStopRecording} className="btn btn-danger">
                ⏹️ Parar Gravação
              </button>
            )}
          </div>
        )}

        {!hideControls && audioBlob && !transcript && !showTranscript && (
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
                {isRealtimeProcessing ? '⌛ Transcrevendo...' : 'Transcrever ao Vivo'}
              </button>
              <button onClick={clearRecording} className="btn btn-secondary">🗑️ Descartar</button>
            </div>
            <small style={{ display: 'block', marginTop: '0.5rem', color: '#6c757d', textAlign: 'center' }}>
              💡 Transcrição funciona OFFLINE - Use "Transcrever ao Vivo" para melhor precisão
            </small>
          </div>
        )}

        {transcript && showTranscript && !hideControls && (
          <div className="transcript-actions">
            <button onClick={handleAcceptTranscript} className="btn btn-primary">✅ Aceitar Resposta</button>
            <button onClick={handleRejectTranscript} className="btn btn-secondary">❌ Rejeitar</button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}
