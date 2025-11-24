import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import '../styles/design-system.css';

interface ProfilePageProps {
  onLogout: () => void;
}

interface UserData {
  id: string;
  nome: string;
  telefone: string;
  foto_url?: string;
  tipo?: number;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  
  // Verificar tipo de usuário
  const tipoToId = (t?: string) => t === 'superadmin' ? 5 : t === 'admin' ? 4 : t === 'pesquisador' ? 1 : undefined;
  const tipoUsuarioId = user?.tipo || (user as any)?.tipo_usuario_id;
  const isPesquisador = tipoUsuarioId === 1;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    if (confirm('Deseja realmente sair?')) {
      localStorage.removeItem('user');
      onLogout();
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const getTipoUsuarioText = (tipo?: number) => {
    switch (tipo) {
      case 1:
        return 'Pesquisador';
      case 5:
        return 'Super Admin';
      default:
        return 'Usuário';
    }
  };

  if (!user) {
    return (
      <div className="app-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Carregando...</p>
        </div>
      </div>
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
              onClick={handleGoBack}
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
            <h1 className="header-title">Perfil</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5252'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b6b'}
          >
            Sair da Conta
          </button>
        </div>
      </main>

      {/* Menu Inferior apenas para Pesquisadores */}
      {isPesquisador && <BottomNav />}
    </div>
    </>
  );
}
