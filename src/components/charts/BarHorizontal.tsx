import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface BarItem {
  name: string;
  value: number;
}

interface BarHorizontalProps {
  data: BarItem[];
  height?: number;
  color?: string;
  maxBars?: number;
  normalizePercent?: boolean; // se true, assume que value é contagem e converte para % sobre o total
}

export function BarHorizontal({ data, height = 280, color = '#20B2AA', maxBars = 8, normalizePercent = true }: BarHorizontalProps) {
  const total = data.reduce((a, v) => a + v.value, 0) || 1;
  const normalized = normalizePercent ? data.map(d => ({ name: d.name, value: Math.round(d.value * 1000 / total) / 10 })) : data;
  const sorted = [...normalized].sort((a,b) => b.value - a.value).slice(0, maxBars);
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={sorted} margin={{ left: 10, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 6, 6]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
