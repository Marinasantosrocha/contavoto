import { useState, useEffect } from 'react';
import { CampoFormulario } from '../db/localDB';
import './CheckboxQuestion.css';

interface CheckboxQuestionProps {
  campo: CampoFormulario;
  numeroPergunta: number;
  totalPerguntas: number;
  onPerguntei: () => void;
  preCandidato?: string;
}

/**
 * Componente para exibir UMA pergunta por vez
 * Com checkbox "Perguntei" e botão "Próximo"
 * Botão só habilita se checkbox marcado
 */
export default function CheckboxQuestion({
  campo,
  numeroPergunta,
  totalPerguntas,
  onPerguntei,
  preCandidato
}: CheckboxQuestionProps) {
  const [perguntei, setPerguntei] = useState(false);
  
  // Sempre que a pergunta mudar, resetar o estado do checkbox
  // Garante que a próxima pergunta não venha marcada
  useEffect(() => {
    setPerguntei(false);
  }, [campo.id, numeroPergunta]);

  const handleCheckboxChange = (checked: boolean) => {
    setPerguntei(checked);
  };

  const handleProximo = () => {
    if (perguntei) {
      onPerguntei();
    }
  };

  // Formatar label da pergunta (substituir {candidato} se existir)
  const labelFormatado = campo.label.replace(
    /{candidato}/gi,
    preCandidato || 'candidato'
  );

  return (
    <div className="checkbox-question-container">
      {/* Card com a pergunta */}
      <div className="question-card">
        <div className="question-header">
          <span className="question-number">
            Pergunta {numeroPergunta} de {totalPerguntas}
          </span>
          
          {/* Checkbox "Perguntei" no canto direito */}
          <label className="perguntei-checkbox">
            <input
              type="checkbox"
              checked={perguntei}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
            />
            <span className="checkbox-custom"></span>
          </label>
        </div>

        <h2 className="question-text">{labelFormatado}</h2>

        {/* Mostrar opções se houver (radio, checkbox, select) */}
        {campo.opcoes && campo.opcoes.length > 0 && (
          <div className="question-options">
            <ul className="options-list">
              {campo.opcoes.map((opcao, index) => (
                <li key={index} className="option-item">
                  {opcao}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Botão Próximo */}
      <button
        className="btn-proximo"
        onClick={handleProximo}
        disabled={!perguntei}
      >
        {numeroPergunta < totalPerguntas ? (
          <>Próximo</>
        ) : (
          <>Finalizar</>
        )}
      </button>
    </div>
  );
}
