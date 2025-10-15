import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/design-system.css';

interface TipoUsuario {
  id: string;
  nome: string;
  descricao: string;
  nivel_permissao: number;
}

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
  const [tiposUsuario] = useState<TipoUsuario[]>([
    { id: '1', nome: 'superadmin', descricao: 'Super Administrador', nivel_permissao: 5 },
    { id: '2', nome: 'admin', descricao: 'Administrador', nivel_permissao: 4 },
    { id: '3', nome: 'suporte', descricao: 'Suporte Técnico', nivel_permissao: 3 },
    { id: '4', nome: 'candidato', descricao: 'Candidato', nivel_permissao: 2 },
    { id: '5', nome: 'pesquisador', descricao: 'Pesquisador', nivel_permissao: 1 },
  ]);

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

  const updatePolitica = (index: number, campo: keyof PoliticaVisualizacao, valor: boolean) => {
    const novasPoliticas = [...politicas];
    novasPoliticas[index] = {
      ...novasPoliticas[index],
      [campo]: valor
    };
    setPoliticas(novasPoliticas);
  };

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
    <div className="app-container">
      {/* Header Moderno */}
      <header className="modern-header">
        <button 
          className="btn btn-ghost btn-small header-back-btn"
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <div className="header-content">
          <div className="header-left">
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
              <h2 className="card-title">🔐 Políticas de Visualização</h2>
              <p className="card-subtitle">Configure as permissões por tipo de usuário</p>
            </div>
            
            <div className="modern-list">
              {politicas.map((politica, index) => (
                <div key={politica.tipo_usuario} className="list-item">
                  <div className="list-item-icon">
                    {politica.tipo_usuario === 'superadmin' && '👑'}
                    {politica.tipo_usuario === 'admin' && '🔧'}
                    {politica.tipo_usuario === 'suporte' && '🛠️'}
                    {politica.tipo_usuario === 'candidato' && '👤'}
                    {politica.tipo_usuario === 'pesquisador' && '📋'}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {politica.tipo_usuario.toUpperCase()}
                    </div>
                    <div className="list-item-subtitle">
                      Nível {tiposUsuario.find(t => t.nome === politica.tipo_usuario)?.nivel_permissao}
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
              <h2 className="card-title">📊 Sistema</h2>
              <p className="card-subtitle">Configurações gerais do aplicativo</p>
            </div>
            
            <div className="modern-list">
              <div className="list-item">
                <div className="list-item-icon">🔄</div>
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
                <div className="list-item-icon">🔔</div>
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
                <div className="list-item-icon">📵</div>
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
              <h2 className="card-title">🎨 Personalização</h2>
              <p className="card-subtitle">Personalize a aparência do aplicativo</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Tema do Aplicativo</label>
              <select 
                className="form-select"
                value={tema} 
                onChange={(e) => setTema(e.target.value)}
              >
                <option value="claro">☀️ Claro</option>
                <option value="escuro">🌙 Escuro</option>
                <option value="auto">🔄 Automático</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Idioma</label>
              <select 
                className="form-select"
                value={idioma} 
                onChange={(e) => setIdioma(e.target.value)}
              >
                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="es-ES">🇪🇸 Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="page-section">
          <button 
            className="btn btn-primary btn-large w-full mb-3"
            onClick={handleSalvar}
          >
            💾 Salvar Configurações
          </button>
          
          <button 
            className="btn btn-secondary btn-large w-full"
            onClick={handleResetar}
          >
            🔄 Resetar para Padrão
          </button>
        </div>
      </main>

      {/* Navegação Inferior */}
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="nav-item" onClick={() => navigate('/')}>
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <div className="nav-label">Home</div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="nav-label">Pesquisas</div>
          </div>
          <div className="nav-item">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01 1.01L12 10.5l-1.99-2.49A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.52.57-1.42 1.37L6.5 16H9v6h2v-6h2v6h2z"/>
              </svg>
            </div>
            <div className="nav-label">Usuários</div>
          </div>
          <div className="nav-item active">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </div>
            <div className="nav-label">Config</div>
          </div>
        </div>
      </nav>
    </div>
  );
};