import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useFormularios } from '../hooks/useFormularios';
import { useEstatisticasPesquisas, useCriarPesquisa } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
import '../styles/design-system.css';

interface HomePageProps {
  onIniciarPesquisa: (formularioId: number) => void;
  onVerPesquisas: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPermissions?: () => void;
  onLogout?: () => void;
}

export const HomePage = ({ 
  onIniciarPesquisa, 
  onVerPesquisas,
  onNavigateToDashboard,
  onNavigateToSettings,
  onNavigateToPermissions: _onNavigateToPermissions,
  onLogout: _onLogout
}: HomePageProps) => {
  
  // Obter dados do usuário logado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const nomeEntrevistador = user.nome || 'Usuário';
  const usuarioId = user.id;
  
  // Suporta tanto id numérico quanto nome do tipo de usuário salvo
  const mapTipoToId = (tipo: string | undefined): number | undefined => {
    switch (tipo) {
      case 'pesquisador': return 1;
      case 'candidato': return 2;
      case 'suporte': return 3;
      case 'admin': return 4;
      case 'superadmin': return 5;
      default: return undefined;
    }
  };
  const tipoUsuarioId: number | undefined = typeof user.tipo_usuario_id === 'number'
    ? user.tipo_usuario_id
    : mapTipoToId(user.tipo_usuario);
  const isPesquisador = tipoUsuarioId === 1; // ID do pesquisador
  const isSuperAdmin = tipoUsuarioId === 5; // ID do superadmin
  
  // React Query hooks - filtrar por usuário se for pesquisador
  const { data: formularios = [] } = useFormularios();
  const { data: estatisticas } = useEstatisticasPesquisas(isPesquisador ? usuarioId : undefined);
  const criarPesquisa = useCriarPesquisa();
  
  // Estados locais
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [semNumero, setSemNumero] = useState(false);
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [localizacaoCarregando, setLocalizacaoCarregando] = useState(false);
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [pendenciasCount, setPendenciasCount] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fallback offline: reutiliza último endereço geocodificado com sucesso
  const salvarEnderecoLocal = (dados: { endereco: string; numero?: string; bairro: string; cidade: string }) => {
    const payload = {
      ...dados,
      timestamp: Date.now(),
    };
    try { localStorage.setItem('lastKnownAddress', JSON.stringify(payload)); } catch {}
  };

  const carregarEnderecoLocal = (): { endereco: string; numero?: string; bairro: string; cidade: string } | null => {
    try {
      const raw = localStorage.getItem('lastKnownAddress');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    // Carregar localização automaticamente quando mostrar o formulário
    if (isPesquisador && mostrarFormulario && !endereco) {
      carregarLocalizacao();
    }
  }, [isPesquisador, mostrarFormulario]);

  // Carrega contador de transcrições pendentes para superadmin
  useEffect(() => {
    let cancel = false;
    async function carregarPendencias() {
      if (!isSuperAdmin) return;
      try {
        // Conta direto na fila de transcrição: pendente + processando
        const { count, error } = await supabase
          .from('transcription_jobs')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pendente', 'processando']);
        if (!cancel) {
          setPendenciasCount(error ? null : (count ?? 0));
        }
      } catch {
        if (!cancel) setPendenciasCount(null);
      }
    }
    carregarPendencias();
    const id = setInterval(carregarPendencias, 15000);
    return () => { cancel = true; clearInterval(id); };
  }, [isSuperAdmin]);

  const carregarLocalizacao = async () => {
    setLocalizacaoCarregando(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Tentar múltiplas APIs de geocodificação
            try {
              if (!navigator.onLine) {
                // Offline: não geocodificar; tenta usar endereço salvo
                const salvo = carregarEnderecoLocal();
                if (salvo) {
                  setEndereco(salvo.endereco);
                  setNumero(salvo.numero || '');
                  setBairro(salvo.bairro);
                  setCidade(salvo.cidade);
                }
                return;
              }
              // Primeira tentativa: BigDataCloud (evita CORS do Nominatim)
              const bdcResponse = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt-BR`
              );
              const bdcData = await bdcResponse.json();

              if (bdcData && (bdcData.streetName || bdcData.city || bdcData.locality)) {
                const numeroCasa = bdcData.streetNumber || '';
                const rua = bdcData.streetName || bdcData.locality || '';

                setEndereco(rua || 'Endereço não encontrado');
                setNumero(numeroCasa);

                if (numeroCasa) {
                  console.log('Número detectado automaticamente:', numeroCasa);
                } else {
                  console.log('Número não detectado - usuário deve preencher manualmente');
                }
                const bairroLocal = bdcData.principalSubdivision || bdcData.district || bdcData.localityInfo?.administrative?.[1]?.name || 'Bairro não encontrado';
                const cidadeLocal = bdcData.city || bdcData.locality || bdcData.localityInfo?.administrative?.[2]?.name || 'Cidade não encontrada';
                setBairro(bairroLocal);
                setCidade(cidadeLocal);
                // Persistir para uso offline
                salvarEnderecoLocal({ endereco: rua || 'Endereço não encontrado', numero: numeroCasa, bairro: bairroLocal, cidade: cidadeLocal });
              } else {
                throw new Error('BigDataCloud sem dados úteis');
              }
            } catch (bdcError) {
              console.log('BigDataCloud falhou, tentando Nominatim...');

              // Segunda tentativa: Nominatim (pode falhar por CORS; usado apenas como fallback)
              try {
                if (!navigator.onLine) {
                  const salvo = carregarEnderecoLocal();
                  if (salvo) {
                    setEndereco(salvo.endereco);
                    setNumero(salvo.numero || '');
                    setBairro(salvo.bairro);
                    setCidade(salvo.cidade);
                  }
                  return;
                }
                const nominatimResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR,pt,en`
                );
                const nominatimData = await nominatimResponse.json();

                if (nominatimData.address) {
                  const addr = nominatimData.address;
                  const numeroCasa = addr.house_number || '';
                  const rua = addr.road || addr.street || addr.pedestrian || '';

                  setEndereco(rua || 'Endereço não encontrado');
                  setNumero(numeroCasa);
                  if (numeroCasa) {
                    console.log('Número detectado automaticamente (Nominatim):', numeroCasa);
                  }
                  const bairroLocal = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || 'Bairro não encontrado';
                  const cidadeLocal = addr.city || addr.town || addr.municipality || addr.county || 'Cidade não encontrada';
                  setBairro(bairroLocal);
                  setCidade(cidadeLocal);
                  // Persistir para uso offline
                  salvarEnderecoLocal({ endereco: rua || 'Endereço não encontrado', numero: numeroCasa, bairro: bairroLocal, cidade: cidadeLocal });
                } else {
                  throw new Error('Nominatim sem dados úteis');
                }
              } catch (nominatimError) {
                console.warn('Não foi possível obter endereço automaticamente. Preencha manualmente.');
                // Tentar último endereço salvo como fallback
                const salvo = carregarEnderecoLocal();
                if (salvo) {
                  setEndereco(salvo.endereco);
                  setNumero(salvo.numero || '');
                  setBairro(salvo.bairro);
                  setCidade(salvo.cidade);
                }
              }
            }
          },
          (error) => {
            console.error('Erro de geolocalização:', error);
            let errorMessage = 'Erro ao obter localização';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Permissão de localização negada';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Localização não disponível';
                break;
              case error.TIMEOUT:
                errorMessage = 'Timeout ao obter localização';
                break;
            }
            
            setCidade(errorMessage);
            setBairro(errorMessage);
            setEndereco(errorMessage);
            setNumero('');
            // Fallback para último endereço salvo
            const salvo = carregarEnderecoLocal();
            if (salvo) {
              setEndereco(salvo.endereco);
              setNumero(salvo.numero || '');
              setBairro(salvo.bairro);
              setCidade(salvo.cidade);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
          }
        );
      } else {
        setCidade('Geolocalização não suportada pelo navegador');
        setBairro('Geolocalização não suportada pelo navegador');
        setEndereco('Geolocalização não suportada pelo navegador');
        setNumero('');
      }
    } catch (error) {
      console.error('Erro ao carregar localização:', error);
      setCidade('Erro ao carregar localização');
      setBairro('Erro ao carregar localização');
      setEndereco('Erro ao carregar localização');
      setNumero('');
      // Fallback para último endereço salvo
      const salvo = carregarEnderecoLocal();
      if (salvo) {
        setEndereco(salvo.endereco);
        setNumero(salvo.numero || '');
        setBairro(salvo.bairro);
        setCidade(salvo.cidade);
      }
    } finally {
      setLocalizacaoCarregando(false);
    }
  };

  const handleIniciar = async () => {
    if (!endereco || !bairro || !cidade) {
      alert('Aguarde a localização ser carregada ou preencha os campos manualmente!');
      return;
    }

    // Como só temos um formulário, usa o primeiro disponível
    const formularioId = formularios.length > 0 ? formularios[0].id as number : null;
    
    if (!formularioId) {
      alert('Nenhum formulário disponível. Conecte-se à internet para sincronizar.');
      return;
    }

    try {
      const enderecoCompleto = numero ? `${endereco}, ${numero}` : endereco;
      
      const pesquisaId = await criarPesquisa.mutateAsync({
        formularioId,
        entrevistador: nomeEntrevistador,
        endereco: enderecoCompleto,
        bairro,
        cidade,
      });

      onIniciarPesquisa(pesquisaId);
    } catch (error) {
      console.error('Erro ao criar pesquisa:', error);
      alert('Erro ao criar pesquisa. Tente novamente.');
    }
  };

  // Removidos handlers não utilizados para evitar erros de compilação (noUnusedLocals)

  const handleGoToSettings = () => {
    navigate('/perfil');
  };

  async function executarSincronizacao() {
    if (!navigator.onLine) {
      alert('Você está offline. Conecte-se à internet para sincronizar.');
      return;
    }
    setSyncing(true);
    try {
      try {
        const { processMediaQueueOnce } = await import('../services/mediaQueue');
        await processMediaQueueOnce();
      } catch {}
      const { PesquisaService } = await import('../services/pesquisaService');
      await PesquisaService.sincronizar();
      // IA apenas para superadmin
      if (isSuperAdmin) {
        try {
          const { verificarEProcessarAutomaticamente } = await import('../services/syncService');
          await verificarEProcessarAutomaticamente();
        } catch {}
      }
      alert('Sincronização executada.');
    } catch (e: any) {
      alert('Erro na sincronização: ' + (e?.message || String(e)));
    } finally {
      setSyncing(false);
    }
  }

  // Saudações rotativas para pesquisadores
  const saudacoes = [
    `Até agora você entrevistou ${estatisticas?.total || 0} pessoas.\nCada resposta conta!`,
    `Você já completou ${estatisticas?.total || 0} entrevistas.\nContinue assim!`,
    `Você já registrou ${estatisticas?.total || 0} entrevistas.\nExcelente trabalho!`,
    `Parabéns!\nVocê já ajudou a coletar dados de ${estatisticas?.total || 0} pessoas.`,
    `Você está arrasando!\nAté agora, ${estatisticas?.total || 0} entrevistas concluídas.`,
    `Vamos lá! Cada entrevista é importante.\nVocê já completou ${estatisticas?.total || 0}.`,
    `Ótimo progresso!\n${estatisticas?.total || 0} pessoas já foram entrevistadas por você.`,
    `Vamos juntos!\nSua contribuição até agora: ${estatisticas?.total || 0} entrevistas.`,
    `Cada resposta conta!\nAté agora: ${estatisticas?.total || 0} pessoas entrevistadas.`,
    `Você está fazendo a diferença!\nJá registrou ${estatisticas?.total || 0} entrevistas.`,
    `Bom trabalho!\nAté agora, você completou ${estatisticas?.total || 0} entrevistas. Continue firme!`,
    `Mantenha o ritmo!\n${estatisticas?.total || 0} entrevistas já foram concluídas.`,
    `Seu progresso é de: ${estatisticas?.total || 0} entrevistas.\nCada uma importa!`,
    `Uau! Você já entrevistou ${estatisticas?.total || 0} pessoas.\nContinue ajudando a pesquisa a crescer!`,
  ];

  const [saudacaoAtual] = useState(() => {
    const randomIndex = Math.floor(Math.random() * saudacoes.length);
    return saudacoes[randomIndex];
  });

  return (
    <div className="app-container">
      {/* Header Simples */}
      {!mostrarFormulario && (
        <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Olá, {nomeEntrevistador}</h1>
          </div>
          <div className="header-actions">
            {/* Avatar do Usuário */}
            <div 
              className="user-avatar" 
              onClick={handleGoToSettings}
              style={{ 
                cursor: 'pointer'
              }}
            >
              {user.foto_url ? (
                <img 
                  src={user.foto_url} 
                  alt={nomeEntrevistador}
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #20B2AA'
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#20B2AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '2px solid #20B2AA'
                }}>
                  {nomeEntrevistador.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Seção de Saudação para Pesquisadores */}
        {isPesquisador && !mostrarFormulario && (
          <div className="page-section" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '120px',
            padding: '2rem 1rem'
          }}>
            <p style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#000000',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: '1.6',
              margin: 0,
              whiteSpace: 'pre-line'
            }}>
              {saudacaoAtual}
            </p>
          </div>
        )}

        {/* Seção de Estatísticas - Apenas para NÃO Pesquisadores */}
        {!isPesquisador && (
          <div className="page-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{estatisticas?.total || 0}</div>
                <div className="stat-label">Total de Pesquisas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{estatisticas?.finalizadas || 0}</div>
                <div className="stat-label">Finalizadas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{estatisticas?.emAndamento || 0}</div>
                <div className="stat-label">Em Andamento</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{estatisticas?.naoSincronizadas || 0}</div>
                <div className="stat-label">Não Sincronizadas</div>
              </div>
            </div>
          </div>
        )}

        {/* Seção Nova Pesquisa - Apenas para Pesquisadores */}
        {isPesquisador && (
          <>
            {!mostrarFormulario ? (
              <div className="page-section" style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setMostrarFormulario(true)}
                  className="btn btn-primary btn-large"
                  disabled={formularios.length === 0}
                  style={{ maxWidth: '300px', width: '100%' }}
                >
                  Iniciar Pesquisa
                </button>
              </div>
            ) : (
              <div className="page-section">
                <div className="card">
                  <div className="page-section">
                    <div className="form-group">
                      <label className="form-label">Localização</label>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Endereço *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder={localizacaoCarregando ? 'Carregando localização...' : 'Rua, Avenida, etc.'}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          placeholder={localizacaoCarregando ? 'Carregando...' : 'Número da casa'}
                          disabled={semNumero}
                          style={{ width: '150px', opacity: semNumero ? 0.5 : 1 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={semNumero}
                            onChange={(e) => {
                              setSemNumero(e.target.checked);
                              if (e.target.checked) {
                                setNumero('');
                              }
                            }}
                            style={{ margin: 0 }}
                          />
                          <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>Sem número</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Bairro *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          placeholder={localizacaoCarregando ? 'Carregando...' : 'Nome do bairro'}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Cidade *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          placeholder={localizacaoCarregando ? 'Carregando...' : 'Nome da cidade'}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      onClick={handleIniciar}
                      className="btn btn-primary"
                      style={{ minWidth: '140px', padding: '0.7rem 1.5rem' }}
                      disabled={
                        criarPesquisa.isPending || 
                        localizacaoCarregando || 
                        !endereco.trim() || 
                        !bairro.trim() || 
                        !cidade.trim() || 
                        (!semNumero && !numero.trim())
                      }
                    >
                      {criarPesquisa.isPending ? 'Carregando' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Mensagem para usuários não-pesquisadores */}
        {!isPesquisador && (
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">👋 Bem-vindo, {nomeEntrevistador}!</h2>
                <p className="card-subtitle">
                  {tipoUsuarioId === 5 && 'Super Administrador - Acesso total ao sistema'}
                  {tipoUsuarioId === 4 && 'Administrador - Gerenciamento completo'}
                  {tipoUsuarioId === 3 && 'Suporte Técnico - Acesso limitado'}
                  {tipoUsuarioId === 2 && 'Candidato - Visualização de dados'}
                </p>
              </div>
              <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <button className="btn" onClick={executarSincronizacao} disabled={syncing || !navigator.onLine}>
                  {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
                </button>
                <p className="muted" style={{ margin: 0 }}>Processa uploads pendentes e atualiza dados.</p>
                {isSuperAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge">Pendências de transcrição: {pendenciasCount ?? '—'}</span>
                    <button className="btn btn-ghost" onClick={() => navigate('/transcricoes')}>Abrir fila</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Navegação Inferior - Apenas para NÃO Pesquisadores */}
      {!isPesquisador && (
        <BottomNav 
          onNavigatePesquisas={onVerPesquisas}
          onNavigateDashboard={onNavigateToDashboard}
        />
      )}
    </div>
  );
};
