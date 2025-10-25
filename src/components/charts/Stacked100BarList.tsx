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
};

export function Stacked100BarList({ rows, height = 52, onSegmentClick }: Stacked100BarListProps) {
  // Constrói data para cada linha: [{ name: label, 'Melhorou': pct, 'Está Igual': pct, 'Piorou': pct }]
  const buildData = (row: StackedRow) => {
    const entries = Object.entries(row.dist);
    const total = entries.reduce((a, [,v]) => a + v, 0) || 1;
    const keys = row.order && row.order.length > 0
      ? row.order
      : entries.sort((a,b) => b[1] - a[1]).map(([k]) => k);
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
                  <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
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
