import { useEffect, useMemo, useState } from 'react';
import { usePesquisas, useDeletarPesquisa, usePesquisasTabela } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import '../styles/tabela-pesquisas.css';

interface ListaPesquisasPageProps {
  onVoltar: () => void;
  onEditarPesquisa: (pesquisaId: number) => void;
}

export const ListaPesquisasPage = ({ onVoltar, onEditarPesquisa }: ListaPesquisasPageProps) => {
  // Estados locais
  const [filtro, setFiltro] = useState<'todas' | 'em_andamento' | 'finalizada'>('todas');
  const [pesquisaSelecionada, setPesquisaSelecionada] = useState<any | null>(null);
  // Mantido para uso futuro em reprodução completa; não utilizado após simplificação do player
  // const [audioDurations, setAudioDurations] = useState<Record<number, number>>({});
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{[key: number]: number}>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // const [audioProgress, setAudioProgress] = useState<Record<number, number>>({});
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioMapRef = useMemo(() => new Map<number, HTMLAudioElement>(), []);
  // Paginação da tabela (Admin)
  const [adminLimit] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(0);
  
  // Paginação para tabela
  const { data: pesquisasTabela = [], isLoading: loadingTabela } = usePesquisasTabela(adminLimit, currentPage * adminLimit);

  // React Query hooks
  const filtroObj = filtro === 'todas' ? undefined : { status: filtro };
  const { data: pesquisas = [], isLoading } = usePesquisas(filtroObj);
  const deletarPesquisa = useDeletarPesquisa();

  // Usuário e papel
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const tipoToId = (t?: string) => t === 'superadmin' ? 5 : t === 'admin' ? 4 : t === 'pesquisador' ? 1 : undefined;
  const tipoUsuarioId: number | undefined = typeof user?.tipo_usuario_id === 'number' ? user.tipo_usuario_id : tipoToId(user?.tipo_usuario);
  const isSuperAdmin = tipoUsuarioId === 5;
  const isPesquisador = tipoUsuarioId === 1;

  // Bloqueia scroll do fundo quando o modal estiver aberto (bottom sheet)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (pesquisaSelecionada) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prevOverflow || '';
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [pesquisaSelecionada]);

  // util caso voltarmos a exibir duração/contador
  // const formatDuration = (seconds?: number | null) => {
  //   if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  //   const m = Math.floor(seconds / 60);
  //   const s = Math.floor(seconds % 60);
  //   return `${m}:${s.toString().padStart(2, '0')}`;
  // };

  const beautifyKey = (key: string) => {
    // snake_case -> 'Palavra palavra' (primeira letra maiúscula, demais minúsculas)
    const s = key.replace(/_/g, ' ').trim();
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };

  const togglePlayCard = async (id: number, url?: string | null) => {
    if (!url) return;
    // pausa o que estiver tocando
    if (playingId && audioMapRef.has(playingId)) {
      const current = audioMapRef.get(playingId)!;
      current.pause();
      current.currentTime = 0;
    }
    // se o mesmo card foi clicado, pare e desative
    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    let audio = audioMapRef.get(id);
    if (!audio) {
      audio = new Audio(url);
      audio.preload = 'metadata';
      audio.addEventListener('ended', () => {
        setPlayingId(null);
      });
      audioMapRef.set(id, audio);
    }
    await audio.play();
    setPlayingId(id);
  };

  const handleDownloadAudio = async (e: React.MouseEvent, url?: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url) return;

    const nameFromUrl = (() => {
      try {
        const u = new URL(url);
        const path = u.pathname.split('/')
          .filter(Boolean)
          .pop();
        return (path && decodeURIComponent(path)) || 'audio.mp3';
      } catch {
        const parts = url.split('?')[0].split('/');
        return parts[parts.length - 1] || 'audio.mp3';
      }
    })();

    try {
      const resp = await fetch(url, { credentials: 'omit' });
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = nameFromUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      // Fallback para tentar download direto pela URL
      const link = document.createElement('a');
      link.href = url;
      link.download = nameFromUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  // Formatadores para a tabela
  const formatAutorizacao = (autorizacao: string | null) => {
    if (!autorizacao) return { text: '-', class: '' };
    if (autorizacao.toLowerCase().includes('sim')) return { text: 'Sim', class: 'sim' };
    if (autorizacao.toLowerCase().includes('não') || autorizacao.toLowerCase().includes('nao')) {
      return { text: 'Não', class: 'nao' };
    }
    return { text: '-', class: '' };
  };

  const formatDataNascimento = (data: string | null) => {
    if (!data) return '-';
    return data;
  };


  if (isSuperAdmin) {
    return (
      <>
        <Sidebar />
        <div className="app-container app-with-sidebar">
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
                    stroke="#1a9bff" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <h1 className="header-title">Pesquisas Aceitas</h1>
              </div>
            </div>
          </header>

          <main className="main-content" style={{ padding: '1.5rem 2rem' }}>
            {loadingTabela ? (
              <div className="spinner-center"><div className="spinner" /></div>
            ) : pesquisasTabela.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>Nenhuma pesquisa aceita encontrada</p>
              </div>
            ) : (
              <>
                <div className="pesquisas-table-container">
                  <table className="pesquisas-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Cidade</th>
                        <th>Endereço</th>
                        <th>Entrevistadora</th>
                        <th>Nome</th>
                        <th>Aniversário</th>
                        <th>Autorização Contato</th>
                        <th>WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesquisasTabela.map((p: any) => {
                        const autorizacao = formatAutorizacao(p.autorizacao_contato);
                        const dataPesquisa = p.data_pesquisa ? new Date(p.data_pesquisa).toLocaleDateString('pt-BR') : '-';
                        return (
                          <tr key={p.id}>
                            <td>{dataPesquisa}</td>
                            <td>{p.cidade || '-'}</td>
                            <td>{p.endereco || '-'}</td>
                            <td>{p.entrevistadora || '-'}</td>
                            <td>{p.nome_entrevistado || '-'}</td>
                            <td>{formatDataNascimento(p.data_nascimento)}</td>
                            <td>
                              {autorizacao.class ? (
                                <span className={`autorizacao-badge ${autorizacao.class}`}>
                                  {autorizacao.text}
                                </span>
                              ) : (
                                autorizacao.text
                              )}
                            </td>
                            <td>{p.whatsapp || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-controls">
                  <div className="pagination-info">
                    Mostrando {currentPage * adminLimit + 1} - {currentPage * adminLimit + pesquisasTabela.length} pesquisas
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Anterior
                    </button>
                    <span style={{ padding: '8px 16px', color: '#6b7280' }}>
                      Página {currentPage + 1}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={pesquisasTabela.length < adminLimit}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Menu Lateral para Admin/Suporte */}
      {!isPesquisador && <Sidebar />}
      
    <div className={`app-container ${!isPesquisador ? 'app-with-sidebar' : ''}`}>
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
                stroke="#1a9bff" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="header-title">Pesquisas</h1>
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

        {isLoading ? (
          <div className="spinner-center"><div className="spinner" /></div>
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
                        color: '#1a9bff',
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
      </main>

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

      {/* Menu Inferior apenas para Pesquisadores */}
      {isPesquisador && <BottomNav onNavigateHome={onVoltar} />}
    </div>
    </>
  );
};
