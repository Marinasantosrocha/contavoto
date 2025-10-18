import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
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
      <BottomNav />
    </div>
  );
};