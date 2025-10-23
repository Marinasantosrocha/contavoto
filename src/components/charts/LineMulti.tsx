import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

export interface LineMultiSeries {
  key: string;
  color?: string;
}

interface LineMultiProps {
  data: Array<Record<string, any>>; // cada item deve ter { date: string, [serieKey]: number }
  series: LineMultiSeries[];
  height?: number;
  ySuffix?: string; // ex.: '%'
}

export function LineMulti({ data, series, height = 280, ySuffix = '%' }: LineMultiProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${v}${ySuffix}`} width={40} />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color || '#20B2AA'}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
