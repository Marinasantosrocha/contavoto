import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import '../styles/design-system.css';

interface PoliticaVisualizacao {
  tipo_usuario: string;
  pode_ver_pesquisas: boolean;
  pode_ver_estatisticas: boolean;
  pode_gerenciar_usuarios: boolean;
  pode_gerenciar_formularios: boolean;
  pode_exportar_dados: boolean;
  pode_acessar_relatorios: boolean;
}

export const ConfiguracoesPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Usuário logado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoToId = (t?: string) => t === 'superadmin' ? 5 : t === 'admin' ? 4 : t === 'pesquisador' ? 1 : undefined;
  const tipoUsuarioId: number | undefined = typeof user?.tipo_usuario_id === 'number' ? user.tipo_usuario_id : tipoToId(user?.tipo_usuario);
  const isPesquisador = tipoUsuarioId === 1;
  
  // Tipos de usuário definidos no backend; mantido aqui apenas como referência de UI se necessário

  const [politicas, setPoliticas] = useState<PoliticaVisualizacao[]>([
    {
      tipo_usuario: 'superadmin',
      pode_ver_pesquisas: true,
      pode_ver_estatisticas: true,
      pode_gerenciar_usuarios: true,
      pode_gerenciar_formularios: true,
      pode_exportar_dados: true,
      pode_acessar_relatorios: true,
    },
    {
      tipo_usuario: 'admin',
      pode_ver_pesquisas: true,
      pode_ver_estatisticas: true,
      pode_gerenciar_usuarios: true,
      pode_gerenciar_formularios: true,
      pode_exportar_dados: true,
      pode_acessar_relatorios: false,
    },
    {
      tipo_usuario: 'suporte',
      pode_ver_pesquisas: true,
      pode_ver_estatisticas: true,
      pode_gerenciar_usuarios: false,
      pode_gerenciar_formularios: false,
      pode_exportar_dados: false,
      pode_acessar_relatorios: false,
    },
    {
      tipo_usuario: 'candidato',
      pode_ver_pesquisas: true,
      pode_ver_estatisticas: false,
      pode_gerenciar_usuarios: false,
      pode_gerenciar_formularios: false,
      pode_exportar_dados: false,
      pode_acessar_relatorios: false,
    },
    {
      tipo_usuario: 'pesquisador',
      pode_ver_pesquisas: true,
      pode_ver_estatisticas: false,
      pode_gerenciar_usuarios: false,
      pode_gerenciar_formularios: false,
      pode_exportar_dados: false,
      pode_acessar_relatorios: false,
    },
  ]);

  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [tema, setTema] = useState('claro');
  const [idioma, setIdioma] = useState('pt-BR');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Carregar configurações salvas
    const configs = localStorage.getItem('app-configs');
    if (configs) {
      const parsed = JSON.parse(configs);
      setAutoSync(parsed.autoSync ?? true);
      setNotifications(parsed.notifications ?? true);
      setOfflineMode(parsed.offlineMode ?? true);
      setTema(parsed.tema ?? 'claro');
      setIdioma(parsed.idioma ?? 'pt-BR');
    }
  }, []);

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
      try {
        const { verificarEProcessarAutomaticamente } = await import('../services/syncService');
        await verificarEProcessarAutomaticamente();
      } catch {}
      alert('Sincronização executada.');
    } catch (e: any) {
      alert('Erro na sincronização: ' + (e?.message || String(e)));
    } finally {
      setSyncing(false);
    }
  }

  // Funções de edição de políticas podem ser adicionadas futuramente

  const handleSalvar = () => {
    const configs = {
      autoSync,
      notifications,
      offlineMode,
      tema,
      idioma,
      politicas
    };
    
    localStorage.setItem('app-configs', JSON.stringify(configs));
    alert('✅ Configurações salvas com sucesso!');
  };

  const handleResetar = () => {
    if (confirm('⚠️ Tem certeza que deseja resetar todas as configurações?')) {
      localStorage.removeItem('app-configs');
      setAutoSync(true);
      setNotifications(true);
      setOfflineMode(true);
      setTema('claro');
      setIdioma('pt-BR');
      
      const politicasPadrao = [
        {
          tipo_usuario: 'superadmin',
          pode_ver_pesquisas: true,
          pode_ver_estatisticas: true,
          pode_gerenciar_usuarios: true,
          pode_gerenciar_formularios: true,
          pode_exportar_dados: true,
          pode_acessar_relatorios: true,
        },
        {
          tipo_usuario: 'admin',
          pode_ver_pesquisas: true,
          pode_ver_estatisticas: true,
          pode_gerenciar_usuarios: true,
          pode_gerenciar_formularios: true,
          pode_exportar_dados: true,
          pode_acessar_relatorios: false,
        },
        {
          tipo_usuario: 'suporte',
          pode_ver_pesquisas: true,
          pode_ver_estatisticas: true,
          pode_gerenciar_usuarios: false,
          pode_gerenciar_formularios: false,
          pode_exportar_dados: false,
          pode_acessar_relatorios: false,
        },
        {
          tipo_usuario: 'candidato',
          pode_ver_pesquisas: true,
          pode_ver_estatisticas: false,
          pode_gerenciar_usuarios: false,
          pode_gerenciar_formularios: false,
          pode_exportar_dados: false,
          pode_acessar_relatorios: false,
        },
        {
          tipo_usuario: 'pesquisador',
          pode_ver_pesquisas: true,
          pode_ver_estatisticas: false,
          pode_gerenciar_usuarios: false,
          pode_gerenciar_formularios: false,
          pode_exportar_dados: false,
          pode_acessar_relatorios: false,
        },
      ];
      setPoliticas(politicasPadrao);
      alert('🔄 Configurações resetadas para o padrão!');
    }
  };

  return (
    <>
      {/* Menu Lateral para Admin/Suporte */}
      {!isPesquisador && <Sidebar />}
      
    <div className={`app-container ${!isPesquisador ? 'app-with-sidebar' : ''}`}>
      {/* Header Moderno */}
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={() => navigate('/')}
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
            <h1 className="header-title">Configurações</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Seção Políticas */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Políticas de Visualização</h2>
              <p className="card-subtitle">Configure as permissões por tipo de usuário</p>
            </div>
            
            <div className="modern-list">
              {politicas.map((politica, _index) => (
                <div key={politica.tipo_usuario} className="list-item">
                  <div className="list-item-icon">
                    {politica.tipo_usuario === 'superadmin' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    )}
                    {politica.tipo_usuario === 'admin' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.97C19.47 12.65 19.5 12.33 19.5 12S19.47 11.35 19.43 11L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.66 15.5 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.5 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11C4.53 11.34 4.5 11.67 4.5 12S4.53 12.65 4.57 12.97L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.94C7.96 18.34 8.5 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.5 18.67 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.03 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.97Z"/>
                      </svg>
                    )}
                    {politica.tipo_usuario === 'suporte' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"/>
                      </svg>
                    )}
                    {politica.tipo_usuario === 'candidato' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8 9.79 12 12 12M12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
                      </svg>
                    )}
                    {politica.tipo_usuario === 'pesquisador' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M14 17H7V15H14V17M17 13H7V11H17V13M17 9H7V7H17V9Z"/>
                      </svg>
                    )}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {politica.tipo_usuario.toUpperCase()}
                    </div>
                  </div>
                  <div className="list-item-arrow">›</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seção Sistema */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Sistema</h2>
              <p className="card-subtitle">Configurações gerais do aplicativo</p>
            </div>
            
            <div className="modern-list">
              <div className="list-item">
                <div className="list-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 13.01 17.75 13.97 17.3 14.8L18.76 16.26C19.54 15.03 20 13.57 20 12C20 7.58 16.42 4 12 4M12 18C8.69 18 6 15.31 6 12C6 10.99 6.25 10.03 6.7 9.2L5.24 7.74C4.46 8.97 4 10.43 4 12C4 16.42 7.58 20 12 20V23L16 19L12 15V18Z"/>
                  </svg>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">Sincronização Automática</div>
                  <div className="list-item-subtitle">Sincronizar dados automaticamente</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="list-item">
                <div className="list-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M21 19V20H3V19L5 17V11C5 7.9 7.03 5.17 10 4.29V4C10 2.9 10.9 2 12 2C13.1 2 14 2.9 14 4V4.29C16.97 5.17 19 7.9 19 11V17L21 19M14 21C14 22.1 13.1 23 12 23S10 22.1 10 21"/>
                  </svg>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">Notificações</div>
                  <div className="list-item-subtitle">Receber notificações do sistema</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="list-item">
                <div className="list-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M17 1.01L7 1C5.9 1 5 1.9 5 3V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V3C19 1.9 18.1 1.01 17 1.01M17 19H7V5H17V19M16 13H13V16H11V13H8V11H11V8H13V11H16V13Z"/>
                  </svg>
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">Modo Offline</div>
                  <div className="list-item-subtitle">Permitir uso sem internet</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={offlineMode}
                    onChange={(e) => setOfflineMode(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Personalização */}
        <div className="page-section">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Personalização</h2>
              <p className="card-subtitle">Personalize a aparência do aplicativo</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tema do Aplicativo</label>
              <select 
                className="form-select"
                value={tema} 
                onChange={(e) => setTema(e.target.value)}
              >
                <option value="claro">Claro</option>
                <option value="escuro">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Idioma</label>
              <select 
                className="form-select"
                value={idioma} 
                onChange={(e) => setIdioma(e.target.value)}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="page-section">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary btn-large"
              onClick={handleSalvar}
              style={{ flex: 1 }}
            >
              Salvar
            </button>
            
            <button 
              className="btn btn-secondary btn-large"
              onClick={handleResetar}
              style={{ flex: 1 }}
            >
              Resetar
            </button>
          </div>
        </div>
      </main>

      {/* Menu Inferior apenas para Pesquisadores */}
      {isPesquisador && <BottomNav />}
    </div>
    </>
  );
};