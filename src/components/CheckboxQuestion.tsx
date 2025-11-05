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
  valor?: any; // Valor atual da resposta (para campos pessoais)
  onChange?: (valor: any) => void; // Callback para salvar resposta (para campos pessoais)
  naoTemTelefone?: boolean; // Estado para botão "Não tem" do telefone
  onNaoTemTelefone?: (valor: boolean) => void; // Callback para botão "Não tem"
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
  textoAdaptado,
  valor,
  onChange,
  naoTemTelefone = false,
  onNaoTemTelefone
}: CheckboxQuestionProps) {
  const [perguntei, setPerguntei] = useState(false);
  const campoComGrupo = campo as CampoFormulario & { grupo?: string };
  const isCampoPessoal = campoComGrupo.grupo === 'pessoais';
  const isCampoTelefone = campo.tipo === 'telefone';
  
  // Sempre que a pergunta mudar, resetar o estado do checkbox
  // Garante que a próxima pergunta não venha marcada
  useEffect(() => {
    setPerguntei(false);
  }, [campo.id, numeroPergunta]);
  
  // Para campos pessoais, o botão habilita quando checkbox está marcado E há valor (se necessário)
  // Para telefone, habilita se "Não tem" marcado OU número digitado
  // Para campos não pessoais, só precisa do checkbox
  const podeAvancar = isCampoPessoal 
    ? perguntei && (
        campo.opcoes ? valor : 
        isCampoTelefone ? (naoTemTelefone || (valor && String(valor).trim() !== '')) :
        (valor && String(valor).trim() !== '')
      )
    : perguntei;

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

  // Remover números do início do label (ex: "3. O Prefeito..." → "O Prefeito...")
  // Remove padrões como "1.", "2.", "3.", "10.", etc. no início
  labelFormatado = labelFormatado.replace(/^\d+\.\s*/, '');

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
          
          {/* Checkbox "Perguntei" no canto direito - para todos os campos */}
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

        {/* Se for campo pessoal, mostrar input para digitação */}
        {isCampoPessoal && (
          <div style={{ marginTop: '1.5rem' }}>
            {/* Campo de texto (nome) */}
            {campo.tipo === 'texto' && campo.id === 'nome_morador' && (
              <input
                type="text"
                value={valor || ''}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="Digite aqui o Nome"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  boxSizing: 'border-box'
                }}
              />
            )}
            
            {/* Campo de data de nascimento (formatado DD/MM ou DD/MM/AAAA) - aceita apenas números */}
            {campo.tipo === 'texto' && campo.id === 'faixa_etaria' && (
              <input
                type="text"
                inputMode="numeric"
                value={valor || ''}
                onKeyDown={(e) => {
                  // Bloqueia qualquer tecla que não seja número ou teclas de controle
                  const tecla = e.key;
                  const teclasPermitidas = [
                    'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta'
                  ];
                  
                  // Permite teclas de controle (backspace, delete, setas, etc)
                  if (teclasPermitidas.includes(tecla) || e.ctrlKey || e.metaKey) {
                    return;
                  }
                  
                  // Permite apenas números (0-9)
                  if (!/^[0-9]$/.test(tecla)) {
                    e.preventDefault();
                    return false;
                  }
                }}
                onChange={(e) => {
                  // Remove tudo que não é número (proteção adicional)
                  const numeros = e.target.value.replace(/\D/g, '');
                  
                  // Formata como DD/MM ou DD/MM/AAAA
                  let formatado = '';
                  if (numeros.length <= 2) {
                    formatado = numeros;
                  } else if (numeros.length <= 4) {
                    formatado = `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
                  } else {
                    formatado = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
                  }
                  
                  onChange?.(formatado);
                }}
                onPaste={(e) => {
                  // Bloqueia colar e remove caracteres não numéricos
                  e.preventDefault();
                  const texto = e.clipboardData.getData('text');
                  const numeros = texto.replace(/\D/g, '');
                  
                  if (numeros.length > 0) {
                    // Formata os números colados
                    let formatado = '';
                    const numerosLimitados = numeros.slice(0, 8);
                    if (numerosLimitados.length <= 2) {
                      formatado = numerosLimitados;
                    } else if (numerosLimitados.length <= 4) {
                      formatado = `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2)}`;
                    } else {
                      formatado = `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2, 4)}/${numerosLimitados.slice(4, 8)}`;
                    }
                    onChange?.(formatado);
                  }
                }}
                placeholder="Digite a data de nascimento"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  boxSizing: 'border-box'
                }}
              />
            )}
            
            {/* Campo de telefone (formatado, mas salva sem formatação) */}
            {campo.tipo === 'telefone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Botão "Não tem" */}
                <button
                  type="button"
                  onClick={() => {
                    onNaoTemTelefone?.(!naoTemTelefone);
                    if (!naoTemTelefone) {
                      // Se marcar "Não tem", limpa o número
                      onChange?.('');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    backgroundColor: naoTemTelefone ? '#b3d9ff' : '#f3f4f6',
                    color: naoTemTelefone ? '#1a9bff' : '#6b7280',
                    border: naoTemTelefone ? '2px solid #1a9bff' : '1px solid #ddd',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                >
                  Não tem
                </button>
                
                {/* Input de telefone */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={(() => {
                    // Exibe formato 9 9918 4050 durante digitação
                    if (!valor || naoTemTelefone) return '';
                    const numeros = String(valor).replace(/\D/g, '');
                    if (numeros.length <= 1) return numeros;
                    if (numeros.length <= 5) return `${numeros.slice(0, 1)} ${numeros.slice(1)}`;
                    return `${numeros.slice(0, 1)} ${numeros.slice(1, 5)} ${numeros.slice(5, 11)}`;
                  })()}
                  onChange={(e) => {
                    // Remove tudo que não é número
                    const numeros = e.target.value.replace(/\D/g, '');
                    
                    // Salva apenas números (sem formatação) - máximo 11 dígitos
                    const numerosLimitados = numeros.slice(0, 11);
                    onChange?.(numerosLimitados);
                    
                    // Se digitou algo, desmarca "Não tem"
                    if (numerosLimitados.length > 0 && naoTemTelefone) {
                      onNaoTemTelefone?.(false);
                    }
                  }}
                  placeholder="Digite o número (ex: 9 9918 4050)"
                  maxLength={13} // 1 + espaço + 4 + espaço + 6 = 13 caracteres formatados
                  disabled={naoTemTelefone}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    opacity: naoTemTelefone ? 0.5 : 1,
                    backgroundColor: naoTemTelefone ? '#f3f4f6' : '#ffffff'
                  }}
                />
              </div>
            )}
            
            {/* Campo de opções (autorizacao_contato) - botões estilizados lado a lado */}
            {campo.opcoes && campo.opcoes.length > 0 && (
              <div style={{ 
                marginTop: '1.5rem', 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem' 
              }}>
                {campo.opcoes.map((opcao, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onChange?.(opcao)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      backgroundColor: valor === opcao ? '#b3d9ff' : '#e5e7eb', // Cor primária clara quando selecionado, cinza quando não
                      color: valor === opcao ? '#1a9bff' : '#6b7280', // Texto primário quando selecionado, cinza escuro quando não
                      border: valor === opcao ? '2px solid #1a9bff' : '2px solid #d1d5db', // Borda primária quando selecionado, cinza quando não
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      if (valor !== opcao) {
                        e.currentTarget.style.backgroundColor = '#d1d5db';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (valor !== opcao) {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mostrar opções se houver (radio, checkbox, select) - apenas para campos não pessoais */}
        {!isCampoPessoal && campo.opcoes && campo.opcoes.length > 0 && (
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
        disabled={!podeAvancar}
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
