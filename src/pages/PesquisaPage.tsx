import { useState, useEffect } from 'react';
import { BottomNav } from '../components/BottomNav';
import AceiteParticipacao from '../components/AceiteParticipacao';
import CheckboxQuestion from '../components/CheckboxQuestion';
import RecordingIndicator from '../components/RecordingIndicator';
import { LoadingScreen } from '../components/LoadingScreen';
import { usePesquisa } from '../hooks/usePesquisas';
import { useFormulario } from '../hooks/useFormularios';
import { useSalvarResposta, useFinalizarPesquisa } from '../hooks/usePesquisas';
import { supabase } from '../services/supabaseClient';
import { continuousAudio } from '../services/continuousAudioService';
import { db } from '../db/localDB';

interface PesquisaPageProps {
  pesquisaId: number;
  onFinalizar: () => void;
  onCancelar: () => void;
}

export const PesquisaPage = ({ pesquisaId, onFinalizar, onCancelar }: PesquisaPageProps) => {
  // React Query hooks
  const { data: pesquisa, isLoading: loadingPesquisa } = usePesquisa(pesquisaId);
  const { data: formulario, isLoading: loadingFormulario } = useFormulario(
    pesquisa?.formularioId ?? null
  );
  const salvarResposta = useSalvarResposta();
  const finalizarPesquisa = useFinalizarPesquisa();
  // cancelarPesquisa não é mais usado diretamente aqui

  // Estados locais
  const [respostas, setRespostas] = useState<{ [key: string]: any }>({});
  const [mostrarEncerramento, setMostrarEncerramento] = useState(false);
  const [aceitouParticipar, setAceitouParticipar] = useState<boolean | null>(null);
  const [nomeCandidato, setNomeCandidato] = useState<string>('');
  const [nomeEntrevistador, setNomeEntrevistador] = useState<string>('');
  const [generoEntrevistado, setGeneroEntrevistado] = useState<'masculino' | 'feminino' | null>(null);
  
  // Estados para gravação contínua
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [, setTranscriptionText] = useState('');
  
  // Estados para navegação de perguntas (uma por vez)
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [perguntasFeitas, setPerguntasFeitas] = useState<{ [campoId: string]: boolean }>({});
  const [aceitouVerVideo, setAceitouVerVideo] = useState<boolean | null>(null);
  const [mostrarVideoAgradecimento, setMostrarVideoAgradecimento] = useState(false);
  const [mostrarTelaVideo, setMostrarTelaVideo] = useState(false);

  // Função para adaptar texto das perguntas baseado no gênero
  const adaptarTextoPorGenero = (texto: string, genero: 'masculino' | 'feminino' | null): string => {
    if (!genero) return texto;
    
    if (genero === 'feminino') {
      return texto
        .replace(/senhor\(a\)/gi, 'Senhora')
        .replace(/O\(a\)/g, 'A')
        .replace(/o\(a\)/g, 'a')
        .replace(/ele\(a\)/gi, 'ela')
        .replace(/do\(a\)/gi, 'da')
        .replace(/seu\(sua\)/gi, 'sua');
    } else {
      return texto
        .replace(/senhor\(a\)/gi, 'Senhor')
        .replace(/O\(a\)/g, 'O')
        .replace(/o\(a\)/g, 'o')
        .replace(/ele\(a\)/gi, 'ele')
        .replace(/do\(a\)/gi, 'do')
        .replace(/seu\(sua\)/gi, 'seu');
    }
  };

  // Buscar o nome do candidato do usuário logado
  useEffect(() => {
    const buscarCandidato = async () => {
      try {
        // Primeiro tenta do localStorage
        const usuarioLogadoStr = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (usuarioLogadoStr) {
          const usuarioLogado = JSON.parse(usuarioLogadoStr);
          // Nome do entrevistador para usar no script de abordagem
          if (usuarioLogado?.nome || usuarioLogado?.name) {
            setNomeEntrevistador(usuarioLogado.nome || usuarioLogado.name);
          }
          
          // Se já tem candidato no localStorage, usa ele
          if (usuarioLogado.candidato) {
            setNomeCandidato(usuarioLogado.candidato);
            return;
          }
          
          // Senão, busca do banco
          const { data } = await supabase
            .from('usuarios')
            .select('candidato')
            .eq('id', usuarioLogado.id)
            .single();

          if (data && data.candidato) {
            setNomeCandidato(data.candidato);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar candidato:', error);
      }
    };

    buscarCandidato();
  }, []);

  // Sincroniza respostas com dados da pesquisa
  useEffect(() => {
    if (pesquisa?.respostas) {
      setRespostas(pesquisa.respostas);
    }
  }, [pesquisa]);

  // Atualiza cronômetro da gravação
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      if (continuousAudio.isCurrentlyRecording()) {
        setRecordingDuration(continuousAudio.getCurrentDuration());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  if (loadingPesquisa || loadingFormulario) {
    return <LoadingScreen />;
  }

  if (!pesquisa || !formulario) {
    return <LoadingScreen message="Pesquisa não encontrada" />;
  }

  // Coletar TODAS as perguntas (exceto seções) em uma lista plana
  const todasPerguntas = formulario.campos.filter(campo => {
    // Não mostrar seções (são apenas títulos)
    if (campo.id.startsWith('secao_')) return false;
    
    // Verificar condições de visibilidade
    const deveMostrar = !campo.condicao || 
      respostas[campo.condicao.campoDependente] === campo.condicao.valorRequerido;
    
    return deveMostrar;
  });

  const perguntaAtual = todasPerguntas[perguntaAtualIndex];
  const totalPerguntas = todasPerguntas.length;
  const progresso = totalPerguntas > 0 ? ((perguntaAtualIndex + 1) / totalPerguntas) * 100 : 0;

  // Removido handleResposta não utilizado (evita erro de noUnusedLocals)

  const handleAceitarParticipacao = async (genero: 'masculino' | 'feminino') => {
    setAceitouParticipar(true);
    setGeneroEntrevistado(genero);
    setPerguntaAtualIndex(0);
    
    // Salvar aceite no banco (sem o gênero, apenas true)
    salvarResposta.mutate({
      pesquisaId,
      campoId: 'aceite_participacao',
      valor: true,
    });

    // 🎙️ INICIAR GRAVAÇÃO CONTÍNUA AUTOMATICAMENTE
    try {
      await continuousAudio.startRecording(
        (text) => {
          setTranscriptionText(text);
        },
        (recording) => {
          setIsRecording(recording);
        }
      );
      console.log('✅ Gravação contínua iniciada automaticamente');
    } catch (error) {
      console.error('❌ Erro ao iniciar gravação:', error);
      alert('Não foi possível iniciar a gravação. Verifique as permissões do microfone.');
    }
  };

  const handleRecusarParticipacao = async (motivo: string) => {
    setAceitouParticipar(false);
    
    // Salvar recusa e motivo no banco
    salvarResposta.mutate({
      pesquisaId,
      campoId: 'aceite_participacao',
      valor: false,
    });
    
    salvarResposta.mutate({
      pesquisaId,
      campoId: 'motivo_recusa',
      valor: motivo,
    });

    // Finalizar pesquisa como recusada
    await finalizarPesquisa.mutateAsync({
      pesquisaId,
      nomeEntrevistado: undefined,
      telefoneEntrevistado: undefined,
    });
  };

  // transcrição já é tratada diretamente no onTranscript do componente

  // Handler quando o entrevistador marca "Perguntei"
  const handlePerguntei = () => {
    if (!perguntaAtual) return;

    // Marca pergunta como feita
    const novasPerguntasFeitas = {
      ...perguntasFeitas,
      [perguntaAtual.id]: true
    };
    setPerguntasFeitas(novasPerguntasFeitas);

    // Salva no banco
    salvarResposta.mutate({
      pesquisaId,
      campoId: 'perguntas_feitas',
      valor: novasPerguntasFeitas,
    });

    // 🔖 Adiciona marcador de tempo no áudio
    if (continuousAudio.isCurrentlyRecording()) {
      continuousAudio.addTimeMarker(`Pergunta ${perguntaAtualIndex + 1}: ${perguntaAtual.label}`);
    }

    // Avança para próxima pergunta ou finaliza
    if (perguntaAtualIndex < totalPerguntas - 1) {
      setPerguntaAtualIndex(perguntaAtualIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Chegou ao fim das perguntas
      setMostrarEncerramento(true);
    }
  };

  const handleFinalizar = async () => {
    const nome = respostas['nome_morador'];
    const telefone = respostas['telefone_morador'];

    // 🎙️ PARAR GRAVAÇÃO E SALVAR ÁUDIO
    await pararGravacao();

    await finalizarPesquisa.mutateAsync({
      pesquisaId,
      nomeEntrevistado: nome,
      telefoneEntrevistado: telefone,
    });

    onFinalizar();
  };

  // Função para parar gravação e salvar áudio
  const pararGravacao = async () => {
    let audioBlob: Blob | undefined;
    let transcription: string = '';
    let duration: number = 0;

    if (continuousAudio.isCurrentlyRecording()) {
      try {
        const result = await continuousAudio.stopRecording();
        audioBlob = result.audioBlob;
        transcription = result.transcription;
        duration = result.duration;

        console.log('✅ Gravação finalizada:', {
          tamanho: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
          duracao: `${duration}s`,
          transcricao: `${transcription.length} caracteres`
        });

        // Salvar áudio localmente no IndexedDB
        await db.pesquisas.update(pesquisaId, {
          audioBlob: audioBlob,
          audio_duracao: duration,
          transcricao_completa: transcription,
          processamento_ia_status: 'pendente',
          sincronizado: false
        });

        setIsRecording(false);
      } catch (error) {
        console.error('❌ Erro ao parar gravação:', error);
      }
    }
  };


  // cancelar é invocado diretamente por onCancelar

  // Tela de Encerramento
  if (mostrarEncerramento) {
    // Tela de vídeo em tela cheia
    if (mostrarTelaVideo) {
      return (
        <div className="app-container">
          <main className="main-content" style={{ padding: 0 }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100vh',
              backgroundColor: '#000'
            }}>
              <video
                controls
                autoPlay
                preload="auto"
                style={{ 
                  width: 'auto',
                  maxWidth: '100%',
                  height: 'calc(100vh - 80px)',
                  margin: '0 auto',
                  display: 'block',
                  objectFit: 'contain'
                }}
                src="/lagoa_dos_patos.mov"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#fff',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <button
                  onClick={handleFinalizar}
                  className="btn btn-primary btn-large"
                  style={{ width: '100%', maxWidth: '400px' }}
                  disabled={finalizarPesquisa.isPending}
                >
                  {finalizarPesquisa.isPending ? 'Finalizando...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="app-container">
        {/* Header oculto no encerramento */}

        <main className="main-content">
          <div className="page-section">
            <div className="card">
              <div className="encerramento-texto">
                <p>
                  Muito obrigado por dedicar um tempinho para responder.
                </p>
                <p>
                  O <strong>Prefeito Pedro Braga</strong> gravou um vídeo curtinho para agradecer pessoalmente a cada pessoa que está participando dessa escuta.
                </p>
                <p>
                  É um vídeo simples, de agradecimento, em que ele também fala um pouco sobre o que acredita para o <strong>Norte de Minas</strong> e sobre a importância de ouvir quem vive na região.
                </p>
                <p>
                  Posso te mostrar agora rapidinho?
                </p>

                {/* Botões lado a lado */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '1rem', 
                  marginTop: '1.5rem' 
                }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={async () => { 
                      await pararGravacao();
                      setMostrarTelaVideo(true);
                    }}
                  >
                    Mostrar vídeo
                  </button>
                  <button
                    onClick={async () => {
                      await pararGravacao();
                      handleFinalizar();
                    }}
                    className="btn btn-primary"
                    disabled={finalizarPesquisa.isPending}
                  >
                    {finalizarPesquisa.isPending ? 'Finalizando...' : 'Finalizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Navigation oculto no encerramento */}
      </div>
    );
  }

  // Tela de Pesquisa
  return (
    <div className="app-container">
      {/* Header - Ocultar quando estiver na tela de pesquisa (após selecionar localização) */}
      {!pesquisaId && (
        <header className="modern-header home-header">
          <div className="header-content">
            <div className="header-left">
              <svg 
                onClick={onCancelar}
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none"
                style={{ 
                  marginRight: '12px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <path 
                  d="M15 18L9 12L15 6" 
                  stroke="#1a9bff" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="header-title">{formulario.nome}</h1>
            </div>
          </div>
        </header>
      )}

      <main className="main-content">
        <div className="page-section">
          {/* Abordagem inicial - só mostra se ainda não aceitou ou recusou */}
          {aceitouParticipar === null && (
            <>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Abordagem Inicial</h3>
                </div>
                <div className="script-box">
                  <p>
                    “Bom dia, tudo bem? Meu nome é <strong>{nomeEntrevistador || '—'}</strong> e eu faço parte da equipe do <strong>Prefeito Pedro Braga</strong>, de <strong>Buritizeiro</strong>.
                    Estamos visitando várias cidades do <strong>Norte de Minas</strong> para conversar com as pessoas e entender o que mais precisa melhorar na região.
                    Ele quer escutar quem vive aqui para compreender as prioridades de cada cidade e ajudar a construir soluções.”
                  </p>
                  <p>
                    “É rapidinho, dura uns 8 minutinhos. O(a) senhor(a) topa participar?”
                  </p>
                </div>

                <AceiteParticipacao
                  onAceite={handleAceitarParticipacao}
                  onRecusa={handleRecusarParticipacao}
                  candidato={nomeCandidato || formulario.preCandidato}
                />
              </div>
            </>
          )}

          {/* Se não aceitou */}
          {aceitouParticipar === false && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Moradores ausentes</h3>
              </div>
              <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Parece que não tem ninguém em casa agora.
                <br />
                Tudo bem! Vamos para a próxima.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={onCancelar}
                  className="btn btn-primary"
                  style={{ maxWidth: '200px', padding: '0.75rem 2rem' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Se aceitou, mostrar perguntas uma por vez - SUBSTITUI a abordagem */}
          {aceitouParticipar === true && perguntaAtual && (
            <>
              {/* Barra de progresso */}
              <div style={{ 
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h3 style={{ 
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#343A40',
                  marginBottom: '0.25rem'
                }}>
                  Progresso da Pesquisa
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${progresso}%`, 
                      height: '100%', 
                      backgroundColor: '#1a9bff',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{ 
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content'
                  }}>
                    {perguntaAtualIndex + 1} de {totalPerguntas}
                  </span>
                </div>
              </div>

              {/* Componente de Pergunta com Checkbox */}
              <CheckboxQuestion
                key={perguntaAtual.id}
                campo={perguntaAtual}
                numeroPergunta={perguntaAtualIndex + 1}
                totalPerguntas={totalPerguntas}
                onPerguntei={handlePerguntei}
                preCandidato={nomeCandidato || formulario.preCandidato}
                textoAdaptado={adaptarTextoPorGenero(perguntaAtual.label, generoEntrevistado)}
              />
            </>
          )}
        </div>
      </main>

      {/* Indicador de Gravação (bolinha vermelha piscando) */}
      <RecordingIndicator 
        isRecording={isRecording} 
        duration={recordingDuration}
      />

      {/* Bottom Navigation - Ocultar quando estiver na tela de pesquisa (após selecionar localização) */}
      {!pesquisaId && <BottomNav />}
    </div>
  );
};
