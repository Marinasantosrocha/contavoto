import { useState } from 'react';
import { useEstatisticasPesquisas, usePesquisas, usePesquisadores } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
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
                stroke="#20B2AA" 
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
          <div className="form-group">
            <label htmlFor="periodo-select" className="form-label">Período de Análise</label>
            <select 
              id="periodo-select"
              className="form-select"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value as Periodo)}
            >
              <option value="hoje">Hoje</option>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Últimos 30 dias</option>
              <option value="todos">Todos os períodos</option>
            </select>
          </div>

          {/* Filtro de Pesquisador (apenas para não-pesquisadores) */}
          {!isPesquisador && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="pesquisador-select" className="form-label">Filtrar por Pesquisador</label>
              <select 
                id="pesquisador-select"
                className="form-select"
                value={pesquisadorSelecionado || ''}
                onChange={(e) => setPesquisadorSelecionado(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Todos os Pesquisadores</option>
                {pesquisadores.map(pesquisador => (
                  <option key={pesquisador.id} value={pesquisador.id}>
                    {pesquisador.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Taxa de Aceite */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Taxa de Aceite</h3>
            </div>
            
            <div className="taxa-container">
              <div className="taxa-chart">
                <div className="taxa-bar-container">
                  <div className="taxa-bar-label">
                    <span>Aceitaram</span>
                    <span className="taxa-percentage">{taxaAceite.toFixed(1)}%</span>
                  </div>
                  <div className="taxa-bar">
                    <div 
                      className="taxa-bar-fill success"
                      style={{ width: `${taxaAceite}%` }}
                    >
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
                    <div 
                      className="taxa-bar-fill danger"
                      style={{ width: `${taxaRecusa}%` }}
                    >
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
        </div>

        {/* Motivos de Recusa */}
        {recusaramPeriodo > 0 && (
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Motivos de Recusa</h3>
              </div>

              <div className="motivos-list">
                {Object.entries(motivosRecusa)
                  .sort(([, a], [, b]) => b - a)
                  .map(([motivo, quantidade]) => {
                    const porcentagem = (quantidade / recusaramPeriodo) * 100;
                    return (
                      <div key={motivo} className="motivo-item">
                        <div className="motivo-header">
                          <span className="motivo-label">{motivo}</span>
                          <span className="motivo-count">{quantidade}</span>
                        </div>
                        <div className="motivo-bar">
                          <div 
                            className="motivo-bar-fill"
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Bairros */}
        {bairrosOrdenados.length > 0 && (
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Top Bairros</h3>
              </div>

              <div className="bairros-list">
                {bairrosOrdenados.map(([bairro, quantidade], index) => {
                  const maxQuantidade = bairrosOrdenados[0][1];
                  const porcentagem = (quantidade / maxQuantidade) * 100;
                  return (
                    <div key={bairro} className="bairro-item">
                      <div className="bairro-rank">#{index + 1}</div>
                      <div className="bairro-info">
                        <div className="bairro-header">
                          <span className="bairro-nome">{bairro}</span>
                          <span className="bairro-count">{quantidade} pesquisas</span>
                        </div>
                        <div className="bairro-bar">
                          <div 
                            className="bairro-bar-fill"
                            style={{ width: `${porcentagem}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas Gerais (Sempre visível) */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Estatísticas Gerais (Todos os Tempos)</h3>
            </div>

            <div className="stats-list">
              <div className="stats-list-item">
                <span className="stats-list-label">Total de Pesquisas:</span>
                <span className="stats-list-value">{estatisticas?.total || 0}</span>
              </div>
              <div className="stats-list-item">
                <span className="stats-list-label">Finalizadas:</span>
                <span className="stats-list-value">{estatisticas?.finalizadas || 0}</span>
              </div>
              <div className="stats-list-item">
                <span className="stats-list-label">Em Andamento:</span>
                <span className="stats-list-value">{estatisticas?.emAndamento || 0}</span>
              </div>
              <div className="stats-list-item">
                <span className="stats-list-label">Não Sincronizadas:</span>
                <span className="stats-list-value">{estatisticas?.naoSincronizadas || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav 
        onNavigateHome={onNavigateHome}
        onNavigatePesquisas={onNavigatePesquisas}
      />
    </div>
  );
};
