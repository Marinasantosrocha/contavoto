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

  const camposVisiveis = formulario.campos.filter((campo) => {
    // Seções sempre visíveis
    if (campo.id.startsWith('secao_')) return true;

    // Campos sem condição sempre visíveis
    if (!campo.condicao) return true;

    // Verifica condição
    const valorCampo = respostas[campo.condicao.campoDependente];
    return valorCampo === campo.condicao.valorRequerido;
  });

  const campoAtual = camposVisiveis[campoAtualIndex];
  const valorAtual = campoAtual ? respostas[campoAtual.id] : undefined;
  const progresso = ((campoAtualIndex + 1) / camposVisiveis.length) * 100;

  const handleResposta = async (valor: any) => {
    if (!campoAtual) return;

    const novasRespostas = {
      ...respostas,
      [campoAtual.id]: valor,
    };

    setRespostas(novasRespostas);

    // Salva no banco local via React Query
    salvarResposta.mutate({
      pesquisaId,
      campoId: campoAtual.id,
      valor,
    });
  };

  const handleTranscript = (transcript: string) => {
    if (campoAtual && !campoAtual.id.startsWith('secao_')) {
      handleResposta(transcript);
      setModoGravacao(false);
    }
  };


  const handleProximo = () => {
    // Valida campo obrigatório
    if (campoAtual?.obrigatorio && !valorAtual && !campoAtual.id.startsWith('secao_')) {
      alert('Este campo é obrigatório!');
      return;
    }

    if (campoAtualIndex < camposVisiveis.length - 1) {
      setCampoAtualIndex(campoAtualIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Chegou ao fim
      setMostrarEncerramento(true);
    }
  };

  const handleAnterior = () => {
    if (campoAtualIndex > 0) {
      setCampoAtualIndex(campoAtualIndex - 1);
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
      <div className="page pesquisa-page">
        <div className="encerramento-container">
          <div className="encerramento-icon">✅</div>
          <h1>Pesquisa Concluída!</h1>

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

          <button
            onClick={handleFinalizar}
            className="btn btn-primary btn-large"
            disabled={finalizarPesquisa.isPending}
          >
            {finalizarPesquisa.isPending ? '⏳ Finalizando...' : '🏁 Finalizar e Voltar'}
          </button>
        </div>
      </div>
    );
  }

  // Tela de Pesquisa
  return (
    <div className="page pesquisa-page">
      <header className="pesquisa-header">
        <button
          onClick={handleCancelarPesquisa}
          className="btn btn-danger btn-small"
          disabled={cancelarPesquisa.isPending}
        >
          ❌ Cancelar
        </button>
        <div>
          <h2>{formulario.nome}</h2>
          <p className="location-info">
            📍 {pesquisa.endereco}, {pesquisa.bairro} - {pesquisa.cidade}
          </p>
        </div>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progresso}%` }}></div>
        <div className="progress-text">
          {campoAtualIndex + 1} de {camposVisiveis.length}
        </div>
      </div>

      {campoAtual && (
        <div className="question-container">
          {/* Script de abordagem inicial */}
          {campoAtualIndex === 0 && (
            <div className="abordagem-inicial">
              <h3>🗣️ Abordagem Inicial</h3>
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
          )}

          <FormularioStep
            campo={campoAtual}
            valor={valorAtual}
            onChange={handleResposta}
            preCandidato={formulario.preCandidato}
          />

          {/* Opção de Gravação */}
          {!campoAtual.id.startsWith('secao_') && (
            <div className="recording-options">
              <div className="recording-toggle">
                <button
                  onClick={() => setModoGravacao(!modoGravacao)}
                  className={`btn ${modoGravacao ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {modoGravacao ? '✏️ Modo Manual' : '🎤 Gravar Resposta'}
                </button>
              </div>

              {modoGravacao && (
                <AudioRecorder
                  question={campoAtual.label}
                  onTranscript={handleTranscript}
                />
              )}
            </div>
          )}


          <div className="navigation-buttons">
            <button
              onClick={handleAnterior}
              disabled={campoAtualIndex === 0}
              className="btn btn-secondary"
            >
              ⬅️ Anterior
            </button>

            <button
              onClick={handleProximo}
              className="btn btn-primary"
              disabled={salvarResposta.isPending}
            >
              {campoAtualIndex < camposVisiveis.length - 1 ? 'Próximo ➡️' : 'Concluir ✅'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
