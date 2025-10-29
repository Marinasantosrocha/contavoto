import { useState, useMemo } from 'react';
import { useEstatisticasPesquisas, usePesquisas, usePesquisadores } from '../hooks/usePesquisas';
import { useFormularios } from '../hooks/useFormularios';
import { useRfbAnalytics } from '../hooks/useRfbAnalytics';
import { useProdutividade } from '../hooks/useProdutividade';
import { RFB_FIELDS, getFieldLabel } from '../data/rfbMappings';
import { BottomNav } from '../components/BottomNav';
import { ChartCard } from '../components/ChartCard';
import { DonutChart } from '../components/charts/DonutChart';
import { BarHorizontal } from '../components/charts/BarHorizontal';
import { Stacked100BarList } from '../components/charts/Stacked100BarList';
import { SimpleSelect } from '../components/SimpleSelect';
import '../styles/dashboard.css';

interface DashboardPageProps {
  onNavigateHome: () => void;
  onNavigatePesquisas: () => void;
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'todos';

export const DashboardPage = ({ 
  onNavigateHome, 
  onNavigatePesquisas
}: DashboardPageProps) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('hoje');
  const [pesquisadorSelecionado, setPesquisadorSelecionado] = useState<number | null>(null);
  const [formularioSelecionado] = useState<string | null>(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [bairroSelecionado, setBairroSelecionado] = useState<string | null>(null);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<Record<string, string | null>>({});
  
  // Obter usuário logado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoUsuario = user.tipo_usuario_id || user.tipo;
  const isPesquisador = tipoUsuario === 1 || tipoUsuario === 'pesquisador';
  const usuarioId = user.id;

  // Buscar dados - aplicar filtro de usuário para pesquisadores
  const filtroUsuario = isPesquisador ? usuarioId : pesquisadorSelecionado;
  const { data: estatisticas } = useEstatisticasPesquisas(filtroUsuario || undefined);
  const { data: pesquisas = [] } = usePesquisas();
  const { data: pesquisadores = [] } = usePesquisadores();
  const { data: formularios = [] } = useFormularios();
  const { data: produtividade = [] } = useProdutividade();

  // Filtrar pesquisas por pesquisador (se for pesquisador logado, apenas suas pesquisas)
  const pesquisasPorPesquisador = pesquisas.filter(p => {
    if (isPesquisador) {
      return p.usuario_id === usuarioId;
    }
    if (pesquisadorSelecionado) {
      return p.usuario_id === pesquisadorSelecionado;
    }
    return true; // Mostra todas se for admin/suporte sem filtro
  });

  // Filtrar pesquisas por período
  const pesquisasFiltradas = pesquisasPorPesquisador.filter(p => {
    if (periodoSelecionado === 'todos') return true;
    
    const dataInicio = new Date(p.iniciadaEm);
    const hoje = new Date();
    
    if (periodoSelecionado === 'hoje') {
      return dataInicio.toDateString() === hoje.toDateString();
    }
    
    if (periodoSelecionado === 'semana') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(hoje.getDate() - 7);
      return dataInicio >= umaSemanaAtras;
    }
    
    if (periodoSelecionado === 'mes') {
      const umMesAtras = new Date();
      umMesAtras.setMonth(hoje.getMonth() - 1);
      return dataInicio >= umMesAtras;
    }
    
    return true;
  });

  // Calcular estatísticas do período
  const aceitaramPeriodo = pesquisasFiltradas.filter(p => p.aceite_participacao === true).length;
  const recusaramPeriodo = pesquisasFiltradas.filter(p => p.aceite_participacao === false).length;
  
  // Taxa de aceite
  const totalAbordagens = aceitaramPeriodo + recusaramPeriodo;
  const taxaAceite = totalAbordagens > 0 ? (aceitaramPeriodo / totalAbordagens) * 100 : 0;
  const taxaRecusa = totalAbordagens > 0 ? (recusaramPeriodo / totalAbordagens) * 100 : 0;

  // Agrupar recusas por motivo
  const motivosRecusa: { [key: string]: number } = {};
  pesquisasFiltradas
    .filter(p => p.motivo_recusa)
    .forEach(p => {
      motivosRecusa[p.motivo_recusa!] = (motivosRecusa[p.motivo_recusa!] || 0) + 1;
    });

