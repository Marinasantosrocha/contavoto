import { useEffect, useMemo, useState } from 'react';
import { usePesquisas, useDeletarPesquisa, usePesquisasTabelaTodas } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { SimpleSelect } from '../components/SimpleSelect';
import { supabase } from '../services/supabaseClient';
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
  
  // Filtros da tabela (Admin)
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('todos');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [entrevistadoraSelecionada, setEntrevistadoraSelecionada] = useState<string | null>(null);
  
  // Modal de respostas
  const [pesquisaSelecionadaId, setPesquisaSelecionadaId] = useState<string | null>(null);
  const [respostasModal, setRespostasModal] = useState<any>(null);
  const [loadingRespostas, setLoadingRespostas] = useState(false);
  
  // Buscar TODAS as pesquisas aceitas
  const { data: todasPesquisasTabela = [], isLoading: loadingTabela } = usePesquisasTabelaTodas();
  
  // Log quando os dados carregarem
  useEffect(() => {
    if (todasPesquisasTabela.length > 0) {
      console.log('🎉 Dados carregados do React Query:', todasPesquisasTabela.length, 'pesquisas');
    }
  }, [todasPesquisasTabela]);
  
  // Aplicar filtros no front-end
  const pesquisasFiltradas = useMemo(() => {
    console.log('🔍 Aplicando filtros...');
    console.log('📊 Total de pesquisas:', todasPesquisasTabela.length);
    console.log('📅 Período:', periodoSelecionado);
    console.log('🏙️ Cidade:', cidadeSelecionada);
    console.log('👤 Entrevistadora:', entrevistadoraSelecionada);
    
    let filtered = [...todasPesquisasTabela];
    
    // Filtro de período
    if (periodoSelecionado !== 'todos') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      let dataInicio: Date;
      if (periodoSelecionado === 'hoje') {
        dataInicio = hoje;
      } else if (periodoSelecionado === 'semana') {
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - 7);
      } else { // mes
        dataInicio = new Date(hoje);
        dataInicio.setMonth(hoje.getMonth() - 1);
      }
      
      const antes = filtered.length;
      filtered = filtered.filter(p => {
        const dataPesquisa = new Date(p.data_pesquisa);
        return dataPesquisa >= dataInicio;
      });
      console.log(`  ⏰ Filtro período: ${antes} → ${filtered.length}`);
    }
    
    // Filtro de cidade
    if (cidadeSelecionada) {
      const antes = filtered.length;
      filtered = filtered.filter(p => p.cidade === cidadeSelecionada);
      console.log(`  🏙️ Filtro cidade: ${antes} → ${filtered.length}`);
    }
    
    // Filtro de entrevistadora
    if (entrevistadoraSelecionada) {
      const antes = filtered.length;
      filtered = filtered.filter(p => p.entrevistadora === entrevistadoraSelecionada);
      console.log(`  👤 Filtro entrevistadora: ${antes} → ${filtered.length}`);
    }
    
    console.log('✅ Total filtrado:', filtered.length);
    return filtered;
  }, [todasPesquisasTabela, periodoSelecionado, cidadeSelecionada, entrevistadoraSelecionada]);
  
  // Extrair opções para os filtros
  const opcoesCidades = useMemo(() => {
    const cidades = [...new Set(todasPesquisasTabela.map(p => p.cidade).filter(Boolean))].sort();
    return cidades;
  }, [todasPesquisasTabela]);
  
  const opcoesEntrevistadoras = useMemo(() => {
    const entrevistadoras = [...new Set(todasPesquisasTabela.map(p => p.entrevistadora).filter(Boolean))].sort();
    return entrevistadoras;
  }, [todasPesquisasTabela]);
  
  // Aplicar paginação nas pesquisas filtradas
  const pesquisasTabela = useMemo(() => {
    const inicio = currentPage * adminLimit;
    const fim = inicio + adminLimit;
    const paginadas = pesquisasFiltradas.slice(inicio, fim);
    
    console.log('📄 Paginação:');
    console.log('  Página atual:', currentPage + 1);
    console.log('  Registros por página:', adminLimit);
    console.log('  Início:', inicio);
    console.log('  Fim:', fim);
    console.log('  Total filtrado:', pesquisasFiltradas.length);
    console.log('  Exibindo:', paginadas.length);
    console.log('  Total de páginas:', Math.ceil(pesquisasFiltradas.length / adminLimit));
    
    return paginadas;
  }, [pesquisasFiltradas, currentPage, adminLimit]);
  
  // Resetar paginação quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(0);
  }, [periodoSelecionado, cidadeSelecionada, entrevistadoraSelecionada]);

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

  // Função para buscar respostas da pesquisa
  const buscarRespostas = async (pesquisaId: string) => {
    setLoadingRespostas(true);
    setPesquisaSelecionadaId(pesquisaId);
    
    try {
      const { data, error } = await supabase
        .from('respostas_formulario_buritizeiro')
        .select('*')
        .eq('pesquisa_id', pesquisaId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar respostas:', error);
        setRespostasModal(null);
      } else {
        setRespostasModal(data);
      }
    } catch (err) {
      console.error('Erro:', err);
      setRespostasModal(null);
    } finally {
      setLoadingRespostas(false);
    }
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setPesquisaSelecionadaId(null);
    setRespostasModal(null);
  };

  // Função para formatar nome dos campos
  const formatarCampo = (campo: string): string => {
    const mapa: Record<string, string> = {
      tempo_moradia: 'Tempo de Moradia',
      pavimentacao: 'Pavimentação',
      estradas: 'Estradas',
      limpeza_urbana: 'Limpeza Urbana',
      iluminacao_publica: 'Iluminação Pública',
      atendimento_saude: 'Atendimento de Saúde',
      acesso_saude: 'Acesso à Saúde',
      educacao: 'Educação',
      seguranca_publica: 'Segurança Pública',
      problema_cidade: 'Problema da Cidade',
      area_avanco: 'Área que Precisa Avançar',
      voz_em_brasilia: 'Voz em Brasília',
      melhoria_com_representante: 'Melhoria com Representante',
      prioridade_deputado: 'Prioridade do Deputado',
      autorizacao_contato: 'Autorização de Contato',
      whatsapp: 'WhatsApp',
      observacao: 'Observação',
      conhece_deputado_federal: 'Conhece Deputado Federal',
      deputado_renda_municipal: 'Deputado e Renda Municipal',
      importancia_deputado: 'Importância do Deputado'
    };
    return mapa[campo] || campo;
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
            {/* Filtros */}
            <div className="dashboard-filters-row" style={{ marginBottom: '1.5rem' }}>
              <SimpleSelect
                label="Período de Análise"
                options={[
                  { value: 'hoje', label: 'Hoje' },
                  { value: 'semana', label: 'Últimos 7 dias' },
                  { value: 'mes', label: 'Últimos 30 dias' },
                  { value: 'todos', label: 'Todos os períodos' }
                ]}
                value={periodoSelecionado}
                onChange={(value) => {
                  setPeriodoSelecionado(value as string);
                  setCidadeSelecionada(null);
                  setEntrevistadoraSelecionada(null);
                }}
              />

              <SimpleSelect
                label="Cidade"
                options={[
                  { value: '', label: 'Todas as Cidades' },
                  ...opcoesCidades.map(c => ({ value: c, label: c }))
                ]}
                value={cidadeSelecionada || ''}
                onChange={(value) => {
                  setCidadeSelecionada((value as string) || null);
                  setEntrevistadoraSelecionada(null);
                }}
              />

              <SimpleSelect
                label="Entrevistadora"
                options={[
                  { value: '', label: 'Todas as Entrevistadoras' },
                  ...opcoesEntrevistadoras.map(e => ({ value: e, label: e }))
                ]}
                value={entrevistadoraSelecionada || ''}
                onChange={(value) => setEntrevistadoraSelecionada((value as string) || null)}
              />
            </div>

            {loadingTabela ? (
              <div className="spinner-center"><div className="spinner" /></div>
            ) : pesquisasTabela.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>Nenhuma pesquisa aceita encontrada com os filtros selecionados</p>
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
                        <th style={{ textAlign: 'center' }}>Aut. Contato</th>
                        <th>WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesquisasTabela.map((p: any) => {
                        const autorizacao = formatAutorizacao(p.autorizacao_contato);
                        const dataPesquisa = p.data_pesquisa ? new Date(p.data_pesquisa).toLocaleDateString('pt-BR') : '-';
                        return (
                          <tr 
                            key={p.id} 
                            onClick={() => buscarRespostas(p.id)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <td>{dataPesquisa}</td>
                            <td>{p.cidade || '-'}</td>
                            <td>{p.endereco || '-'}</td>
                            <td>{p.entrevistadora || '-'}</td>
                            <td>{p.nome_entrevistado || '-'}</td>
                            <td>{formatDataNascimento(p.data_nascimento)}</td>
                            <td style={{ textAlign: 'center' }}>
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

                <div className="pagination-controls" style={{ 
                  background: 'white', 
                  borderTop: '2px solid #1a9bff',
                  padding: '20px'
                }}>
                  <div className="pagination-info" style={{ 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#1f2937' 
                  }}>
                    📄 Mostrando registros {currentPage * adminLimit + 1} - {Math.min(currentPage * adminLimit + pesquisasTabela.length, pesquisasFiltradas.length)} de {pesquisasFiltradas.length} pesquisas
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      className="pagination-btn" 
                      onClick={() => {
                        console.log('⬅️ Página anterior');
                        setCurrentPage(p => Math.max(0, p - 1));
                      }}
                      disabled={currentPage === 0}
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '10px 20px'
                      }}
                    >
                      ⬅️ Anterior
                    </button>
                    <span style={{ 
                      padding: '10px 20px', 
                      color: '#1a9bff',
                      fontSize: '15px',
                      fontWeight: '700',
                      background: '#e0f2fe',
                      borderRadius: '6px'
                    }}>
                      Página {currentPage + 1} / {Math.ceil(pesquisasFiltradas.length / adminLimit)}
                    </span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => {
                        console.log('➡️ Próxima página');
                        setCurrentPage(p => p + 1);
                      }}
                      disabled={(currentPage + 1) * adminLimit >= pesquisasFiltradas.length}
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        padding: '10px 20px'
                      }}
                    >
                      Próxima ➡️
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>

          {/* Modal de Respostas */}
          {pesquisaSelecionadaId && (
            <div className="modal-overlay" onClick={fecharModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="modal-header">
                  <h2>Respostas da Pesquisa</h2>
                  <button onClick={fecharModal} className="modal-close-btn" aria-label="Fechar">
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  {loadingRespostas ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div className="spinner" />
                      <p>Carregando respostas...</p>
                    </div>
                  ) : respostasModal ? (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {Object.entries(respostasModal)
                        .filter(([key]) => !['id', 'pesquisa_id', 'criado_em', 'atualizado_em', 'nome_morador', 'faixa_etaria'].includes(key))
                        .filter(([, value]) => value !== null && value !== '')
                        .sort(([keyA], [keyB]) => {
                          // Coloca "observacao" por último
                          if (keyA === 'observacao') return 1;
                          if (keyB === 'observacao') return -1;
                          return 0;
                        })
                        .map(([key, value]) => (
                          <div key={key} className="detail-group" style={{ 
                            padding: '12px',
                            background: '#f9fafb',
                            borderRadius: '6px',
                            borderLeft: '3px solid #1a9bff'
                          }}>
                            <strong style={{ color: '#1f2937', display: 'block', marginBottom: '6px' }}>
                              {formatarCampo(key)}:
                            </strong>
                            <p style={{ margin: 0, color: '#4b5563' }}>
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </p>
                          </div>
                        ))}
                      {Object.entries(respostasModal).filter(([key]) => !['id', 'pesquisa_id', 'criado_em', 'atualizado_em', 'nome_morador', 'faixa_etaria'].includes(key)).filter(([, value]) => value !== null && value !== '').length === 0 && (
                        <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                          Nenhuma resposta disponível para esta pesquisa.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#ef4444', padding: '2rem' }}>
                      Erro ao carregar respostas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
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
