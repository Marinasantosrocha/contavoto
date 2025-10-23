import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, right, children }: ChartCardProps) {
  return (
    <div className="card">
      <div className="card-header" style={{ alignItems: 'baseline' }}>
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && (
            <div style={{ fontSize: '0.875rem', color: '#6C757D', marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      <div style={{ padding: '0.5rem 0 0.25rem' }}>
        {children}
      </div>
    </div>
  );
}
