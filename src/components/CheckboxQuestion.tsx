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
  const isCampoDataNascimento = campo.tipo === 'texto' && campo.id === 'faixa_etaria';
  const ocultarOpcoes = campo.id === 'tempo_moradia';
  const [diaNascimento, setDiaNascimento] = useState('');
  const [mesNascimento, setMesNascimento] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');
  
  // Sempre que a pergunta mudar, resetar o estado do checkbox
  // Garante que a próxima pergunta não venha marcada
  useEffect(() => {
    setPerguntei(false);
  }, [campo.id, numeroPergunta]);

  useEffect(() => {
    if (isCampoDataNascimento) {
      const partes = typeof valor === 'string'
        ? valor.split(/[^0-9]/).filter(Boolean)
        : [];
      setDiaNascimento(partes[0] || '');
      setMesNascimento(partes[1] || '');
      setAnoNascimento(partes[2] || '');
    } else {
      setDiaNascimento('');
      setMesNascimento('');
      setAnoNascimento('');
    }
  }, [isCampoDataNascimento, valor]);

  const atualizarDataNascimento = (dia: string, mes: string, ano: string) => {
    const partesOrdenadas = [dia, mes, ano];
    const preenchidas = partesOrdenadas.filter((parte) => parte && parte.trim() !== '');
    const texto = preenchidas.length > 0 ? preenchidas.join('/') : '';
    onChange?.(texto);
  };

  const handleDiaChange = (novoValor: string) => {
    const apenasNumeros = novoValor.replace(/\D/g, '').slice(0, 2);
    setDiaNascimento(apenasNumeros);
    atualizarDataNascimento(apenasNumeros, mesNascimento, anoNascimento);
  };

  const handleMesChange = (novoValor: string) => {
    const apenasNumeros = novoValor.replace(/\D/g, '').slice(0, 2);
    setMesNascimento(apenasNumeros);
    atualizarDataNascimento(diaNascimento, apenasNumeros, anoNascimento);
  };

  const handleAnoChange = (novoValor: string) => {
    const apenasNumeros = novoValor.replace(/\D/g, '').slice(0, 4);
    setAnoNascimento(apenasNumeros);
    atualizarDataNascimento(diaNascimento, mesNascimento, apenasNumeros);
  };
  
  // Para campos pessoais, o botão habilita quando checkbox está marcado E há valor (se necessário)
  // Para telefone, habilita se "Não tem" marcado OU número digitado
  // Para campos não pessoais, só precisa do checkbox
  const campoPessoalOpcionalSemValor = isCampoPessoal && campo.id === 'faixa_etaria';
  const podeAvancar = isCampoPessoal 
    ? perguntei && (
        campo.opcoes ? valor : 
        isCampoTelefone ? (naoTemTelefone || (valor && String(valor).trim() !== '')) :
        (campoPessoalOpcionalSemValor ? true : (valor && String(valor).trim() !== ''))
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.75rem'
              }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={diaNascimento}
                  onChange={(e) => handleDiaChange(e.target.value)}
                  placeholder="Dia"
                  maxLength={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={mesNascimento}
                  onChange={(e) => handleMesChange(e.target.value)}
                  placeholder="Mês"
                  maxLength={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={anoNascimento}
                  onChange={(e) => handleAnoChange(e.target.value)}
                  placeholder="Ano"
                  maxLength={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                  }}
                />
              </div>
            )}
            
            {/* Campo de telefone (formatado como (38) 9 9999-9999, mas salva sem formatação) */}
            {campo.tipo === 'telefone' && (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', alignItems: 'stretch' }}>
                {/* Input de telefone (80% da largura) */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={(() => {
                    // Exibe formato (38) 9 9999-9999 durante digitação
                    if (naoTemTelefone) return '';
                    if (!valor) return '(38) '; // Pré-preenche com DDD 38
                    
                    const numeros = String(valor).replace(/\D/g, '');
                    
                    // Se não tem DDD ainda, adiciona 38
                    if (numeros.length === 0) return '(38) ';
                    
                    // Garante que tem pelo menos 2 dígitos (DDD)
                    let ddd = numeros.slice(0, 2);
                    if (ddd.length < 2) {
                      // Se tem menos de 2 dígitos, completa com 38
                      ddd = ddd.length === 0 ? '38' : ddd + '38'.slice(ddd.length);
                    }
                    
                    const numero = numeros.slice(2);
                    
                    // Formata: (XX) X XXXX-XXXX
                    if (numero.length === 0) {
                      return `(${ddd}) `;
                    } else if (numero.length <= 1) {
                      return `(${ddd}) ${numero}`;
                    } else if (numero.length <= 5) {
                      return `(${ddd}) ${numero.slice(0, 1)} ${numero.slice(1)}`;
                    } else {
                      return `(${ddd}) ${numero.slice(0, 1)} ${numero.slice(1, 5)}-${numero.slice(5, 9)}`;
                    }
                  })()}
                  onChange={(e) => {
                    // Remove tudo que não é número
                    let numeros = e.target.value.replace(/\D/g, '');
                    
                    // Se está vazio ou só tem menos de 2 dígitos, pré-preenche com 38
                    if (numeros.length === 0) {
                      numeros = '38';
                    } else if (numeros.length < 2) {
                      // Se tem 1 dígito, completa com 38
                      numeros = '38' + numeros;
                    }
                    
                    // Limita a 11 dígitos (2 DDD + 9 número)
                    const numerosLimitados = numeros.slice(0, 11);
                    
                    // Salva apenas números (sem formatação)
                    onChange?.(numerosLimitados);
                    
                    // Se digitou algo, desmarca "Não tem"
                    if (numerosLimitados.length > 0 && naoTemTelefone) {
                      onNaoTemTelefone?.(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Bloqueia qualquer tecla que não seja número ou teclas de controle
                    const tecla = e.key;
                    const teclasPermitidas = [
                      'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                      'Home', 'End', 'Shift', 'Control', 'Alt', 'Meta'
                    ];
                    
                    // Permite teclas de controle
                    if (teclasPermitidas.includes(tecla) || e.ctrlKey || e.metaKey) {
                      return;
                    }
                    
                    // Permite apenas números (0-9)
                    if (!/^[0-9]$/.test(tecla)) {
                      e.preventDefault();
                      return false;
                    }
                  }}
                  onPaste={(e) => {
                    // Bloqueia colar e remove caracteres não numéricos
                    e.preventDefault();
                    const texto = e.clipboardData.getData('text');
                    let numeros = texto.replace(/\D/g, '');
                    
                    // Se está vazio, pré-preenche com 38
                    if (numeros.length === 0) {
                      numeros = '38';
                    } else if (numeros.length < 2) {
                      numeros = '38' + numeros;
                    }
                    
                    const numerosLimitados = numeros.slice(0, 11);
                    onChange?.(numerosLimitados);
                  }}
                  placeholder="(38) 9 9999-9999"
                  maxLength={16} // (XX) X XXXX-XXXX = 16 caracteres formatados
                  disabled={naoTemTelefone}
                  style={{
                    flex: '0 0 80%',
                    width: '80%',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxSizing: 'border-box',
                    opacity: naoTemTelefone ? 0.5 : 1,
                    backgroundColor: naoTemTelefone ? '#f3f4f6' : '#ffffff'
                  }}
                />
                
                {/* Botão "Não tem" (20% da largura) */}
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
                    flex: '0 0 20%',
                    width: '20%',
                    padding: '0.75rem 0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    backgroundColor: naoTemTelefone ? '#b3d9ff' : '#f3f4f6',
                    color: naoTemTelefone ? '#1a9bff' : '#6b7280',
                    border: naoTemTelefone ? '2px solid #1a9bff' : '1px solid #ddd',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Não tem
                </button>
              </div>
            )}
            
            {/* Campo de opções (autorizacao_contato) - botões estilizados lado a lado */}
            {campo.opcoes && campo.opcoes.length > 0 && !ocultarOpcoes && (
              <div style={{ 
                marginTop: '1.5rem', 
                display: 'grid', 
                gridTemplateColumns: campo.opcoes.length === 3 ? 'repeat(3, 1fr)' : '1fr 1fr',
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
        {!isCampoPessoal && campo.opcoes && campo.opcoes.length > 0 && !ocultarOpcoes && (
          <div className="question-options">
            <ul className="options-list" style={{ 
              display: 'grid', 
              gridTemplateColumns: campo.opcoes.length === 2 ? 'repeat(2, 1fr)' : campo.opcoes.length === 3 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', 
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
