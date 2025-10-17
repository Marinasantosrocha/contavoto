import { useState, useEffect } from 'react';
import { CampoFormulario } from '../db/localDB';
import { FormularioStep } from '../components/FormularioStep';
import { AudioRecorder } from '../components/AudioRecorder';
import { usePesquisa } from '../hooks/usePesquisas';
import { useFormulario } from '../hooks/useFormularios';
import { useSalvarResposta, useFinalizarPesquisa, useCancelarPesquisa } from '../hooks/usePesquisas';

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
  const cancelarPesquisa = useCancelarPesquisa();

  // Estados locais
  const [campoAtualIndex, setCampoAtualIndex] = useState(0);
  const [respostas, setRespostas] = useState<{ [key: string]: any }>({});
  const [mostrarEncerramento, setMostrarEncerramento] = useState(false);
  const [modoGravacao, setModoGravacao] = useState(false);
  const [aceitouParticipar, setAceitouParticipar] = useState<boolean | null>(null);
  const [topicoAtualIndex, setTopicoAtualIndex] = useState(0);

  // Sincroniza respostas com dados da pesquisa
  useEffect(() => {
    if (pesquisa?.respostas) {
      setRespostas(pesquisa.respostas);
    }
  }, [pesquisa]);

  if (loadingPesquisa || loadingFormulario) {
    return <div className="loading">Carregando...</div>;
  }

  if (!pesquisa || !formulario) {
    return <div className="loading">Pesquisa não encontrada</div>;
  }

  // Agrupa campos por tópicos (seções)
  const topicos = formulario.campos.reduce((acc, campo) => {
    if (campo.id.startsWith('secao_')) {
      acc.push({
        id: campo.id,
        titulo: campo.label,
        campos: []
      });
    } else if (acc.length > 0) {
      // Verifica se o campo deve ser visível
      const deveMostrar = !campo.condicao || 
        respostas[campo.condicao.campoDependente] === campo.condicao.valorRequerido;
      
      if (deveMostrar) {
        acc[acc.length - 1].campos.push(campo);
      }
    }
    return acc;
  }, [] as Array<{ id: string; titulo: string; campos: CampoFormulario[] }>);

  const topicoAtual = topicos[topicoAtualIndex];
  const progresso = ((topicoAtualIndex + 1) / topicos.length) * 100;

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

  const handleAceitarParticipacao = (aceita: boolean) => {
    setAceitouParticipar(aceita);
    if (aceita) {
      setTopicoAtualIndex(0);
    }
  };

  const handleTranscript = (transcript: string) => {
    if (topicoAtual && topicoAtual.campos.length > 0) {
      const campoAtual = topicoAtual.campos[campoAtualIndex];
      if (campoAtual && !campoAtual.id.startsWith('secao_')) {
        handleResposta(campoAtual.id, transcript);
        setModoGravacao(false);
      }
    }
  };

  const handleProximoTopico = () => {
    if (topicoAtualIndex < topicos.length - 1) {
      setTopicoAtualIndex(topicoAtualIndex + 1);
      setCampoAtualIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Chegou ao fim
      setMostrarEncerramento(true);
    }
  };

  const handleAnteriorTopico = () => {
    if (topicoAtualIndex > 0) {
      setTopicoAtualIndex(topicoAtualIndex - 1);
      setCampoAtualIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalizar = async () => {
    const nome = respostas['nome_morador'];
    const telefone = respostas['telefone_morador'];

    await finalizarPesquisa.mutateAsync({
      pesquisaId,
      nomeEntrevistado: nome,
      telefoneEntrevistado: telefone,
    });

    onFinalizar();
  };

  const handleCancelarPesquisa = async () => {
    if (confirm('Tem certeza que deseja cancelar esta pesquisa?')) {
      await cancelarPesquisa.mutateAsync(pesquisaId);
      onCancelar();
    }
  };

  // Tela de Encerramento
  if (mostrarEncerramento) {
    const preCandidato = formulario.preCandidato;
    const telefoneContato = formulario.telefoneContato;

    return (
      <div className="app-container">
        <header className="modern-header">
          <div className="header-content">
            <div className="header-left">
              <button
                onClick={onCancelar}
                style={{ 
                  marginRight: '12px',
                  background: 'none',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M15 18L9 12L15 6" 
                    stroke="#20B2AA" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h1 className="header-title">Pesquisa Concluída!</h1>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">✅ Encerramento</h3>
              </div>
              <div className="encerramento-texto">
                <p>
                  "Muito obrigado por dedicar seu tempo para responder. A sua participação é muito importante 
                  para que o <strong>{preCandidato}</strong> possa trabalhar para melhorar cada vez mais o município."
                </p>

                <p>
                  "Inclusive, se o senhor puder, envie uma mensagem para o <strong>{preCandidato}</strong>. 
                  O número dele é <strong>{telefoneContato}</strong>. Ele vai ficar muito feliz em receber sua mensagem."
                </p>

                <p>
                  "E se houver algo que o senhor(a) não teve a oportunidade de mencionar durante a pesquisa, 
                  ou que lembrou em outro momento, e que deseja denunciar ou cobrar das autoridades, 
                  pode contar com o <strong>{preCandidato}</strong>."
                </p>

                <p>
                  "E se você puder, envia uma mensagem para o <strong>{preCandidato}</strong> avaliando o meu trabalho."
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
                {finalizarPesquisa.isPending ? '⏳ Finalizando...' : '🏁 Finalizar e Voltar'}
              </button>
            </div>
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <div className="bottom-nav-content">
            <div className="nav-item">
              <div className="nav-icon">🏠</div>
              <span className="nav-label">HOME</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">📊</div>
              <span className="nav-label">PESQUISAS</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">👥</div>
              <span className="nav-label">USUÁRIOS</span>
            </div>
            <div className="nav-item">
              <div className="nav-icon">⚙️</div>
              <span className="nav-label">CONF</span>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // Tela de Pesquisa
  return (
    <div className="app-container">
      <header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={onCancelar}
              style={{ 
                marginRight: '12px',
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M15 18L9 12L15 6" 
                  stroke="#20B2AA" 
                  strokeWidth="3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="header-title">{formulario.nome}</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📍 Localização</h3>
            </div>
            <p>{pesquisa.endereco}, {pesquisa.bairro} - {pesquisa.cidade}</p>
          </div>

          {/* Script de abordagem inicial */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🗣️ Abordagem Inicial</h3>
            </div>
            <div className="script-box">
              <p>
                "Bom dia! Tudo bem? Desculpe incomodar. Eu trabalho para o <strong>{formulario.preCandidato}</strong>. 
                Ele tem trabalhado e buscado melhorias aqui para o bairro e o <strong>{formulario.preCandidato}</strong> gostaria 
                de saber a sua opinião para buscar solução para ajudar a resolver as demandas dos moradores, 
                principalmente em relação aos serviços públicos."
              </p>
              <p>
                "São algumas perguntas bem rápidas. Não vai levar mais do que 10 minutos. 
                O senhor topa participar?"
              </p>
            </div>
          </div>

          {/* Opções de aceitação */}
          {aceitouParticipar === null && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Aceita participar da pesquisa?</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleAceitarParticipacao(true)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Sim
                </button>
                <button
                  onClick={() => handleAceitarParticipacao(false)}
                  style={{ 
                    flex: 1, 
                    background: '#6b7280', 
                    border: '1px solid #6b7280',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Não
                </button>
              </div>
            </div>
          )}

          {/* Se não aceitou */}
          {aceitouParticipar === false && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Pesquisa Recusada</h3>
              </div>
              <p>O entrevistado não aceitou participar da pesquisa.</p>
              <button
                onClick={onCancelar}
                className="btn btn-primary btn-large w-full"
              >
                Voltar
              </button>
            </div>
          )}

          {/* Se aceitou, mostrar pesquisa por tópicos */}
          {aceitouParticipar === true && topicoAtual && (
            <>
              {/* Barra de progresso */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Progresso da Pesquisa</h3>
                </div>
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
                  {topicoAtualIndex + 1} de {topicos.length} tópicos
                </p>
              </div>

              {/* Tópico atual */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">{topicoAtual.titulo}</h3>
                </div>
                
                {/* Campos do tópico atual */}
                {topicoAtual.campos.map((campo, index) => (
                  <div key={campo.id} style={{ marginBottom: '16px' }}>
                    <FormularioStep
                      campo={campo}
                      valor={respostas[campo.id]}
                      onChange={(valor) => handleResposta(campo.id, valor)}
                      preCandidato={formulario.preCandidato}
                    />
                  </div>
                ))}

                {/* Botão de Gravar para o tópico */}
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setModoGravacao(!modoGravacao)}
                    className={`btn ${modoGravacao ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ width: '100%' }}
                  >
                    {modoGravacao ? '✏️ Parar Gravação' : '🎤 Gravar Resposta'}
                  </button>
                </div>

                {/* Componente de Gravação - Sempre visível quando ativo */}
                {modoGravacao && (
                  <div style={{ marginBottom: '16px' }}>
                    <AudioRecorder
                      question={`${topicoAtual.titulo} - ${topicoAtual.campos.map(c => c.label).join(', ')}`}
                      onTranscript={(transcript) => {
                        // Salva a transcrição no primeiro campo do tópico
                        if (topicoAtual.campos.length > 0) {
                          handleResposta(topicoAtual.campos[0].id, transcript);
                        }
                        setModoGravacao(false);
                      }}
                      autoStart={true}
                    />
                  </div>
                )}

                {/* Navegação entre tópicos */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={handleAnteriorTopico}
                    disabled={topicoAtualIndex === 0}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    ⬅️ Anterior
                  </button>
                  <button
                    onClick={handleProximoTopico}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {topicoAtualIndex < topicos.length - 1 ? 'Próximo ➡️' : 'Concluir ✅'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="nav-item">
            <div className="nav-icon">🏠</div>
            <span className="nav-label">HOME</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">📊</div>
            <span className="nav-label">PESQUISAS</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">👥</div>
            <span className="nav-label">USUÁRIOS</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">⚙️</div>
            <span className="nav-label">CONF</span>
          </div>
        </div>
      </nav>
    </div>
  );
};
