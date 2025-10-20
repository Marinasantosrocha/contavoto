import { useState } from 'react';
import { Pesquisa } from '../db/localDB';
import { usePesquisas, useDeletarPesquisa } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';

interface ListaPesquisasPageProps {
  onVoltar: () => void;
  onEditarPesquisa: (pesquisaId: number) => void;
}

export const ListaPesquisasPage = ({ onVoltar, onEditarPesquisa }: ListaPesquisasPageProps) => {
  // Estados locais
  const [filtro, setFiltro] = useState<'todas' | 'em_andamento' | 'finalizada'>('todas');
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState<Pesquisa | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{[key: number]: number}>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // React Query hooks
  const filtroObj = filtro === 'todas' ? undefined : { status: filtro };
  const { data: pesquisas = [], isLoading } = usePesquisas(filtroObj);
  const deletarPesquisa = useDeletarPesquisa();

  // Swipe handler para mobile
  const minSwipeToReveal = 80; // pixels para revelar o botão
  const maxSwipe = 100;

  const onTouchStart = (e: React.TouchEvent, _pesquisaId: number) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent, pesquisaId: number) => {
    if (!touchStart || !isDragging) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Só permite arrastar para esquerda
    if (diff > 0 && diff <= maxSwipe) {
      setSwipeOffset(prev => ({ ...prev, [pesquisaId]: diff }));
    } else if (diff < 0) {
      setSwipeOffset(prev => ({ ...prev, [pesquisaId]: 0 }));
    }
  };

  const onTouchEnd = (pesquisaId: number) => {
    setIsDragging(false);
    const offset = swipeOffset[pesquisaId] || 0;
    
    if (offset >= minSwipeToReveal) {
      // Travou aberto
      setSwipedItemId(pesquisaId);
      setSwipeOffset(prev => ({ ...prev, [pesquisaId]: maxSwipe }));
    } else {
      // Volta ao normal
      setSwipedItemId(null);
      setSwipeOffset(prev => ({ ...prev, [pesquisaId]: 0 }));
    }
    setTouchStart(null);
  };

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
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={onVoltar}
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
              const isSwiped = swipedItemId === pesquisa.id;
              const currentOffset = swipeOffset[pesquisa.id!] || 0;

              return (
                <div
                  key={pesquisa.id}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {/* Botão de deletar revelado ao arrastar */}
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '100px',
                      background: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 1,
                      opacity: currentOffset > 0 ? 1 : 0,
                      transition: isDragging ? 'none' : 'opacity 0.3s ease'
                    }}
                    onClick={() => handleDeletar(pesquisa.id!)}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4h8v2M10 11v6M14 11v6M5 6l1 14h12l1-14" 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Card da pesquisa */}
                  <div
                    className={`pesquisa-card ${!pesquisa.sincronizado ? 'not-synced' : ''}`}
                    style={{
                      position: 'relative',
                      transform: `translateX(-${currentOffset}px)`,
                      transition: isDragging ? 'none' : 'transform 0.3s ease',
                      zIndex: 2,
                      touchAction: 'pan-y',
                      padding: '16px'
                    }}
                    onTouchStart={(e) => onTouchStart(e, pesquisa.id!)}
                    onTouchMove={(e) => onTouchMove(e, pesquisa.id!)}
                    onTouchEnd={() => onTouchEnd(pesquisa.id!)}
                    onClick={() => !isSwiped && setPesquisaSelecionada(pesquisa)}
                  >
                    {/* Status badge alinhado à esquerda */}
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '600',
                        color: '#20B2AA',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {statusBadge.text}
                      </span>
                      {!pesquisa.sincronizado && (
                        <span className="sync-badge warning" style={{ fontSize: '11px', padding: '3px 6px' }}>⚠️ Não sincronizado</span>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ marginBottom: '8px' }}>{pesquisa.nomeEntrevistado || 'Nome não informado'}</h3>
                      
                      {/* Localização */}
                      <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', fontSize: '14px', color: '#6b7280' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                            fill="#6b7280"
                          />
                        </svg>
                        <span>{pesquisa.endereco}, {pesquisa.bairro} - {pesquisa.cidade}</span>
                      </p>
                      
                      {/* Formulário */}
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '14px', color: '#6b7280' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" 
                            fill="#6b7280"
                          />
                        </svg>
                        <span>{pesquisa.formularioNome}</span>
                      </p>
                      
                      {/* Entrevistador */}
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '14px', color: '#6b7280' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" 
                            fill="#6b7280"
                          />
                        </svg>
                        <span>{pesquisa.entrevistador}</span>
                      </p>
                      
                      {/* Data */}
                      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" 
                            fill="#6b7280"
                          />
                        </svg>
                        <span>{formatarData(pesquisa.iniciadaEm)}</span>
                      </p>
                    </div>

                    {pesquisa.status === 'em_andamento' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditarPesquisa(pesquisa.id!);
                        }}
                        className="btn btn-primary btn-small"
                        style={{ width: '100%' }}
                      >
                        Continuar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav onNavigateHome={onVoltar} />

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
