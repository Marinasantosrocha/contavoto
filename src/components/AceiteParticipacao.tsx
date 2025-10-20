import { useState } from 'react';
import '../styles/design-system.css';
import './AceiteParticipacao.css';

interface AceiteParticipacaoProps {
  onAceite: () => void;
  onRecusa: (motivo: string) => void;
  candidato?: string; // Nome do candidato (opcional)
}

const MOTIVOS_RECUSA = [
  'Sem tempo',
  'Não gosta de pesquisas',
  'Não mora aqui',
  'Não conhece o candidato',
  'Não quer se identificar',
  'Outro motivo'
];

export default function AceiteParticipacao({ 
  onAceite, 
  onRecusa
}: AceiteParticipacaoProps) {
  const [mostrarMotivos, setMostrarMotivos] = useState(false);
  const [motivo, setMotivo] = useState('');

  const handleNao = () => {
    setMostrarMotivos(true);
  };

  const handleVoltar = () => {
    setMostrarMotivos(false);
    setMotivo('');
  };

  const handleSalvarRecusa = () => {
    if (motivo) {
      onRecusa(motivo);
    }
  };

  if (mostrarMotivos) {
    return (
      <div className="aceite-container">
        <div className="aceite-card">
          <div className="aceite-icon recusa">
            <span>✗</span>
          </div>
          
          <h2 className="aceite-titulo">Por que a pessoa recusou?</h2>
          
          <p className="aceite-descricao">
            Registre o motivo da recusa para ajudar nas estatísticas
          </p>

          <div className="motivos-grid">
            {MOTIVOS_RECUSA.map((opcao) => (
              <button
                key={opcao}
                className={`motivo-btn ${motivo === opcao ? 'selecionado' : ''}`}
                onClick={() => setMotivo(opcao)}
              >
                {opcao}
              </button>
            ))}
          </div>

          <div className="aceite-acoes">
            <button 
              className="btn-voltar" 
              onClick={handleVoltar}
            >
              ← Voltar
            </button>
            <button 
              className="btn-salvar-recusa" 
              onClick={handleSalvarRecusa}
              disabled={!motivo}
            >
              Salvar Recusa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aceite-inline">
      <div className="aceite-botoes">
        <button 
          className="aceite-btn sim" 
          onClick={onAceite}
        >
          Sim
        </button>
        
        <button 
          className="aceite-btn nao" 
          onClick={handleNao}
        >
          Não
        </button>
      </div>
    </div>
  );
}
