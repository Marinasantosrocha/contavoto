import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  onNavigateHome?: () => void;
  onNavigatePesquisas?: () => void;
  onNavigateDashboard?: () => void;
  onNavigatePermissions?: () => void;
}

export const BottomNav = ({ 
  onNavigateHome, 
  onNavigatePesquisas,
  onNavigateDashboard,
  onNavigatePermissions
}: BottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se é super admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.tipo_usuario_id === 5 || user.tipo === 5;

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

  const handleDashboard = () => {
    if (onNavigateDashboard) {
      onNavigateDashboard();
    } else {
      navigate('/dashboard');
    }
  };

  const handlePermissions = () => {
    if (onNavigatePermissions) {
      onNavigatePermissions();
    } else {
      navigate('/permissions');
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

        {/* Usuários apenas para super admin */}
        {isSuperAdmin && (
          <div 
            className={`nav-item ${isActive('/permissions') ? 'active' : ''}`}
            onClick={handlePermissions}
          >
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="nav-label">Usuários</div>
          </div>
        )}
        
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
        
        {/* Dashboard para todos os usuários */}
        <div 
          className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
          onClick={handleDashboard}
        >
          <div className="nav-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
          </div>
          <div className="nav-label">Dashboard</div>
        </div>
      </div>
    </nav>
  );
};
