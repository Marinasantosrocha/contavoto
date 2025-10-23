export type RfbFieldType = 'ordinal' | 'scale3' | 'binary' | 'multi';

export interface RfbFieldConfig {
  key: string;
  label: string;
  type: RfbFieldType;
  order?: string[]; // ordem preferencial das opções
}

export const RFB_FIELDS: RfbFieldConfig[] = [
  { key: 'faixa_etaria', label: 'Faixa Etária', type: 'ordinal', order: [
    '16 ou menos anos', 'De 17 a 24 anos', 'De 25 a 34 anos', 'De 35 a 45 anos', 'De 46 a 54 anos', '55 ou mais anos'
  ]},
  { key: 'tempo_moradia', label: 'Tempo de Moradia', type: 'ordinal' },

  // Infraestrutura
  { key: 'pavimentacao', label: 'Pavimentação', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },
  { key: 'estradas', label: 'Estradas', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },
  { key: 'limpeza_urbana', label: 'Limpeza Urbana', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },
  { key: 'iluminacao_publica', label: 'Iluminação Pública', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },

  // Saúde
  { key: 'atendimento_saude', label: 'Atendimento na Saúde', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },
  { key: 'acesso_saude', label: 'Acesso à Saúde', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },

  // Educação
  { key: 'educacao', label: 'Educação', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },

  // Segurança
  { key: 'seguranca_publica', label: 'Segurança Pública', type: 'scale3', order: ['Piorou', 'Está Igual', 'Melhorou', 'Não sei'] },

  // Outros temas
  { key: 'problema_cidade', label: 'Principal Problema na Cidade', type: 'multi' },
  { key: 'area_avanco', label: 'Área que mais Avançou', type: 'multi' },
  { key: 'voz_em_brasilia', label: 'Representante com Voz em Brasília?' , type: 'binary', order: ['Sim', 'Não']},
  { key: 'melhoria_com_representante', label: 'Melhoria com Representante?' , type: 'binary', order: ['Sim', 'Não']},
  { key: 'prioridade_deputado', label: 'Prioridade do Deputado', type: 'multi' },
  { key: 'autorizacao_contato', label: 'Autorizou Contato?', type: 'binary', order: ['Sim', 'Não'] },
  { key: 'whatsapp', label: 'WhatsApp', type: 'binary', order: ['Sim', 'Não'] },
];

export function getFieldLabel(key: string) {
  const found = RFB_FIELDS.find(f => f.key === key);
  return found?.label || key;
}

export function orderEntries(entries: Array<[string, number]>, fieldKey: string) {
  const cfg = RFB_FIELDS.find(f => f.key === fieldKey);
  if (!cfg?.order || cfg.order.length === 0) {
    // Sem ordem preferencial: desc por valor
    return [...entries].sort((a,b) => b[1] - a[1]);
  }
  const idx = (name: string) => {
    const i = cfg.order!.indexOf(name);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...entries].sort((a,b) => idx(a[0]) - idx(b[0]) || b[1] - a[1]);
}
