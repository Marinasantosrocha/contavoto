import { useState, useMemo } from 'react';
import { useEstatisticasPesquisas, usePesquisas, usePesquisadores, useCidades, usePesquisasSupabase } from '../hooks/usePesquisas';
import { useFormularios } from '../hooks/useFormularios';
import { useRfbAnalytics } from '../hooks/useRfbAnalytics';
import { useProdutividade } from '../hooks/useProdutividade';
import { RFB_FIELDS, getFieldLabel, orderEntries } from '../data/rfbMappings';
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
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('todos');
  const [pesquisadorSelecionado, setPesquisadorSelecionado] = useState<string | null>(null); // Armazena o NOME, não o ID
  const [formularioSelecionado, setFormularioSelecionado] = useState<string | null>(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<Record<string, string | null>>({});
  
  // Obter usuário logado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoUsuario = user.tipo_usuario_id || user.tipo;
  const isPesquisador = tipoUsuario === 1 || tipoUsuario === 'pesquisador';
  const usuarioId = user.id;

  // Buscar dados - aplicar filtro de usuário para pesquisadores
  const filtroUsuario = isPesquisador ? usuarioId : pesquisadorSelecionado;
  const { data: estatisticas } = useEstatisticasPesquisas(filtroUsuario || undefined);
  
  // Buscar pesquisas direto do Supabase com filtros aplicados
  const { data: pesquisas = [] } = usePesquisasSupabase({
    periodo: periodoSelecionado,
    pesquisadorNome: pesquisadorSelecionado, // Passa o NOME
    cidade: cidadeSelecionada,
  });
  
  // Buscar pesquisas filtradas por período e cidade (sem filtro de pesquisador) para montar o dropdown
  const { data: pesquisasParaDropdown = [] } = usePesquisasSupabase({
    periodo: periodoSelecionado,
    pesquisadorNome: null, // Sem filtro de pesquisador
    cidade: cidadeSelecionada,
  });
  
  const { data: pesquisadores = [] } = usePesquisadores();
  const { data: formularios = [] } = useFormularios();
  const { data: produtividade = [] } = useProdutividade();
  const { data: cidadesSupabase = [] } = useCidades();

  // As pesquisas já vêm filtradas do Supabase
  const pesquisasFiltradas = pesquisas;

  // Calcular estatísticas do período
  const aceitaramPeriodo = pesquisasFiltradas.filter(p => p.aceite_participacao === 'true' || p.aceite_participacao === true).length;
  const recusaramPeriodo = pesquisasFiltradas.filter(p => p.aceite_participacao === 'false' || p.aceite_participacao === false).length;
  const ausentesPeriodo = pesquisasFiltradas.filter(p => p.aceite_participacao === 'ausente').length;
  
  // Taxa de aceite
  const totalAbordagens = aceitaramPeriodo + recusaramPeriodo + ausentesPeriodo;
  const taxaAceite = totalAbordagens > 0 ? (aceitaramPeriodo / totalAbordagens) * 100 : 0;
  const taxaRecusa = totalAbordagens > 0 ? (recusaramPeriodo / totalAbordagens) * 100 : 0;
  const taxaAusente = totalAbordagens > 0 ? (ausentesPeriodo / totalAbordagens) * 100 : 0;

  // Calcular distribuição de autorização de contato
  const autorizouContato = pesquisasFiltradas.filter(p => p.autorizacao_contato === 'Sim, autorizo').length;
  const naoAutorizouContato = pesquisasFiltradas.filter(p => p.autorizacao_contato === 'Não autorizo').length;
  const totalRespostasContato = autorizouContato + naoAutorizouContato;
  const taxaAutorizacao = totalRespostasContato > 0 ? (autorizouContato / totalRespostasContato) * 100 : 0;
  const taxaNaoAutorizacao = totalRespostasContato > 0 ? (naoAutorizouContato / totalRespostasContato) * 100 : 0;


  // Opções de filtros adicionais
  const opcoesFormularios = useMemo(() => ([
    { value: '', label: 'Todos os Formulários' },
    ...formularios
      .filter((f: any) => !!f?.uuid)
      .map((f: any) => ({ value: f.uuid as string, label: f.nome as string }))
  ]), [formularios]);

  const opcoesCidades = useMemo(() => {
    // Busca cidades direto do Supabase, não do IndexedDB local
    return [
      { value: '', label: 'Todas as Cidades' }, 
      ...cidadesSupabase.map(c => ({ value: c, label: c }))
    ];
  }, [cidadesSupabase]);

  // Filtrar pesquisadores usando os nomes únicos das pesquisas
  const opcoesPesquisadores = useMemo(() => {
    // Se não há pesquisas com os filtros aplicados, não mostrar nenhum pesquisador
    if (!pesquisasParaDropdown || pesquisasParaDropdown.length === 0) {
      return [];
    }
    
    // Extrair nomes únicos de entrevistadores das pesquisas
    const nomesUnicos = new Set(
      pesquisasParaDropdown
        .map(p => p.entrevistador)
        .filter((nome): nome is string => !!nome)
    );
    
    // Converter para array de opções (value = nome, label = nome)
    return Array.from(nomesUnicos)
      .map(nome => ({ value: nome, label: nome }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [pesquisasParaDropdown]);

  // Buscar agregações da RFB (respostas normalizadas) para perguntas de múltipla escolha
  const { data: rfbAgg } = useRfbAnalytics({
    periodo: periodoSelecionado,
    pesquisadorNome: pesquisadorSelecionado, // Passa o nome do pesquisador
    formularioUuid: formularioSelecionado,
    cidade: cidadeSelecionada,
    categorySelections: opcoesSelecionadas,
  });


  const scaleColors: Record<string, string> = {
    'Piorou': '#FF7B7B',
    'Está Igual': '#64748B',
    'Melhorou': '#1a9bff',
    'Não sei': '#CBD5E1',
  };

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

          {/* Cidade */}
          <div style={{ marginTop: '1rem' }}>
            <SimpleSelect
              label="Cidade"
              options={opcoesCidades}
              value={cidadeSelecionada || ''}
              onChange={(value) => setCidadeSelecionada((value as string) || null)}
            />
          </div>

          {/* Filtro de Pesquisador (apenas para não-pesquisadores) */}
          {!isPesquisador && (
            <div style={{ marginTop: '1rem' }}>
              <SimpleSelect
                label="Filtrar por Pesquisador"
                options={opcoesPesquisadores}
                value={pesquisadorSelecionado ?? ''}
                placeholder="Todos os Pesquisadores"
                onChange={(value) => setPesquisadorSelecionado(value ? String(value) : null)}
              />
            </div>
          )}
        </div>

        {/* Taxa de Aceite */}
        <div className="page-section">
          <ChartCard title="Taxa de Aceite" subtitle={`${totalAbordagens} abordagens no período`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: '1.25rem', alignItems: 'center' }}>
              <DonutChart 
                data={[
                  { name: 'Aceitaram', value: aceitaramPeriodo }, 
                  { name: 'Recusaram', value: recusaramPeriodo },
                  { name: 'Ausentes', value: ausentesPeriodo }
                ]}
                colors={['#1a9bff', '#FF7B7B', '#64748B']}
              />
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
                  <div className="taxa-bar-container">
                    <div className="taxa-bar-label">
                      <span>Ausentes</span>
                      <span className="taxa-percentage" style={{ color: '#64748B' }}>{taxaAusente.toFixed(1)}%</span>
                    </div>
                    <div className="taxa-bar">
                      <div className="taxa-bar-fill" style={{ width: `${taxaAusente}%`, backgroundColor: '#64748B' }}>
                        {ausentesPeriodo}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Autorização de Contato */}
        {totalRespostasContato > 0 && (
          <div className="page-section">
            <ChartCard title="Autorização de Contato" subtitle={`${totalRespostasContato} respostas no período`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: '1.25rem', alignItems: 'center' }}>
                <DonutChart 
                  data={[
                    { name: 'Sim, autorizo', value: autorizouContato }, 
                    { name: 'Não autorizo', value: naoAutorizouContato }
                  ]}
                  colors={['#1a9bff', '#FF7B7B']}
                />
                <div className="taxa-container">
                  <div className="taxa-chart">
                    <div className="taxa-bar-container">
                      <div className="taxa-bar-label">
                        <span>Sim, autorizo</span>
                        <span className="taxa-percentage">{taxaAutorizacao.toFixed(1)}%</span>
                      </div>
                      <div className="taxa-bar">
                        <div className="taxa-bar-fill success" style={{ width: `${taxaAutorizacao}%` }}>
                          {autorizouContato}
                        </div>
                      </div>
                    </div>
                    <div className="taxa-bar-container">
                      <div className="taxa-bar-label">
                        <span>Não autorizo</span>
                        <span className="taxa-percentage danger">{taxaNaoAutorizacao.toFixed(1)}%</span>
                      </div>
                      <div className="taxa-bar">
                        <div className="taxa-bar-fill danger" style={{ width: `${taxaNaoAutorizacao}%` }}>
                          {naoAutorizouContato}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        )}

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
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem' }}>Percepção por Tema</h4>
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

              </div>
            )}
          </ChartCard>
        </div>



        {/* Produtividade dos Pesquisadores */}
        <div className="page-section">
          <ChartCard 
            title="Produtividade dos Pesquisadores" 
            subtitle="Tempo médio de entrevista e intervalo entre entrevistas"
          >
            {produtividade && produtividade.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                {produtividade.map((item) => {
                  // Calcular estatísticas de aceite/recusa/ausente para este pesquisador
                  // Usar 'pesquisas' (todas do período) em vez de 'pesquisasFiltradas' (que pode ter filtros adicionais)
                  const pesquisasDoPesquisador = pesquisas.filter(p => p.entrevistador === item.entrevistador);
                  const aceitas = pesquisasDoPesquisador.filter(p => p.aceite_participacao === 'true' || p.aceite_participacao === true).length;
                  const recusadas = pesquisasDoPesquisador.filter(p => p.aceite_participacao === 'false' || p.aceite_participacao === false).length;
                  const ausentes = pesquisasDoPesquisador.filter(p => p.aceite_participacao === 'ausente').length;
                  const totalFiltrado = aceitas + recusadas + ausentes;
                  
                  // Não mostrar pesquisadores com 0 entrevistas no período filtrado
                  if (totalFiltrado === 0) return null;
                  
                  return (
                  <div key={item.entrevistador} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      marginBottom: '0.5rem'
                    }}>
                      {item.entrevistador} ({totalFiltrado} entrevistas)
                    </h4>
                    
                    {/* Estatísticas de Aceite/Recusa/Ausente */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      marginBottom: '1rem',
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>
                      <span>
                        <strong style={{ color: '#1a9bff' }}>{aceitas}</strong> aceitas
                      </span>
                      <span>
                        <strong style={{ color: '#FF7B7B' }}>{recusadas}</strong> recusadas
                      </span>
                      <span>
                        <strong style={{ color: '#64748B' }}>{ausentes}</strong> ausentes
                      </span>
                    </div>
                    
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
                  );
                })}
                
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
