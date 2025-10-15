import Dexie, { Table } from 'dexie';

// Interface para Formulário
export interface Formulario {
  id?: number;
  uuid?: string;
  nome: string;
  descricao: string;
  preCandidato: string;
  telefoneContato: string;
  campos: CampoFormulario[];
  criadoEm: Date;
  sincronizado: boolean;
}

// Interface para Campo do Formulário
export interface CampoFormulario {
  id: string;
  tipo: 'texto' | 'numero' | 'telefone' | 'radio' | 'checkbox' | 'select' | 'textarea';
  label: string;
  obrigatorio: boolean;
  opcoes?: string[]; // Para radio, checkbox, select
  condicao?: {
    campoDependente: string;
    valorRequerido: string;
  };
}

// Interface para Pesquisa Realizada
export interface Pesquisa {
  id?: number;
  uuid?: string;
  formularioId: number;
  formularioUuid?: string;
  formularioNome: string;
  
  // Dados de localização
  endereco: string;
  bairro: string;
  cidade: string;
  numeroResidencia?: string;
  pontoReferencia?: string;
  
  // Dados do entrevistado
  nomeEntrevistado?: string;
  telefoneEntrevistado?: string;
  
  // Respostas
  respostas: { [key: string]: any };
  
  // Metadata
  latitude?: number;
  longitude?: number;
  accuracy?: number; // Precisão da geolocalização em metros
  entrevistador: string;
  iniciadaEm: Date;
  finalizadaEm?: Date;
  status: 'em_andamento' | 'finalizada' | 'cancelada';
  
  sincronizado: boolean;
  deletado?: boolean;
}

// Classe do banco de dados local usando Dexie (wrapper do IndexedDB)
export class LocalDatabase extends Dexie {
  formularios!: Table<Formulario>;
  pesquisas!: Table<Pesquisa>;

  constructor() {
    super('PortaAPortaDB');
    
    this.version(1).stores({
      formularios: '++id, uuid, sincronizado',
      pesquisas: '++id, uuid, formularioId, status, sincronizado, deletado'
    });
  }
}

export const db = new LocalDatabase();

