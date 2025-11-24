import { supabase } from './supabaseClient';

export type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'todos';

export interface RfbFilters {
  periodo?: PeriodoFiltro;
  pesquisadorId?: number | null;
  pesquisadorNome?: string | null; // Adicionar filtro por nome
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

// Colunas categóricas da RFB que iremos agregar inicialmente.
// IMPORTANTE: precisa incluir todos os campos usados em RFB_FIELDS.
const COLUMNS: string[] = [
  // Campos principais de percepção (escala 3 pontos)
  'pavimentacao',
  'estradas',
  'limpeza_urbana',
  'iluminacao_publica',
  'atendimento_saude',
  'acesso_saude',
  'educacao',
  'seguranca_publica',

  // Temas abertos / múltipla escolha
  'problema_cidade',
  'area_avanco',
  'prioridade_deputado',

  // Campos adicionais que podem ser usados depois
  'tempo_moradia',
  'whatsapp',
  'conhece_deputado_federal',
  'deputado_renda_municipal',
  'importancia_deputado',
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

// Campos que devem ser normalizados para "Sim" / "Não"
const BINARY_COLUMNS = new Set([
  'conhece_deputado_federal',
  'deputado_renda_municipal',
  // whatsapp e outros campos binários simples podem ser adicionados aqui depois
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
  console.log('🔍 [RFB Analytics] Iniciando busca com filtros (via RPC):', filters);

  try {
    // 1) Busca TODAS as respostas elegíveis via função RPC (já filtradas por aceite/status no banco)
    const startRpc = Date.now();
    const { data, error } = await supabase.rpc('buscar_todas_respostas_dashboard');
    const elapsedRpc = Date.now() - startRpc;
    console.log(`⏱️ [RFB Analytics] RPC buscar_todas_respostas_dashboard levou ${elapsedRpc}ms. Registros retornados: ${data?.length ?? 0}`);

    if (error) {
      console.error('❌ [RFB Analytics] Erro ao executar RPC buscar_todas_respostas_dashboard:', error);
      return { total: 0, distribuicoes: Object.fromEntries(COLUMNS.map(c => [c, {}])) };
    }

    let rows = (data || []) as any[];

    // 2) Aplica os MESMOS filtros do dashboard no front‑end
    const bounds = getPeriodoBounds(filters.periodo);
    if (bounds.gte) {
      const minDate = new Date(bounds.gte);
      rows = rows.filter((r) => {
        const d = r.iniciada_em ? new Date(r.iniciada_em) : null;
        return d && d >= minDate;
      });
    }

    if (filters.cidade) {
      const alvo = filters.cidade.toLowerCase();
      rows = rows.filter((r) => (r.cidade || '').toLowerCase().includes(alvo));
    }

    if (filters.pesquisadorNome) {
      rows = rows.filter((r) => r.entrevistador === filters.pesquisadorNome);
    }

    // (Opcional) Se algum dia usarmos formularioUuid para múltiplos formulários, filtrar aqui.

    // Filtros de drill‑down por opção (pavimentação, educação, etc.)
    if (filters.categorySelections) {
      for (const [col, val] of Object.entries(filters.categorySelections)) {
        if (!val) continue;
        rows = rows.filter((r) => r[col] === val);
      }
    }

    console.log('📊 [RFB Analytics] Total de respostas após filtros do dashboard:', rows.length);

    if (!rows || rows.length === 0) {
      console.warn('⚠️ [RFB Analytics] Nenhuma resposta encontrada após aplicar filtros do dashboard');
      return { total: 0, distribuicoes: Object.fromEntries(COLUMNS.map(c => [c, {}])) };
    }

    const result = aggregateRows(rows);
    console.log('📈 [RFB Analytics] Agregação concluída:', result);
    return result;
  } catch (e: any) {
    console.error('❌ [RFB Analytics] Erro geral ao buscar agregações da RFB (RPC):', e);
    return { total: 0, distribuicoes: Object.fromEntries(COLUMNS.map(c => [c, {}])) };
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
    'pesquisas!inner(id, iniciada_em, usuario_id, formulario_id, cidade, bairro, status, aceite_participacao)'
  ].join(',');

  const bounds = getPeriodoBounds(filters.periodo);

  try {
    let query = supabase.from('respostas_formulario_buritizeiro').select(select).neq('pesquisas.status', 'cancelada').eq('pesquisas.aceite_participacao', 'true');
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
    let q = supabase.from('pesquisas').select('id, iniciada_em').neq('status', 'cancelada').eq('aceite_participacao', 'true');
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
    // Está Igual  (unifica "está igual", "estão iguais", "igual", "iguais", "mesmo", etc.)
    if (
      /(est(a|á|ao|ão)\s+iguais?|igual|iguais|mesmo)/i.test(v) ||
      /est(a|ao|ao)\s+iguais?|igual|iguais|mesmo/.test(simple)
    ) {
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
    // Mantém "Não sei" separado quando aparecer em campos binários
    if (/(nao sei|não sei)/i.test(v) || /nao sei/.test(simple)) {
      return 'Não sei';
    }

    // Qualquer resposta que contenha "não" / "nao" (ex.: "Não", "Não conheço",
    // "Não, não conheço nenhum", "Não conheço nenhum", "Não sabia" etc.)
    // é agrupada como "Não".
    if (/\b(nao|não)\b/i.test(v) || /\bnao\b/.test(simple)) {
      return 'Não';
    }

    // Normaliza qualquer resposta afirmativa para "Sim".
    // Exemplos: "Sim", "sim, sabia", "Sim, Sabia", "Sabia", "Já sabia", etc.
    if (
      /^(sim|s|yes|y|true|1)$/i.test(simple) || // respostas curtas
      /\bsim\b/i.test(v) ||                    // contém a palavra "sim"
      /\bsabia\b/i.test(v) ||                  // "sabia" (sem "não")
      /\bconhe(c|ç)o\b/i.test(v)               // "conheço", "conheco"
    ) {
      return 'Sim';
    }

    // Fallback: retorna o valor original aparado
    return v;
  }

  // Demais campos mantêm valor original aparado
  return v;
}
