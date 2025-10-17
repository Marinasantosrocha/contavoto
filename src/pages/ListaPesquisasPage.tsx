import { useState } from 'react';
import { Pesquisa } from '../db/localDB';
import { usePesquisas, useDeletarPesquisa } from '../hooks/usePesquisas';

interface ListaPesquisasPageProps {
  onVoltar: () => void;
  onEditarPesquisa: (pesquisaId: number) => void;
}

export const ListaPesquisasPage = ({ onVoltar, onEditarPesquisa }: ListaPesquisasPageProps) => {
  // Estados locais
  const [filtro, setFiltro] = useState<'todas' | 'em_andamento' | 'finalizada'>('todas');
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState<Pesquisa | null>(null);

  // React Query hooks
  const filtroObj = filtro === 'todas' ? undefined : { status: filtro };
  const { data: pesquisas = [], isLoading } = usePesquisas(filtroObj);
  const deletarPesquisa = useDeletarPesquisa();

  const handleDeletar = async (pesquisaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta pesquisa?')) {
      await deletarPesquisa.mutateAsync(pesquisaId);
      setPesquisaSelecionada(null);
    }
  };

  const formatarData = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'em_andamento': { emoji: '⏳', text: 'Em Andamento', class: 'warning' },
      'finalizada': { emoji: '✅', text: 'Finalizada', class: 'success' },
      'cancelada': { emoji: '❌', text: 'Cancelada', class: 'danger' },
    };
    return badges[status as keyof typeof badges] || badges.em_andamento;
  };

  return (
    <div className="app-container">
      <header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={onVoltar} className="btn btn-secondary btn-small">
              ⬅️ Voltar
            </button>
            <h1 className="header-title">Pesquisas Realizadas</h1>
          </div>
        </div>
      </header>

      <main className="main-content">

      <div className="filtros">
        <button
          onClick={() => setFiltro('todas')}
          className={`btn ${filtro === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Todas ({pesquisas.length})
        </button>
        <button
          onClick={() => setFiltro('em_andamento')}
          className={`btn ${filtro === 'em_andamento' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Em Andamento
        </button>
        <button
          onClick={() => setFiltro('finalizada')}
          className={`btn ${filtro === 'finalizada' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Finalizadas
        </button>
      </div>

      <div className="lista-container">
        {isLoading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Carregando pesquisas...</p>
          </div>
        ) : pesquisas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Nenhuma pesquisa encontrada</p>
          </div>
        ) : (
          <div className="pesquisas-grid">
            {pesquisas.map((pesquisa) => {
              const statusBadge = getStatusBadge(pesquisa.status);

              return (
                <div
                  key={pesquisa.id}
                  className={`pesquisa-card ${!pesquisa.sincronizado ? 'not-synced' : ''}`}
                  onClick={() => setPesquisaSelecionada(pesquisa)}
                >
                  <div className="card-header">
                    <span className={`status-badge ${statusBadge.class}`}>
                      {statusBadge.emoji} {statusBadge.text}
                    </span>
                    {!pesquisa.sincronizado && (
                      <span className="sync-badge warning">⚠️ Não sincronizado</span>
                    )}
                  </div>

                  <div className="card-content">
                    <h3>{pesquisa.nomeEntrevistado || 'Nome não informado'}</h3>
                    <p className="location">
                      📍 {pesquisa.endereco}, {pesquisa.bairro} - {pesquisa.cidade}
                    </p>
                    <p className="form-name">📋 {pesquisa.formularioNome}</p>
                    <p className="interviewer">👤 {pesquisa.entrevistador}</p>
                    <p className="date">🕐 {formatarData(pesquisa.iniciadaEm)}</p>
                  </div>

                  <div className="card-actions">
                    {pesquisa.status === 'em_andamento' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarPesquisa(pesquisa.id!);
                        }}
                        className="btn btn-primary btn-small"
                      >
                        ✏️ Continuar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletar(pesquisa.id!);
                      }}
                      className="btn btn-danger btn-small"
                      disabled={deletarPesquisa.isPending}
                    >
                      {deletarPesquisa.isPending ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="nav-item">
            <div className="nav-icon">🏠</div>
            <span className="nav-label">HOME</span>
          </div>
          <div className="nav-item active">
            <div className="nav-icon">📊</div>
            <span className="nav-label">PESQUISAS</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">👥</div>
            <span className="nav-label">USUÁRIOS</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">⚙️</div>
            <span className="nav-label">CONF</span>
          </div>
        </div>
      </nav>

      {/* Modal de Detalhes */}
      {pesquisaSelecionada && (
        <div className="modal-overlay" onClick={() => setPesquisaSelecionada(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Pesquisa</h2>
              <button
                onClick={() => setPesquisaSelecionada(null)}
                className="btn btn-secondary btn-small"
              >
                ✖️
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <strong>Entrevistado:</strong>
                <p>{pesquisaSelecionada.nomeEntrevistado || 'Não informado'}</p>
              </div>

              <div className="detail-group">
                <strong>Telefone:</strong>
                <p>{pesquisaSelecionada.telefoneEntrevistado || 'Não informado'}</p>
              </div>

              <div className="detail-group">
                <strong>Localização:</strong>
                <p>
                  {pesquisaSelecionada.endereco}
                  {pesquisaSelecionada.numeroResidencia && `, ${pesquisaSelecionada.numeroResidencia}`}
                  <br />
                  {pesquisaSelecionada.bairro} - {pesquisaSelecionada.cidade}
                </p>
              </div>

              <div className="detail-group">
                <strong>Respostas:</strong>
                <div className="respostas-list">
                  {Object.entries(pesquisaSelecionada.respostas || {}).map(([key, value]) => (
                    <div key={key} className="resposta-item">
                      <span className="resposta-key">{key}:</span>
                      <span className="resposta-value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
