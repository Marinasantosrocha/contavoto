import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="app-container">
      <header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              onClick={handleGoBack}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                color: '#333'
              }}
            >
              ←
            </button>
            <h1 className="header-title">Meu Perfil</h1>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="page-section">
          {/* Informações do Usuário */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            <div className="info-card" style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Nome
                </label>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#333',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {user.nome}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Telefone
                </label>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#333',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {user.telefone}
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Tipo de Usuário
                </label>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#333',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {getTipoUsuarioText(user.tipo)}
                </p>
              </div>
            </div>

            {/* Botão de Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '600',
                marginTop: '1rem',
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
        </div>
      </main>
    </div>
  );
}
