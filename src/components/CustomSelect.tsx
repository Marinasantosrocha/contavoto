import { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
}

export const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Selecione...',
  label 
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string | number | null) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="custom-select-wrapper">
        <div className="custom-select" ref={selectRef}>
          <div 
            className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            style={{
              backgroundColor: '#ffffff',
              background: '#ffffff'
            }}
          >
            <span className={selectedOption ? '' : 'placeholder'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <svg 
              className={`custom-select-arrow ${isOpen ? 'open' : ''}`}
              width="12" 
              height="12" 
              viewBox="0 0 12 12"
            >
              <path fill="currentColor" d="M6 9L1 4h10z"/>
            </svg>
          </div>

          {isOpen && (
            <div 
              className="custom-select-dropdown"
              style={{
                backgroundColor: '#ffffff',
                background: '#ffffff',
                opacity: 1
              }}
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`custom-select-option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                  style={{
                    backgroundColor: value === option.value ? '#20B2AA' : '#ffffff',
                    background: value === option.value ? '#20B2AA' : '#ffffff',
                    color: value === option.value ? 'white' : '#343A40',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = '#f0fffe';
                      e.currentTarget.style.background = '#f0fffe';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.background = '#ffffff';
                    }
                  }}
                >
                  <span style={{ color: 'inherit', opacity: 1 }}>{option.label}</span>
                  {value === option.value && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
