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
  
  // Aceite de participação
  aceite_participacao?: boolean; // true = aceitou, false = recusou, undefined = não perguntado
  motivo_recusa?: string; // Preenchido quando aceite_participacao = false
  
  // Respostas
  respostas: { [key: string]: any };
  
  // Áudio da pesquisa completa
  audioBlob?: Blob; // Blob do áudio (salvo localmente antes de sincronizar)
  audio_url?: string; // URL do áudio no Supabase Storage (após sincronização)
  audio_duracao?: number; // Duração em segundos
  
  // Transcrição (feita pelo Web Speech API - local)
  transcricao_completa?: string; // Texto completo da conversa
  transcricao_confianca?: number; // Confiança média da transcrição (0-100)
  
  // Perguntas que foram marcadas como feitas
  perguntas_feitas?: { [campo_id: string]: boolean };
  
  // Processamento com IA (após sincronização)
  processamento_ia_status?: 'pendente' | 'processando' | 'concluido' | 'erro';
  processamento_ia_confianca?: { [campo_id: string]: number };
  processamento_ia_erro?: string;
  
  // Sincronização
  sincronizacao_tentativas?: number;
  sincronizacao_erro?: string;
  
  // Metadata
  latitude?: number;
  longitude?: number;
  accuracy?: number; // Precisão da geolocalização em metros
  entrevistador: string;
  usuario_id?: number; // ID do usuário/pesquisador que criou a pesquisa
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

