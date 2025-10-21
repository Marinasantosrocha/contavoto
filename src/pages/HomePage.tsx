import { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useFormularios, useInicializarFormulario } from '../hooks/useFormularios';
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
  onNavigateToPermissions,
  onLogout
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
  const inicializarFormulario = useInicializarFormulario();
  
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

  useEffect(() => {
    // Carregar localização automaticamente se for pesquisador
    if (isPesquisador) {
      carregarLocalizacao();
    }
  }, [isPesquisador]);

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (onLogout) onLogout();
  };

  const handleGoToPermissions = () => {
    if (onNavigateToPermissions) onNavigateToPermissions();
  };

  const handleGoToSettings = () => {
    if (onNavigateToSettings) onNavigateToSettings();
  };

  const handleInicializarFormulario = () => {
    inicializarFormulario.mutate();
  };

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
            
            {/* Menu do Usuário */}
            <div className="user-menu">
              <button className="user-menu-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <div className="user-menu-dropdown">
                <div className="user-menu-item" onClick={handleGoToSettings}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                  Configurações
                </div>
                {isSuperAdmin && (
                  <div className="user-menu-item" onClick={handleGoToPermissions}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01 1.01L12 10.5l-1.99-2.49A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.52.57-1.42 1.37L6.5 16H9v6h2v-6h2v6h2z"/>
                    </svg>
                    Usuários
                  </div>
                )}
                <div className="user-menu-divider"></div>
                <div className="user-menu-item logout" onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Sair
                </div>
              </div>
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
                <label className="form-label">Selecione o Formulário *</label>
                <select
                  className="form-select"
                  value={formularioSelecionado || ''}
                  onChange={(e) => setFormularioSelecionado(Number(e.target.value))}
                  required
                  disabled={loadingFormularios}
                >
                  <option value="">
                    {loadingFormularios ? 'Carregando...' : 'Escolha um formulário...'}
                  </option>
                  {formularios.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.nome}
                    </option>
                  ))}
                </select>
                {formularios.length === 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={handleInicializarFormulario}
                      className="btn btn-secondary btn-small"
                      disabled={inicializarFormulario.isPending}
                    >
                      {inicializarFormulario.isPending ? '⏳ Inicializando...' : '📋 Criar Formulário Modelo'}
                    </button>
                    <small style={{ display: 'block', marginTop: '0.5rem', color: '#6c757d' }}>
                      Nenhum formulário encontrado. Clique para criar o formulário modelo com 38 perguntas.
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
              <div className="text-center">
                <p>Você não tem permissão para criar pesquisas.</p>
                <p>Use o menu abaixo para navegar pelas funcionalidades disponíveis.</p>
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
