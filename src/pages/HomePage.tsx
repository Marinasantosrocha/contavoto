import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useFormularios } from '../hooks/useFormularios';
import { CustomSelect } from '../components/CustomSelect';
import { useEstatisticasPesquisas, useCriarPesquisa } from '../hooks/usePesquisas';
import { BottomNav } from '../components/BottomNav';
import '../styles/design-system.css';
import { testarConexaoGemini, listarModelos } from '../services/geminiService';

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
  const { data: formularios = [], isLoading: loadingFormularios } = useFormularios();
  const { data: estatisticas } = useEstatisticasPesquisas(isPesquisador ? usuarioId : undefined);
  const criarPesquisa = useCriarPesquisa();
  
  // Estados locais
  const [formularioSelecionado, setFormularioSelecionado] = useState<number | null>(null);
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [semNumero, setSemNumero] = useState(false);
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [localizacaoCarregando, setLocalizacaoCarregando] = useState(false);
  const isOnline = useOnlineStatus();
  // Estado do teste Gemini
  const [geminiTestando, setGeminiTestando] = useState(false);
  const [geminiOk, setGeminiOk] = useState<boolean | null>(null);
  const [geminiLatenciaMs, setGeminiLatenciaMs] = useState<number | null>(null);
  const [modelos, setModelos] = useState<string[] | null>(null);
  const [listandoModelos, setListandoModelos] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendenciasCount, setPendenciasCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar localização automaticamente se for pesquisador
    if (isPesquisador) {
      carregarLocalizacao();
    }
  }, [isPesquisador]);

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
                setBairro(bdcData.principalSubdivision || bdcData.district || bdcData.localityInfo?.administrative?.[1]?.name || 'Bairro não encontrado');
                setCidade(bdcData.city || bdcData.locality || bdcData.localityInfo?.administrative?.[2]?.name || 'Cidade não encontrada');
              } else {
                throw new Error('BigDataCloud sem dados úteis');
              }
            } catch (bdcError) {
              console.log('BigDataCloud falhou, tentando Nominatim...');

              // Segunda tentativa: Nominatim (pode falhar por CORS; usado apenas como fallback)
              try {
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
                  setBairro(addr.suburb || addr.neighbourhood || addr.quarter || addr.village || 'Bairro não encontrado');
                  setCidade(addr.city || addr.town || addr.municipality || addr.county || 'Cidade não encontrada');
                } else {
                  throw new Error('Nominatim sem dados úteis');
                }
              } catch (nominatimError) {
                console.warn('Não foi possível obter endereço automaticamente. Preencha manualmente.');
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
    } finally {
      setLocalizacaoCarregando(false);
    }
  };

  const handleListarModelos = async () => {
    setListandoModelos(true);
    setModelos(null);
    try {
      const nomes = await listarModelos();
      setModelos(nomes);
    } catch (e) {
      console.error('Falha ao listar modelos:', e);
      setModelos([`Erro: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setListandoModelos(false);
    }
  };

  const handleIniciar = async () => {
    if (!formularioSelecionado || !endereco || !bairro || !cidade) {
      alert('Aguarde a localização ser carregada ou preencha os campos manualmente!');
      return;
    }

    try {
      const enderecoCompleto = numero ? `${endereco}, ${numero}` : endereco;
      
      const pesquisaId = await criarPesquisa.mutateAsync({
        formularioId: formularioSelecionado,
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
    if (onNavigateToSettings) onNavigateToSettings();
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

  // Removido: criação de formulário modelo local (usar Supabase)

  const handleTestarGemini = async () => {
    setGeminiTestando(true);
    setGeminiOk(null);
    setGeminiLatenciaMs(null);
    const inicio = Date.now();
    try {
      const ok = await testarConexaoGemini();
      const fim = Date.now();
      setGeminiLatenciaMs(fim - inicio);
      setGeminiOk(ok);
    } catch (e) {
      const fim = Date.now();
      setGeminiLatenciaMs(fim - inicio);
      setGeminiOk(false);
      console.error('Falha no teste do Gemini:', e);
    } finally {
      setGeminiTestando(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Simples */}
  <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Olá, {nomeEntrevistador}</h1>
          </div>
          <div className="header-actions">
            {/* Status Online/Offline */}
            <div className="status-indicator">
              <div className={`status-dot ${isOnline ? 'online' : 'offline'}`}></div>
            </div>
            
            {/* Avatar do Usuário */}
            <div 
              className="user-avatar" 
              onClick={handleGoToSettings}
              style={{ 
                cursor: 'pointer',
                marginLeft: '12px'
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

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Seção de Estatísticas */}
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

        {/* Seção Nova Pesquisa - Apenas para Pesquisadores */}
        {isPesquisador && (
          <div className="page-section">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Nova Pesquisa</h2>
                <p className="card-subtitle">Preencha os dados para iniciar uma nova pesquisa</p>
              </div>

              <div className="form-group">
                <CustomSelect
                  label="Selecione o Formulário *"
                  options={[
                    { value: '', label: loadingFormularios ? 'Carregando...' : 'Escolha um formulário...' },
                    ...formularios
                      .filter((form) => typeof form.id === 'number')
                      .map((form) => ({ value: form.id as number, label: form.nome }))
                  ]}
                  value={formularioSelecionado ?? ''}
                  onChange={(v) => setFormularioSelecionado(v ? Number(v) : null)}
                />
                {formularios.length === 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <small style={{ display: 'block', color: '#dc3545' }}>
                      Nenhum formulário encontrado. Conecte-se à internet para baixar do Supabase.
                    </small>
                  </div>
                )}
              </div>

              {formularioSelecionado && (
                <div className="page-section">
                  <div className="form-group">
                    <label className="form-label">📍 Localização Atual</label>
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
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
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
                        <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>S/N</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        placeholder={localizacaoCarregando ? 'Carregando...' : 'Número da casa'}
                        disabled={semNumero}
                        style={{ flex: 1, opacity: semNumero ? 0.5 : 1 }}
                      />
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

                  <div className="form-group" style={{ textAlign: 'right' }}>
                    <button
                      onClick={carregarLocalizacao}
                      className="btn btn-ghost btn-small"
                      disabled={localizacaoCarregando}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#20B2AA',
                        padding: '0.5rem 0',
                        fontSize: '0.9rem',
                        textDecoration: 'none'
                      }}
                    >
                      {localizacaoCarregando ? 'Carregando...' : 'Atualizar Localização'}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleIniciar}
                className="btn btn-primary btn-large w-full"
                disabled={!formularioSelecionado || criarPesquisa.isPending || localizacaoCarregando}
              >
                {criarPesquisa.isPending ? '⏳ Criando...' : 'Iniciar Pesquisa'}
              </button>
            </div>
          </div>
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

        {/* Seção de Ações */}
        <div className="page-section">
          <div className="modern-list">
            <div className="list-item" onClick={onVerPesquisas}>
              <div className="list-item-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="list-item-content">
                <div className="list-item-title">Ver Pesquisas Realizadas</div>
                <div className="list-item-subtitle">Histórico completo das pesquisas</div>
              </div>
              <div className="list-item-arrow">›</div>
            </div>

            {onNavigateToDashboard && (
              <div className="list-item" onClick={onNavigateToDashboard}>
                <div className="list-item-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">Dashboard de Análise</div>
                  <div className="list-item-subtitle">Estatísticas e relatórios detalhados</div>
                </div>
                <div className="list-item-arrow">›</div>
              </div>
            )}
          </div>
        </div>

        {/* Teste rápido do Gemini (IA) */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">⚙️ Teste do Gemini (IA)</h2>
              <p className="card-subtitle">Verifique se a chave VITE_GEMINI_API_KEY está ativa e a API responde</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={handleTestarGemini}
                disabled={geminiTestando}
              >
                {geminiTestando ? '⏳ Testando…' : '▶️ Testar conexão'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleListarModelos}
                disabled={listandoModelos}
              >
                {listandoModelos ? '⏳ Listando modelos…' : '📜 Listar modelos'}
              </button>
              {geminiOk === true && (
                <span style={{ color: '#198754', fontWeight: 600 }}>
                  ✅ Conectado {geminiLatenciaMs != null ? `(${geminiLatenciaMs} ms)` : ''}
                </span>
              )}
              {geminiOk === false && (
                <span style={{ color: '#dc3545', fontWeight: 600 }}>
                  ❌ Falhou {geminiLatenciaMs != null ? `(${geminiLatenciaMs} ms)` : ''}
                </span>
              )}
              {geminiOk === null && !geminiTestando && (
                <span style={{ color: '#6c757d' }}>Sem teste realizado ainda</span>
              )}
            </div>
            {modelos && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '6px' }}>
                  Modelos retornados pela API para sua chave:
                </div>
                <ul style={{ maxHeight: 160, overflow: 'auto', paddingLeft: 16 }}>
                  {modelos.map((m, i) => (
                    <li key={i} style={{ fontFamily: 'monospace' }}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navegação Inferior */}
      <BottomNav 
        onNavigatePesquisas={onVerPesquisas}
        onNavigateDashboard={onNavigateToDashboard}
      />
    </div>
  );
};