  // Agrupar por bairro
  const pesquisasPorBairro: { [key: string]: number } = {};
  pesquisasFiltradas.forEach(p => {
    const bairro = p.bairro || 'Não informado';
    pesquisasPorBairro[bairro] = (pesquisasPorBairro[bairro] || 0) + 1;
  });

  // Ordenar bairros por quantidade (todos)
  const bairrosOrdenados = Object.entries(pesquisasPorBairro)
    .sort(([, a], [, b]) => b - a);

  // Opções de filtros adicionais
  const opcoesFormularios = useMemo(() => ([
    { value: '', label: 'Todos os Formulários' },
    ...formularios
      .filter((f: any) => !!f?.uuid)
      .map((f: any) => ({ value: f.uuid as string, label: f.nome as string }))
  ]), [formularios]);

  const opcoesCidades = useMemo(() => {
    const set = new Set<string>();
    pesquisasPorPesquisador.forEach(p => { if (p.cidade) set.add(p.cidade); });
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: '', label: 'Todas as Cidades' }, ...arr.map(c => ({ value: c, label: c }))];
  }, [pesquisasPorPesquisador]);

  const opcoesBairros = useMemo(() => {
    const set = new Set<string>();
    pesquisasPorPesquisador
      .filter(p => !cidadeSelecionada || p.cidade === cidadeSelecionada)
      .forEach(p => { if (p.bairro) set.add(p.bairro); });
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [{ value: '', label: 'Todos os Bairros' }, ...arr.map(b => ({ value: b, label: b }))];
  }, [pesquisasPorPesquisador, cidadeSelecionada]);

  // Buscar agregações da RFB (respostas normalizadas) para perguntas de múltipla escolha
  const { data: rfbAgg } = useRfbAnalytics({
    periodo: periodoSelecionado,
    pesquisadorId: filtroUsuario || null,
    formularioUuid: formularioSelecionado,
    cidade: cidadeSelecionada,
    bairro: bairroSelecionado,
    categorySelections: opcoesSelecionadas,
  });

  // beautify não é mais usado; labels amigáveis vêm de rfbMappings

  const handleSliceClick = (fieldKey: string, name: string) => {
    setOpcoesSelecionadas((prev) => ({ ...prev, [fieldKey]: name }));
  };

  const clearSelection = (fieldKey: string) => {
    setOpcoesSelecionadas((prev) => ({ ...prev, [fieldKey]: null }));
  };

  const clearAllSelections = () => setOpcoesSelecionadas({});

  return (
    <div className="app-container">
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={onNavigateHome}
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{ 
                marginRight: '12px',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <path 
                d="M15 18L9 12L15 6" 
                stroke="#1a9bff" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="header-title">Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Filtros */}
        <div className="page-section">
          <SimpleSelect
            label="Período de Análise"
            options={[
              { value: 'hoje', label: 'Hoje' },
              { value: 'semana', label: 'Últimos 7 dias' },
              { value: 'mes', label: 'Últimos 30 dias' },
              { value: 'todos', label: 'Todos os períodos' }
            ]}
            value={periodoSelecionado}
            onChange={(value) => setPeriodoSelecionado(value as Periodo)}
          />

          {/* Filtro de Pesquisador (apenas para não-pesquisadores) */}
          {!isPesquisador && (
            <div style={{ marginTop: '1rem' }}>
              <SimpleSelect
                label="Filtrar por Pesquisador"
                options={[
                  { value: '', label: 'Todos os Pesquisadores' },
                  ...pesquisadores.map(p => ({ value: p.id, label: p.nome }))
                ]}
                value={pesquisadorSelecionado || ''}
                onChange={(value) => setPesquisadorSelecionado(value ? Number(value) : null)}
              />
            </div>
          )}

          {/* Cidade e Bairro */}
          <div style={{ marginTop: '1rem' }}>
            <SimpleSelect
              label="Cidade"
              options={opcoesCidades}
              value={cidadeSelecionada || ''}
              onChange={(value) => setCidadeSelecionada((value as string) || null)}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <SimpleSelect
              label="Bairro"
              options={opcoesBairros}
              value={bairroSelecionado || ''}
              onChange={(value) => setBairroSelecionado((value as string) || null)}
            />
          </div>
        </div>

        {/* Taxa de Aceite */}
        <div className="page-section">
          <ChartCard title="Taxa de Aceite" subtitle={`Base: ${totalAbordagens} abordagens no período`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: '1.25rem', alignItems: 'center' }}>
              <DonutChart data={[{ name: 'Aceitaram', value: aceitaramPeriodo }, { name: 'Recusaram', value: recusaramPeriodo }]} />
              <div className="taxa-container">
                <div className="taxa-chart">
                  <div className="taxa-bar-container">
                    <div className="taxa-bar-label">
                      <span>Aceitaram</span>
                      <span className="taxa-percentage">{taxaAceite.toFixed(1)}%</span>
                    </div>
                    <div className="taxa-bar">
                      <div className="taxa-bar-fill success" style={{ width: `${taxaAceite}%` }}>
                        {aceitaramPeriodo}
                      </div>
                    </div>
                  </div>
                  <div className="taxa-bar-container">
                    <div className="taxa-bar-label">
                      <span>Recusaram</span>
                      <span className="taxa-percentage danger">{taxaRecusa.toFixed(1)}%</span>
                    </div>
                    <div className="taxa-bar">
                      <div className="taxa-bar-fill danger" style={{ width: `${taxaRecusa}%` }}>
                        {recusaramPeriodo}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="taxa-summary">
                  <div className="taxa-summary-item">
                    <span className="taxa-summary-label">Total de Abordagens:</span>
                    <span className="taxa-summary-value">{totalAbordagens}</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Opiniões por Tema (RFB) */}
        <div className="page-section">
          <ChartCard 
            title="Opiniões por Tema" 
            subtitle={rfbAgg ? `Base: ${rfbAgg.total} respostas normalizadas` : 'Carregando...'}
            right={(
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {Object.entries(opcoesSelecionadas).filter(([,v]) => !!v).map(([k, v]) => (
                    <span key={k} style={{ background: 'rgba(26,155,255,0.12)', color: '#1a9bff', border: '1px solid #1a9bff', borderRadius: 16, padding: '2px 8px', fontSize: 12 }}>
                      {getFieldLabel(k)}: {v}
                      <button onClick={() => clearSelection(k)} style={{ marginLeft: 6, border: 'none', background: 'transparent', color: '#1a9bff', cursor: 'pointer' }}>×</button>
                    </span>
                  ))}
                  {Object.values(opcoesSelecionadas).some(Boolean) && (
                    <button onClick={clearAllSelections} style={{ marginLeft: 8, border: '1px solid #6C757D', background: 'transparent', color: '#6C757D', borderRadius: 16, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}>Limpar filtros</button>
                  )}
                </div>
              )}
          >
            {!rfbAgg && (
              <div style={{ padding: '1rem', color: '#6C757D' }}>Carregando gráficos…</div>
            )}
            {rfbAgg && rfbAgg.total === 0 && (
              <div style={{ padding: '1rem', color: '#6C757D' }}>Sem dados para exibir com os filtros atuais.</div>
            )}
            {rfbAgg && rfbAgg.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1) Percepção por Tema (scale3) - barras empilhadas 100% */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem', margin: 0 }}>Percepção por Tema</h4>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#1a9bff', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Melhorou</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#64748B', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Está Igual</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#FF7B7B', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Piorou</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#CBD5E1', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Não sei</span>
                      </div>
                    </div>
                  </div>
                  <Stacked100BarList
                    rows={RFB_FIELDS.filter(f => f.type === 'scale3').map(f => ({
                      key: f.key,
                      label: f.label,
                      dist: rfbAgg.distribuicoes[f.key] || {},
                      order: f.order,
                    }))}
                    onSegmentClick={(field, opt) => handleSliceClick(field, opt)}
                  />
                </div>

                {/* 2) Indicadores Binários - barras empilhadas 100% */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem', margin: 0 }}>Indicadores de Aprovação</h4>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#1a9bff', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sim</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: '12px', height: '12px', backgroundColor: '#FF7B7B', borderRadius: '2px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Não</span>
                      </div>
                    </div>
                  </div>
                  <Stacked100BarList
                    rows={RFB_FIELDS.filter(f => f.type === 'binary').map(f => ({
                      key: f.key,
                      label: f.label,
                      dist: rfbAgg.distribuicoes[f.key] || {},
                      order: f.order,
                    }))}
                    onSegmentClick={(field, opt) => handleSliceClick(field, opt)}
                  />
                </div>

                {/* 3) Principais Temas (Top 8) - barras horizontais em % */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem' }}>Principais Temas</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {(['problema_cidade','area_avanco','prioridade_deputado'] as const).map((campo) => {
                      const dist = rfbAgg.distribuicoes[campo] || {};
                      const entries = Object.entries(dist).filter(([,v]) => v > 0);
                      if (entries.length === 0) return null;
                      const data = entries.map(([name, value]) => ({ name, value }));
                      return (
                        <div key={campo} className="card" style={{ padding: '0.25rem 0.5rem' }}>
                          <div className="card-header" style={{ padding: '0.25rem 0.5rem' }}>
                            <h5 className="card-title" style={{ fontSize: '0.95rem' }}>{RFB_FIELDS.find(f => f.key === campo)?.label}</h5>
                          </div>
                          <BarHorizontal data={data} maxBars={8} normalizePercent />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Motivos de Recusa */}
        {recusaramPeriodo > 0 && (
          <div className="page-section">
            <ChartCard title="Motivos de Recusa" subtitle={`Base: ${recusaramPeriodo} recusas`}>
              <BarHorizontal data={Object.entries(motivosRecusa).map(([name, value]) => ({ name, value }))} />
            </ChartCard>
          </div>
        )}

        {/* Bairros */}
        {bairrosOrdenados.length > 0 && (
          <div className="page-section">
            <ChartCard title="Top Bairros" subtitle={`Base: ${pesquisasFiltradas.length} pesquisas`}>
              <BarHorizontal data={bairrosOrdenados.map(([name, value]) => ({ name, value }))} />
            </ChartCard>
          </div>
        )}

        {/* Produtividade dos Pesquisadores */}
        <div className="page-section">
          <ChartCard 
            title="Produtividade dos Pesquisadores" 
            subtitle="Tempo médio de entrevista e intervalo entre entrevistas"
          >
            {produtividade && produtividade.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                {produtividade.map((item) => (
                  <div key={item.entrevistador} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      marginBottom: '0.75rem'
                    }}>
                      {item.entrevistador} ({item.total_entrevistas} entrevistas)
                    </h4>
                    
                    {/* Duração Média */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.25rem',
                        fontSize: '14px'
                      }}>
                        <span style={{ color: '#6b7280' }}>Duração média da entrevista</span>
                        <span style={{ fontWeight: '600', color: '#1a9bff' }}>
                          {item.duracao_media_minutos?.toFixed(1) || '0'} min
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '24px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${Math.min((item.duracao_media_minutos / 30) * 100, 100)}%`, 
                          height: '100%', 
                          backgroundColor: '#1a9bff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.duracao_media_minutos > 5 && `${item.duracao_media_minutos.toFixed(1)}m`}
                        </div>
                      </div>
                    </div>

                    {/* Intervalo Médio */}
                    {item.intervalo_medio_minutos && (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '0.25rem',
                          fontSize: '14px'
                        }}>
                          <span style={{ color: '#6b7280' }}>Intervalo médio entre entrevistas</span>
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                            {item.intervalo_medio_minutos.toFixed(1)} min
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '24px', 
                          backgroundColor: '#f3f4f6', 
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${Math.min((item.intervalo_medio_minutos / 30) * 100, 100)}%`, 
                            height: '100%', 
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {item.intervalo_medio_minutos > 5 && `${item.intervalo_medio_minutos.toFixed(1)}m`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <strong>Nota:</strong> Intervalos maiores que 60 minutos (horário de almoço) não são considerados no cálculo.
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#6b7280' 
              }}>
                Nenhum dado de produtividade disponível
              </div>
            )}
          </ChartCard>
        </div>
      </main>

      <BottomNav 
        onNavigateHome={onNavigateHome}
        onNavigatePesquisas={onNavigatePesquisas}
      />
    </div>
  );
};
