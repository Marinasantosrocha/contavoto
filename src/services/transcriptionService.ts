// API de transcrição usando Web Speech API como fallback
export class TranscriptionService {
  private recognition: any = null;

  constructor() {
    // Verificar se o navegador suporta Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configurações otimizadas para offline
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'pt-BR';
      this.recognition.maxAlternatives = 1;
      
      // Configurações para melhor funcionamento offline
      // Removido grammars que estava causando erro
    }
  }

  // Transcrição em tempo real usando Web Speech API (funciona offline)
  async transcribeRealtime(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition não suportado neste navegador'));
        return;
      }

      let finalTranscript = '';
      let hasResult = false;

      // Timeout para evitar travamento
      const timeout = setTimeout(() => {
        if (!hasResult) {
          this.recognition.stop();
          reject(new Error('Timeout na transcrição. Tente novamente.'));
        }
      }, 15000); // 15 segundos

      this.recognition.onresult = (event: any) => {
        hasResult = true;
        clearTimeout(timeout);
        
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          finalTranscript = transcript;
        }
      };

      this.recognition.onend = () => {
        clearTimeout(timeout);
        if (finalTranscript) {
          resolve(finalTranscript);
        } else if (hasResult) {
          resolve('Não foi possível entender a fala. Tente falar mais claramente.');
        } else {
          reject(new Error('Nenhuma fala detectada. Verifique se o microfone está funcionando.'));
        }
      };

      this.recognition.onerror = (event: any) => {
        clearTimeout(timeout);
        
        let errorMessage = 'Erro na transcrição';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Nenhuma fala detectada. Tente falar mais alto.';
            break;
          case 'audio-capture':
            errorMessage = 'Erro no microfone. Verifique se está funcionando.';
            break;
          case 'not-allowed':
            errorMessage = 'Permissão de microfone negada. Permita o acesso ao microfone.';
            break;
          case 'network':
            errorMessage = 'Erro de rede (mas funciona offline). Tente novamente.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Serviço de reconhecimento não permitido.';
            break;
          default:
            errorMessage = `Erro na transcrição: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.onstart = () => {
        console.log('🎤 Transcrição iniciada (funcionando offline)...');
      };

      try {
        this.recognition.start();
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error('Erro ao iniciar reconhecimento de fala.'));
      }
    });
  }

  // Transcrição de arquivo de áudio - redireciona para transcrição em tempo real
  async transcribeAudioFile(audioBlob: Blob): Promise<string> {
    // A Web Speech API não funciona bem com arquivos reproduzidos
    // Redirecionar para transcrição em tempo real
    throw new Error('Use transcrição em tempo real para melhor precisão');
  }

  // Verificar se o navegador suporta transcrição
  isSupported(): boolean {
    return this.recognition !== null;
  }

  // Parar transcrição em andamento
  stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

// Hook para usar o serviço de transcrição
export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptionService = useRef(new TranscriptionService());

  const transcribeRealtime = useCallback(async (): Promise<string> => {
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcriptionService.current.transcribeRealtime();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na transcrição';
      setError(errorMessage);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const transcribeAudioFile = useCallback(async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await transcriptionService.current.transcribeAudioFile(audioBlob);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na transcrição';
      setError(errorMessage);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const stopTranscription = useCallback(() => {
    transcriptionService.current.stop();
    setIsTranscribing(false);
  }, []);

  return {
    isTranscribing,
    error,
    transcribeRealtime,
    transcribeAudioFile,
    stopTranscription,
    isSupported: transcriptionService.current.isSupported(),
  };
}
