import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';

type Dist = Record<string, number>;

export interface StackedRow {
  key: string; // field key
  label: string; // display label for the field
  dist: Dist; // option -> count
  order?: string[]; // preferred order of options
}

interface Stacked100BarListProps {
  rows: StackedRow[];
  height?: number; // per row
  onSegmentClick?: (fieldKey: string, option: string) => void;
}

const COLORS: Record<string, string> = {
  'Piorou': '#FF7B7B', // vermelho claro
  'Está Igual': '#64748B', // cinza escuro
  'Melhorou': '#1a9bff', // primária
  'Não sei': '#CBD5E1', // cinza claro
  'Sim': '#1a9bff',
  'Não': '#FF7B7B',
  'Sim, autorizo': '#1a9bff', // azul para autorização
  'Não autorizo': '#FF7B7B', // vermelho para não autorização
  // Importância do Deputado
  'Muito importante': '#1a9bff', // azul padrão
  'Importante': '#64748B',       // cinza
  'Pouco importante': '#FF7B7B', // vermelho
};

export function Stacked100BarList({ rows, height = 52, onSegmentClick }: Stacked100BarListProps) {
  // Constrói data para cada linha: [{ name: label, 'Melhorou': pct, 'Está Igual': pct, 'Piorou': pct }]
  const buildData = (row: StackedRow) => {
    const entries = Object.entries(row.dist);
    const total = entries.reduce((a, [,v]) => a + v, 0) || 1;
    // Ordena SEMPRE pelo maior valor primeiro, independente da ordem preferencial,
    // para que em cada linha o segmento com maior percentual venha primeiro.
    const keys = entries
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const obj: any = { name: row.label };
    keys.forEach(k => obj[k] = Math.round((row.dist[k] || 0) * 1000 / total) / 10);
    return { data: [obj], keys };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => {
        const { data, keys } = buildData(row);
        return (
          <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px', alignItems: 'center', gap: 12 }}>
            <div style={{ color: '#343A40', fontWeight: 600, fontSize: 14 }}>{row.label}</div>
            <div style={{ width: '100%', height }}>
              <ResponsiveContainer>
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip
                    formatter={(v: any, n: any) => [`${v}%`, n]}
                    wrapperStyle={{ zIndex: 2000 }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 20px rgba(15,23,42,0.15)',
                      padding: '8px 10px',
                      fontSize: 12,
                      color: '#111827',
                    }}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  />
                  {keys.map((k, idx) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="a"
                      fill={COLORS[k] || '#242c30'}
                      radius={idx === keys.length - 1 ? [0, 8, 8, 0] : idx === 0 ? [8, 0, 0, 8] : 0}
                      isAnimationActive
                      onClick={() => onSegmentClick?.(row.key, k)}
                    >
                      {/* Percentual dentro do segmento */}
                      <LabelList dataKey={k} position="insideRight" formatter={(v: any) => (v && v > 0 ? `${v}%` : '')} style={{ fill: '#fff', fontSize: 12 }} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ justifySelf: 'end', color: '#6C757D', fontSize: 12 }}>
              {Object.values(row.dist).reduce((a, v) => a + v, 0)} resp.
            </div>
          </div>
        );
      })}
    </div>
  );
}
