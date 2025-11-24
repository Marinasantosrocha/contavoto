import { CampoFormulario } from '../db/localDB';

interface FormularioStepProps {
  campo: CampoFormulario;
  valor: any;
  onChange: (valor: any) => void;
  preCandidato: string;
}

export const FormularioStep = ({ campo, valor, onChange, preCandidato }: FormularioStepProps) => {
  // Substitui placeholders no label
  const label = campo.label.replace(/____________/g, preCandidato);

  // Campos de seção (apenas título, não editável)
  if (campo.tipo === 'textarea' && campo.id.startsWith('secao_')) {
    return (
      <div className="secao-header">
        <h2>{label}</h2>
      </div>
    );
  }

  return (
    <div className="form-field">
      <label>
        {label}
        {campo.obrigatorio && <span className="obrigatorio"> *</span>}
      </label>

      {campo.tipo === 'texto' && (
        <input
          type="text"
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="input-text"
        />
      )}

      {campo.tipo === 'numero' && (
        <input
          type="number"
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="input-text"
        />
      )}

      {campo.tipo === 'telefone' && (
        <input
          type="tel"
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(XX) XXXXX-XXXX"
          required={campo.obrigatorio}
          className="input-text"
        />
      )}

      {campo.tipo === 'textarea' && (
        <textarea
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          rows={4}
          className="input-textarea"
        />
      )}

      {campo.tipo === 'radio' && campo.opcoes && (
        <div className="radio-group">
          {campo.opcoes.map((opcao) => (
            <label key={opcao} className="radio-label">
              <input
                type="radio"
                name={campo.id}
                value={opcao}
                checked={valor === opcao}
                onChange={(e) => onChange(e.target.value)}
                required={campo.obrigatorio}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      )}

      {campo.tipo === 'select' && campo.opcoes && (
        <select
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          required={campo.obrigatorio}
          className="input-select"
        >
          <option value="">Selecione...</option>
          {campo.opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      )}

      {campo.tipo === 'checkbox' && campo.opcoes && (
        <div className="checkbox-group">
          {campo.opcoes.map((opcao) => (
            <label key={opcao} className="checkbox-label">
              <input
                type="checkbox"
                value={opcao}
                checked={Array.isArray(valor) && valor.includes(opcao)}
                onChange={(e) => {
                  const currentValues = Array.isArray(valor) ? valor : [];
                  if (e.target.checked) {
                    onChange([...currentValues, opcao]);
                  } else {
                    onChange(currentValues.filter((v: string) => v !== opcao));
                  }
                }}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};









