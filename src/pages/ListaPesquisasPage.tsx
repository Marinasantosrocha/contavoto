import { useEffect, useMemo, useState } from 'react';
import { usePesquisas, useDeletarPesquisa } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
import { CustomSelect } from '../components/CustomSelect';

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
  // Admin (Super) - estados
  const [adminFormOptions, setAdminFormOptions] = useState<Array<{value: string, label: string}>>([]);
  const [adminFormSel, setAdminFormSel] = useState<string>('all');
  const [adminPesquisas, setAdminPesquisas] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [adminMapForm, setAdminMapForm] = useState<Record<string, any>>({});
  const [adminMapResp, setAdminMapResp] = useState<Record<string, any>>({});
  const [adminLimit, setAdminLimit] = useState<number>(20);

  // React Query hooks
  const filtroObj = filtro === 'todas' ? undefined : { status: filtro };
  const { data: pesquisas = [], isLoading } = usePesquisas(filtroObj);
  const deletarPesquisa = useDeletarPesquisa();

  // Usuário e papel
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const tipoToId = (t?: string) => t === 'superadmin' ? 5 : t === 'admin' ? 4 : t === 'pesquisador' ? 1 : undefined;
  const tipoUsuarioId: number | undefined = typeof user?.tipo_usuario_id === 'number' ? user.tipo_usuario_id : tipoToId(user?.tipo_usuario);
  const isSuperAdmin = tipoUsuarioId === 5;

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

  // Carregar opções de formulários (somente admin)
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancel = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('formularios').select('id,nome').order('nome');
        if (error) throw error;
        if (cancel) return;
        const opts = [{ value: 'all', label: 'Todos os formulários' }, ...(data || []).map((f: any) => ({ value: f.id, label: f.nome }))];
        setAdminFormOptions(opts);
      } catch (e) {
        setAdminFormOptions([{ value: 'all', label: 'Todos os formulários' }]);
      }
    })();
    return () => { cancel = true; };
  }, [isSuperAdmin]);

  // Carregar pesquisas do servidor + mapear respostas e formulários
  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancel = false;
    (async () => {
      setAdminLoading(true);
      try {
        // 1) Pesquisas (filtradas por formulário se selecionado)
        let query = supabase
          .from('pesquisas')
          .select('id, formulario_id, formulario_nome, endereco, bairro, cidade, entrevistador, iniciada_em, status, audio_url, audio_duracao, respostas_ia, observacoes_ia')
          .order('iniciada_em', { ascending: false })
          .range(0, Math.max(0, adminLimit - 1));
        if (adminFormSel !== 'all') {
          query = query.eq('formulario_id', adminFormSel);
        }
        const { data: pesqData, error: pesqErr } = await query;
        if (pesqErr) throw pesqErr;

        const pesquisasList = pesqData || [];
        const ids = pesquisasList.map((p: any) => p.id);
        const formIds = [...new Set(pesquisasList.map((p: any) => p.formulario_id).filter(Boolean))];

        // 2) Respostas normalizadas
        let respostasMap: Record<string, any> = {};
        if (ids.length) {
          const { data: respData, error: respErr } = await supabase
            .from('respostas_formulario_buritizeiro')
            .select('*')
            .in('pesquisa_id', ids);
          if (respErr) throw respErr;
          for (const r of respData || []) respostasMap[r.pesquisa_id] = r;
        }

        // 3) Formularios (nome já vem junto, mas buscamos metadados extras se precisar)
        let formMap: Record<string, any> = {};
        if (formIds.length) {
          const { data: formsData, error: formsErr } = await supabase
            .from('formularios')
            .select('id,nome,descricao,pre_candidato,telefone_contato')
            .in('id', formIds);
          if (formsErr) throw formsErr;
          for (const f of formsData || []) formMap[f.id] = f;
        }

        if (!cancel) {
          setAdminPesquisas(pesquisasList);
          setAdminMapForm(formMap);
          setAdminMapResp(respostasMap);
        }
      } catch (e) {
        if (!cancel) {
          setAdminPesquisas([]);
        }
      } finally {
        if (!cancel) setAdminLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [isSuperAdmin, adminFormSel, adminLimit]);

  // Resetar limite ao trocar o filtro
  useEffect(() => {
    if (!isSuperAdmin) return;
    setAdminLimit(20);
  }, [adminFormSel, isSuperAdmin]);

  if (isSuperAdmin) {
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
              <h1 className="header-title">Pesquisas</h1>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="page-section">
            <div className="form-group">
              <CustomSelect
                label="Filtrar por formulário"
                options={adminFormOptions}
                value={adminFormSel}
                onChange={(v) => setAdminFormSel((v as string) || 'all')}
              />
            </div>
          </div>

            {adminLoading ? (
              <div className="spinner-center"><div className="spinner" /></div>
            ) : adminPesquisas.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><p>Nenhuma pesquisa encontrada</p></div>
            ) : (
              <div className="pesquisas-grid">
                {adminPesquisas.map((p: any) => {
                  const form = adminMapForm[p.formulario_id] || { nome: p.formulario_nome };
                  return (
                    <div key={p.id} className="pesquisa-card" style={{ padding: 12, position: 'relative' }} onClick={() => setPesquisaSelecionada(p)}>
                      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>{form?.nome || p.formulario_nome}</div>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>{p.endereco}, {p.bairro} - {p.cidade}</div>
                      <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{new Date(p.iniciada_em).toLocaleString('pt-BR')}</span>
                        {p.audio_url && (
                          <button
                            className="play-icon-button"
                            onClick={(e) => { e.stopPropagation(); togglePlayCard(p.id, p.audio_url); }}
                            aria-label={playingId === p.id ? 'Pausar áudio' : 'Reproduzir áudio'}
                          >
                            {playingId === p.id ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                <rect x="6" y="5" width="4" height="14"/>
                                <rect x="14" y="5" width="4" height="14"/>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, width: '100%' }}>
                  <button
                    onClick={() => setAdminLimit((l) => l + 20)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#6b7280',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      fontFamily: 'inherit'
                    }}
                  >
                    Mostrar mais
                  </button>
                </div>
              </div>
            )}
        </main>

        <BottomNav onNavigateHome={onVoltar} />

        {pesquisaSelecionada && (
          <div className="modal-overlay" onClick={() => setPesquisaSelecionada(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalhes da Pesquisa</h2>
                <button onClick={() => setPesquisaSelecionada(null)} className="modal-close-btn" aria-label="Fechar">
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {(() => {
                  const p: any = pesquisaSelecionada as any;
                  const resp = adminMapResp[p.id];
                  return (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Removidos: Formulário, Áudio, descrição, pré-candidato, local, status */}
                      <div className="detail-group"><strong>Entrevistador:</strong><p>{p.entrevistador}</p></div>
                      {/* Respostas normalizadas */}
                      <div className="detail-group">
                        <strong>Respostas:</strong>
                        {resp ? (
                          <div className="respostas-list">
                            {Object.entries(resp)
                              .filter(([k]) => !['id','pesquisa_id','criado_em','atualizado_em','fonte_json','observacao'].includes(k))
                              .map(([k,v]) => (
                              <div key={k} className="resposta-item">
                                <span className="resposta-key">{beautifyKey(k)}:</span>
                                <span className="resposta-value">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#6b7280' }}>Sem respostas normalizadas para esta pesquisa.</p>
                        )}
                      </div>
                      {/* Removido: bloco de JSON bruto respostas_ia */}
                      {p.observacoes_ia && (
                        <div className="detail-group">
                          <strong>observacoes_ia:</strong>
                          <p>{p.observacoes_ia}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
