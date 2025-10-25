import { useState, useEffect } from 'react';
import { CampoFormulario } from '../db/localDB';
import './CheckboxQuestion.css';

interface CheckboxQuestionProps {
  campo: CampoFormulario;
  numeroPergunta: number;
  totalPerguntas: number;
  onPerguntei: () => void;
  preCandidato?: string;
  textoAdaptado?: string; // Texto já adaptado por gênero (opcional)
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
  preCandidato,
  textoAdaptado
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
  // Se textoAdaptado foi passado, usar ele; senão usar o label original
  let labelFormatado = textoAdaptado 
    ? textoAdaptado.replace(/{candidato}/gi, preCandidato || 'candidato')
    : campo.label.replace(/{candidato}/gi, preCandidato || 'candidato');

  // Converter Markdown para HTML (negritos **texto** para <strong>texto</strong>)
  labelFormatado = labelFormatado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

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

        <h2 className="question-text" dangerouslySetInnerHTML={{ __html: labelFormatado }}></h2>

        {/* Mostrar opções se houver (radio, checkbox, select) */}
        {campo.opcoes && campo.opcoes.length > 0 && (
          <div className="question-options">
            <ul className="options-list" style={{ 
              display: 'grid', 
              gridTemplateColumns: campo.opcoes.length === 2 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: '0.75rem',
              listStyle: 'none',
              padding: 0
            }}>
              {campo.opcoes?.map((opcao, index) => (
                <li key={index} className="option-item" style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  // Se for a 5ª opção (index 4) de uma lista de 5 opções, ocupar toda a largura
                  gridColumn: campo.opcoes?.length === 5 && index === 4 ? '1 / -1' : 'auto'
                }}>
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
