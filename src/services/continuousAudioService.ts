/**
 * Serviço de Gravação Contínua de Áudio
 * 
 * Funcionalidades:
 * - Inicia gravação automaticamente quando o entrevistado aceita participar
 * - Grava continuamente até o fim da pesquisa
 * - Usa Web Speech API para transcrição em tempo real (offline)
 * - Salva Blob do áudio localmente no IndexedDB
 * - Retorna áudio completo + transcrição ao finalizar
 */

export class ContinuousAudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recognition: any = null; // SpeechRecognition
  private transcriptionText: string = '';
  private isRecording: boolean = false;
  private startTime: number = 0;
  private onTranscriptionUpdate?: (text: string) => void;
  private onRecordingStatusChange?: (isRecording: boolean) => void;

  constructor() {
    // Inicializa Web Speech API se disponível
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Gravação contínua
      this.recognition.interimResults = true; // Resultados intermediários
      this.recognition.lang = 'pt-BR';
      this.recognition.maxAlternatives = 1;

      // Eventos de transcrição
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.transcriptionText += finalTranscript;
          if (this.onTranscriptionUpdate) {
            this.onTranscriptionUpdate(this.transcriptionText);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erro na transcrição:', event.error);
        // Se der erro, tenta reiniciar (comum em gravações longas)
        if (this.isRecording && event.error !== 'no-speech') {
          setTimeout(() => {
            if (this.isRecording) {
              try {
                this.recognition?.start();
              } catch (e) {
                console.log('Transcrição já ativa');
              }
            }
          }, 1000);
        }
      };

      this.recognition.onend = () => {
        // Se ainda está gravando, reinicia (Web Speech API para sozinho depois de um tempo)
        if (this.isRecording) {
          try {
            this.recognition?.start();
          } catch (e) {
            console.log('Transcrição já ativa ou encerrada');
          }
        }
      };
    }
  }

  /**
   * Inicia gravação de áudio contínua
   */
  async startRecording(
    onTranscriptionUpdate?: (text: string) => void,
    onRecordingStatusChange?: (isRecording: boolean) => void
  ): Promise<void> {
    if (this.isRecording) {
      console.warn('Gravação já está ativa');
      return;
    }

    try {
      // Solicita permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Configura MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.transcriptionText = '';
      this.startTime = Date.now();
      this.onTranscriptionUpdate = onTranscriptionUpdate;
      this.onRecordingStatusChange = onRecordingStatusChange;

      // Coleta chunks de áudio
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Inicia gravação de áudio
      this.mediaRecorder.start(1000); // Salva chunks a cada 1 segundo
      this.isRecording = true;

      // Inicia transcrição SOMENTE quando online
      if (this.recognition) {
        if (navigator.onLine) {
          try {
            this.recognition.start();
          } catch (e) {
            console.log('Transcrição já ativa');
          }
        } else {
          console.log('Offline: transcrição em tempo real desabilitada. Apenas gravando áudio.');
        }
      }

      // Notifica status
      if (this.onRecordingStatusChange) {
        this.onRecordingStatusChange(true);
      }

      console.log('✅ Gravação contínua iniciada');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      this.isRecording = false;
      if (this.onRecordingStatusChange) {
        this.onRecordingStatusChange(false);
      }
      throw error;
    }
  }

  /**
   * Para gravação e retorna resultado
   */
  async stopRecording(): Promise<{
    audioBlob: Blob;
    transcription: string;
    duration: number;
  }> {
    if (!this.isRecording) {
      throw new Error('Nenhuma gravação ativa');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder não inicializado'));
        return;
      }

      // Para transcrição
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {
          console.log('Transcrição já parada');
        }
      }

      // Para gravação
      this.mediaRecorder.onstop = () => {
        const duration = Math.floor((Date.now() - this.startTime) / 1000); // em segundos

        // Cria Blob do áudio
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Para todas as tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        this.isRecording = false;

        // Notifica status
        if (this.onRecordingStatusChange) {
          this.onRecordingStatusChange(false);
        }

        console.log('✅ Gravação parada:', {
          tamanho: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
          duracao: `${duration}s`,
          transcricao: `${this.transcriptionText.length} caracteres`
        });

        resolve({
          audioBlob,
          transcription: this.transcriptionText,
          duration
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Adiciona marcador de tempo (para indicar mudança de pergunta)
   */
  addTimeMarker(label: string): void {
    if (!this.isRecording) return;

    const currentTime = Math.floor((Date.now() - this.startTime) / 1000);
    const marker = `\n[${currentTime}s - ${label}]\n`;
    
    this.transcriptionText += marker;

    if (this.onTranscriptionUpdate) {
      this.onTranscriptionUpdate(this.transcriptionText);
    }

    console.log(`🔖 Marcador adicionado: ${label} (${currentTime}s)`);
  }

  /**
   * Verifica se está gravando
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Obtém transcrição atual (parcial)
   */
  getCurrentTranscription(): string {
    return this.transcriptionText;
  }

  /**
   * Obtém duração atual da gravação
   */
  getCurrentDuration(): number {
    if (!this.isRecording) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// Instância global (singleton)
export const continuousAudio = new ContinuousAudioService();
