import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export interface DonutDatum {
  name: string;
  value: number;
}

const DEFAULT_COLORS = ['#242c30', '#17A2B8', '#FFC107', '#FF6B6B', '#4D96FF', '#845EC2', '#2C73D2', '#008B8B'];

interface DonutChartProps {
  data: DonutDatum[];
  colors?: string[];
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  onSliceClick?: (name: string, value: number) => void;
}

export function DonutChart({ data, colors = DEFAULT_COLORS, height = 260, innerRadius = '55%', outerRadius = '85%', onSliceClick }: DonutChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            isAnimationActive
          >
            {data.map((d, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                onClick={() => onSliceClick?.(d.name, d.value)}
              />
            ))}
          </Pie>
          <Tooltip formatter={(val) => String(val)} />
          <Legend verticalAlign="bottom" height={24} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
