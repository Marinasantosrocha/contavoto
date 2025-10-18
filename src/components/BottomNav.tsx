import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  onNavigateHome?: () => void;
  onNavigatePesquisas?: () => void;
  onNavigateUsuarios?: () => void;
  onNavigateConfig?: () => void;
}

export const BottomNav = ({ 
  onNavigateHome, 
  onNavigatePesquisas, 
  onNavigateUsuarios, 
  onNavigateConfig 
}: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigate('/');
    }
  };

  const handlePesquisas = () => {
    if (onNavigatePesquisas) {
      onNavigatePesquisas();
    } else {
      navigate('/pesquisas');
    }
  };

  const handleUsuarios = () => {
    if (onNavigateUsuarios) {
      onNavigateUsuarios();
    } else {
      navigate('/permissions');
    }
  };

  const handleConfig = () => {
    if (onNavigateConfig) {
      onNavigateConfig();
    } else {
      navigate('/configuracoes');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-content">
        <div 
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={handleHome}
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div className="nav-label">Home</div>
        </div>
        <div 
          className={`nav-item ${isActive('/pesquisa') ? 'active' : ''}`}
          onClick={handlePesquisas}
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div className="nav-label">Pesquisas</div>
        </div>
        <div 
          className={`nav-item ${isActive('/permissions') ? 'active' : ''}`}
          onClick={handleUsuarios}
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01 1.01L12 10.5l-1.99-2.49A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.52.57-1.42 1.37L6.5 16H9v6h2v-6h2v6h2z"/>
            </svg>
          </div>
          <div className="nav-label">Usuários</div>
        </div>
        <div 
          className={`nav-item ${isActive('/configuracoes') ? 'active' : ''}`}
          onClick={handleConfig}
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </div>
          <div className="nav-label">Config</div>
        </div>
      </div>
    </nav>
  );
};
