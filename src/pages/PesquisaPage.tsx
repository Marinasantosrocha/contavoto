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
  
  // Estados para gravação contínua
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');
  
  // Estados para navegação de perguntas (uma por vez)
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [perguntasFeitas, setPerguntasFeitas] = useState<{ [campoId: string]: boolean }>({});

  // Buscar o nome do candidato do usuário logado
  useEffect(() => {
    const buscarCandidato = async () => {
      try {
        // Primeiro tenta do localStorage
        const usuarioLogadoStr = localStorage.getItem('usuario') || localStorage.getItem('user');
        if (usuarioLogadoStr) {
          const usuarioLogado = JSON.parse(usuarioLogadoStr);
          
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

  const handleResposta = async (campoId: string, valor: any) => {
    const novasRespostas = {
      ...respostas,
      [campoId]: valor,
    };

    setRespostas(novasRespostas);

    // Salva no banco local via React Query
    salvarResposta.mutate({
      pesquisaId,
      campoId,
      valor,
    });
  };

  const handleAceitarParticipacao = async () => {
    setAceitouParticipar(true);
    setPerguntaAtualIndex(0);
    
    // Salvar aceite no banco
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

    await finalizarPesquisa.mutateAsync({
      pesquisaId,
      nomeEntrevistado: nome,
      telefoneEntrevistado: telefone,
    });

    onFinalizar();
  };

  // cancelar é invocado diretamente por onCancelar

  // Tela de Encerramento
  if (mostrarEncerramento) {
    const candidatoExibir = nomeCandidato || formulario.preCandidato;
    const telefoneContato = formulario.telefoneContato;

    return (
      <div className="app-container">
        {/* Header oculto no encerramento */}

        <main className="main-content">
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Encerramento</h3>
              </div>
              <div className="encerramento-texto">
                <p>
                  "Muito obrigado por dedicar seu tempo para responder. A sua participação é muito importante 
                  para que o <strong>{candidatoExibir}</strong> possa trabalhar para melhorar cada vez mais o município."
                </p>

                <p>
                  "Inclusive, se o senhor puder, envie uma mensagem para o <strong>{candidatoExibir}</strong>. 
                  O número dele é <strong>{telefoneContato}</strong>. Ele vai ficar muito feliz em receber sua mensagem."
                </p>

                <p>
                  "E se houver algo que o senhor(a) não teve a oportunidade de mencionar durante a pesquisa, 
                  ou que lembrou em outro momento, e que deseja denunciar ou cobrar das autoridades, 
                  pode contar com o <strong>{candidatoExibir}</strong>."
                </p>

                <p>
                  "E se você puder, envia uma mensagem para o <strong>{candidatoExibir}</strong> avaliando o meu trabalho."
                </p>

                <p className="final">
                  <strong>Mais uma vez, muito obrigado pela sua participação e tenha um excelente dia!</strong>
                </p>
              </div>
            </div>

            <div className="card">
              <button
                onClick={handleFinalizar}
                className="btn btn-primary btn-large w-full"
                disabled={finalizarPesquisa.isPending}
              >
                {finalizarPesquisa.isPending ? 'Finalizando...' : 'Finalizar'}
              </button>
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
                  stroke="#20B2AA" 
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
                  <h3 className="card-title">📍 Localização</h3>
                </div>
                <p>{pesquisa.endereco}, {pesquisa.bairro} - {pesquisa.cidade}</p>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">🗣️ Abordagem Inicial</h3>
                </div>
                <div className="script-box">
                  <p>
                    "Bom dia! Tudo bem? Desculpe incomodar. Eu trabalho para o <strong>{nomeCandidato || formulario.preCandidato}</strong>. 
                    Ele tem trabalhado e buscado melhorias aqui para o bairro e o <strong>{nomeCandidato || formulario.preCandidato}</strong> gostaria 
                    de saber a sua opinião para buscar solução para ajudar a resolver as demandas dos moradores, 
                    principalmente em relação aos serviços públicos."
                  </p>
                  <p>
                    "São algumas perguntas bem rápidas. Não vai levar mais do que 10 minutos. 
                    O senhor topa participar?"
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
                <h3 className="card-title">✗ Pesquisa Recusada</h3>
              </div>
              <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                O entrevistado não aceitou participar da pesquisa.
                <br />
                Os dados foram salvos para estatísticas.
              </p>
              <button
                onClick={onCancelar}
                className="btn btn-primary btn-large w-full"
              >
                Voltar para Home
              </button>
            </div>
          )}

          {/* Se aceitou, mostrar perguntas uma por vez - SUBSTITUI a abordagem */}
          {aceitouParticipar === true && perguntaAtual && (
            <>
              {/* Barra de progresso */}
              <div style={{ 
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#343A40',
                  marginBottom: '1rem'
                }}>
                  Progresso da Pesquisa
                </h3>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${progresso}%`, 
                    height: '100%', 
                    backgroundColor: '#20B2AA',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                  {perguntaAtualIndex + 1} de {totalPerguntas} perguntas
                </p>
              </div>

              {/* Componente de Pergunta com Checkbox */}
              <CheckboxQuestion
                campo={perguntaAtual}
                numeroPergunta={perguntaAtualIndex + 1}
                totalPerguntas={totalPerguntas}
                onPerguntei={handlePerguntei}
                preCandidato={nomeCandidato || formulario.preCandidato}
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
