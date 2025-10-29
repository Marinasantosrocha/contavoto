import { supabase } from './supabaseClient';

export type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';

export interface RfbFilters {
  periodo?: PeriodoFiltro;
  pesquisadorId?: number | null;
  formularioUuid?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  categorySelections?: Record<string, string | null>; // ex.: { pavimentacao: 'Melhorou' }
}

export type Distribuicao = Record<string, number>;

export interface RfbAggregations {
  total: number;
  distribuicoes: Record<string, Distribuicao>;
}

export type TimeBucket = 'day' | 'week' | 'month';

export interface TimeseriesPoint {
  date: string; // ISO yyyy-mm-dd (bucket representativo)
  total: number;
  dist: Record<string, number>; // opção -> contagem
}

// Colunas categóricas da rfb que iremos agregar inicialmente
const COLUMNS: string[] = [
  'faixa_etaria',
  'tempo_moradia',
  'pavimentacao',
  'estradas',
  'limpeza_urbana',
  'iluminacao_publica',
  'atendimento_saude',
  'acesso_saude',
  'educacao',
  'seguranca_publica',
  'problema_cidade',
  'area_avanco',
  'voz_em_brasilia',
  'melhoria_com_representante',
  'prioridade_deputado',
  'autorizacao_contato',
];

// Colunas por tipo para normalização de opções
const SCALE3_COLUMNS = new Set([
  'pavimentacao',
  'estradas',
  'limpeza_urbana',
  'iluminacao_publica',
  'atendimento_saude',
  'acesso_saude',
  'educacao',
  'seguranca_publica',
]);

const BINARY_COLUMNS = new Set([
  'voz_em_brasilia',
  'melhoria_com_representante',
  'autorizacao_contato',
]);

function getPeriodoBounds(periodo?: PeriodoFiltro): { gte?: string } {
  if (!periodo || periodo === 'todos') return {};
  const hoje = new Date();
  let start = new Date(hoje);
  if (periodo === 'hoje') {
    start.setHours(0, 0, 0, 0);
  } else if (periodo === 'semana') {
    start.setDate(hoje.getDate() - 7);
  } else if (periodo === 'mes') {
    start.setMonth(hoje.getMonth() - 1);
  }
  return { gte: start.toISOString() };
}

