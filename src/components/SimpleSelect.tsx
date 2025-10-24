import './SimpleSelect.css';

interface Option {
  value: string | number;
  label: string;
}

interface SimpleSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
}

export const SimpleSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Selecione...',
  label 
}: SimpleSelectProps) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue === '' ? null : newValue);
  };

  return (
    <div className="simple-select-group">
      {label && <label className="simple-select-label">{label}</label>}
      <select 
        className="simple-select"
        value={value ?? ''}
        onChange={handleChange}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
