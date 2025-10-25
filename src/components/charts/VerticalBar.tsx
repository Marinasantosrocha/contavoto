import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';

export interface VerticalBarItem {
  name: string;
  value: number; // percent (0-100)
}

interface VerticalBarProps {
  data: VerticalBarItem[];
  height?: number;
  color?: string;
}

export function VerticalBar({ data, height = 260, color = '#242c30' }: VerticalBarProps) {
  const sorted = [...data].sort((a,b) => b.value - a.value);
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={sorted} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={50} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v: any) => `${v}%`} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} isAnimationActive>
            <LabelList dataKey="value" position="top" formatter={(v: any) => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