export async function fetchRfbAggregations(filters: RfbFilters): Promise<RfbAggregations> {
  // Monta SELECT com join para aplicar filtros por atributos de pesquisas
  const select = [
    'id',
    ...COLUMNS,
    // Usa join INNER explícito para poder filtrar campos da tabela embutida
    'pesquisas!inner(id, usuario_id, entrevistador, formulario_id, formulario_nome, bairro, cidade, iniciada_em, finalizada_em, status)'
  ].join(',');

  try {
    let query = supabase
      .from('respostas_formulario_buritizeiro')
      .select(select);

    // Sempre filtra por pesquisas.status != cancelada
    query = query.neq('pesquisas.status', 'cancelada');

    // Período por iniciada_em (mantém alinhado ao restante do dashboard)
    const bounds = getPeriodoBounds(filters.periodo);
    if (bounds.gte) {
      query = query.gte('pesquisas.iniciada_em', bounds.gte);
    }

    if (filters.pesquisadorId) {
      query = query.eq('pesquisas.usuario_id', filters.pesquisadorId);
    }

    if (filters.formularioUuid) {
      query = query.eq('pesquisas.formulario_id', filters.formularioUuid);
    }

    if (filters.cidade) {
      // ilike com curinga para busca parcial
      query = query.ilike('pesquisas.cidade', `%${filters.cidade}%`);
    }

    if (filters.bairro) {
      query = query.ilike('pesquisas.bairro', `%${filters.bairro}%`);
    }

    // Filtros por opção (drill-down): aplicados diretamente nas colunas da RFB
    if (filters.categorySelections) {
      for (const [col, val] of Object.entries(filters.categorySelections)) {
        if (val) {
          query = query.eq(col, val);
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return aggregateRows(data || []);
  } catch (e: any) {
    // Fallback robusto: consulta IDs em pesquisas com os filtros e depois aplica IN em pesquisa_id
    const bounds = getPeriodoBounds(filters.periodo);
    let q = supabase.from('pesquisas').select('id').neq('status', 'cancelada');
    if (bounds.gte) q = q.gte('iniciada_em', bounds.gte);
    if (filters.pesquisadorId) q = q.eq('usuario_id', filters.pesquisadorId);
    if (filters.formularioUuid) q = q.eq('formulario_id', filters.formularioUuid);
    if (filters.cidade) q = q.ilike('cidade', `%${filters.cidade}%`);
    if (filters.bairro) q = q.ilike('bairro', `%${filters.bairro}%`);
    const { data: idsData, error: idsErr } = await q;
    if (idsErr) throw idsErr;
    const ids = (idsData || []).map((r: any) => r.id);
    if (ids.length === 0) return { total: 0, distribuicoes: Object.fromEntries(COLUMNS.map(c => [c, {}])) };

    let r = supabase.from('respostas_formulario_buritizeiro').select(['id', ...COLUMNS].join(',')).in('pesquisa_id', ids);
    if (filters.categorySelections) {
      for (const [col, val] of Object.entries(filters.categorySelections)) {
        if (val) r = r.eq(col, val);
      }
    }
    const { data: rfbData, error: rfbErr } = await r;
    if (rfbErr) throw rfbErr;
    return aggregateRows(rfbData || []);
  }
}

function aggregateRows(rowsIn: any[]): RfbAggregations {
  const distribuicoes: Record<string, Distribuicao> = {};
  COLUMNS.forEach(c => { distribuicoes[c] = {}; });
  const rows = rowsIn as any[];
  for (const row of rows) {
    for (const col of COLUMNS) {
      const raw = row[col];
      if (!raw || typeof raw !== 'string') continue;
      const val = normalizeOptionForColumn(col, raw);
      if (!val) continue;
      distribuicoes[col][val] = (distribuicoes[col][val] || 0) + 1;
    }
  }
  return { total: rows.length, distribuicoes };
}

function floorDateToBucket(dateISO: string, bucket: TimeBucket): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO?.slice(0, 10) || '';
  if (bucket === 'day') {
    return d.toISOString().slice(0, 10);
  }
  if (bucket === 'week') {
    // Normaliza para segunda-feira da semana (ISO week simplificada)
    const day = d.getUTCDay(); // 0=domingo..6=sábado
    const diff = (day === 0 ? -6 : 1) - day; // ir para segunda
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
    return monday.toISOString().slice(0, 10);
  }
  // month
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return monthStart.toISOString().slice(0, 10);
}

export async function fetchRfbTimeseries(params: RfbFilters & { fieldKey: string; bucket?: TimeBucket }): Promise<TimeseriesPoint[]> {
  const { fieldKey, bucket = 'day', ...filters } = params;
  const select = [
    'id',
    fieldKey,
    'pesquisas!inner(id, iniciada_em, usuario_id, formulario_id, cidade, bairro, status)'
  ].join(',');

  const bounds = getPeriodoBounds(filters.periodo);

  try {
    let query = supabase.from('respostas_formulario_buritizeiro').select(select).neq('pesquisas.status', 'cancelada');
    if (bounds.gte) query = query.gte('pesquisas.iniciada_em', bounds.gte);
    if (filters.pesquisadorId) query = query.eq('pesquisas.usuario_id', filters.pesquisadorId);
    if (filters.formularioUuid) query = query.eq('pesquisas.formulario_id', filters.formularioUuid);
    if (filters.cidade) query = query.ilike('pesquisas.cidade', `%${filters.cidade}%`);
    if (filters.bairro) query = query.ilike('pesquisas.bairro', `%${filters.bairro}%`);
    if (filters.categorySelections) {
      for (const [col, val] of Object.entries(filters.categorySelections)) {
        if (val) query = query.eq(col, val);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return aggregateTimeseries(data || [], fieldKey, bucket);
  } catch (e: any) {
    // Fallback: busca pesquisas com iniciada_em e depois rfb por pesquisa_id
    let q = supabase.from('pesquisas').select('id, iniciada_em').neq('status', 'cancelada');
    if (bounds.gte) q = q.gte('iniciada_em', bounds.gte);
    if ((filters as any).pesquisadorId) q = q.eq('usuario_id', (filters as any).pesquisadorId);
    if ((filters as any).formularioUuid) q = q.eq('formulario_id', (filters as any).formularioUuid);
    if ((filters as any).cidade) q = q.ilike('cidade', `%${(filters as any).cidade}%`);
    if ((filters as any).bairro) q = q.ilike('bairro', `%${(filters as any).bairro}%`);
    const { data: pesq, error: e1 } = await q;
    if (e1) throw e1;
    const byId: Record<string, string> = {};
    const ids = (pesq || []).map((r: any) => {
      byId[r.id] = r.iniciada_em;
      return r.id;
    });
    if (ids.length === 0) return [];

    let r = supabase.from('respostas_formulario_buritizeiro').select(['id', fieldKey, 'pesquisa_id'].join(',')).in('pesquisa_id', ids);
    if (filters.categorySelections) {
      for (const [col, val] of Object.entries(filters.categorySelections)) {
        if (val) r = r.eq(col, val);
      }
    }
    const { data: rfbRows, error: e2 } = await r;
    if (e2) throw e2;
    const rows = (rfbRows || []).map((row: any) => ({ ...row, pesquisas: { iniciada_em: byId[row.pesquisa_id] } }));
    return aggregateTimeseries(rows, fieldKey, bucket);
  }
}

function aggregateTimeseries(rows: any[], fieldKey: string, bucket: TimeBucket): TimeseriesPoint[] {
  const map: Record<string, { total: number; dist: Record<string, number> }> = {};
  for (const row of rows) {
    const started = row?.pesquisas?.iniciada_em as string | undefined;
    const opt = normalizeOptionForColumn(fieldKey, (row?.[fieldKey] as string | undefined) || '');
    if (!started || !opt) continue;
    const key = floorDateToBucket(started, bucket);
    if (!map[key]) map[key] = { total: 0, dist: {} };
    map[key].total += 1;
    map[key].dist[opt] = (map[key].dist[opt] || 0) + 1;
  }
  const dates = Object.keys(map).sort();
  return dates.map(d => ({ date: d, total: map[d].total, dist: map[d].dist }));
}

// Utilidades de normalização
function stripAccents(s: string) {
  try {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return s;
  }
}

function normalizeOptionForColumn(column: string, raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '';
  const simple = stripAccents(v).toLowerCase();

  if (SCALE3_COLUMNS.has(column)) {
    // Não sei
    if (/(nao sei|nao sabe|não sei|não sabe)/i.test(v) || /nao sei|nao sabe/.test(simple)) {
      return 'Não sei';
    }
    // Está Igual
    if (/(esta igual|está igual|igual|mesmo)/i.test(v) || /esta igual|igual|mesmo/.test(simple)) {
      return 'Está Igual';
    }
    // Melhorou
    if (/(melhor|melhorou|bom|boa|melhoria)/i.test(v) || /melhor|bom|boa/.test(simple)) {
      return 'Melhorou';
    }
    // Piorou
    if (/(pior|piorou|ruim|pessimo|péssimo)/i.test(v) || /pior|ruim|pessimo/.test(simple)) {
      return 'Piorou';
    }
    // Caso não bata, retorna capitalizado para não perder o dado
    return v;
  }

  if (BINARY_COLUMNS.has(column)) {
    // autorizacao_contato tem respostas específicas: "Sim, autorizo" ou "Não autorizo"
    if (column === 'autorizacao_contato') {
      if (/sim/i.test(v)) return 'Sim';
      if (/n[ãa]o/i.test(v)) return 'Não';
    }
    
    // Normalização genérica para outros campos binários
    if (/^(sim|s|yes|y|true|1)$/i.test(simple)) return 'Sim';
    if (/^(nao|não|n|no|false|0)$/i.test(simple)) return 'Não';
    return v;
  }

  // Demais campos mantêm valor original aparado
  return v;
}
