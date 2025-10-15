import { useState, useRef, useCallback } from 'react';
import { TranscriptionService } from '../services/transcriptionService';

interface AudioRecorderHook {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar permissão para microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioBlob(audioBlob);
        
        // Parar todas as tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Iniciar gravação
      mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
      setIsRecording(true);

    } catch (err) {
      setError('Erro ao acessar o microfone. Verifique as permissões.');
      console.error('Erro ao iniciar gravação:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setTranscript('');
    setError(null);
    audioChunksRef.current = [];
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const transcriptionService = new TranscriptionService();
      const transcription = await transcriptionService.transcribeAudioFile(audioBlob);
      
      setTranscript(transcription);
      return transcription;

    } catch (err) {
      const errorMessage = 'Erro ao transcrever áudio. Tente novamente.';
      setError(errorMessage);
      console.error('Erro na transcrição:', err);
      return '';
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    audioBlob,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearRecording,
    transcribeAudio,
  };
}
