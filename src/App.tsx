import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { HomePage } from './pages/HomePage';
import { PesquisaPage } from './pages/PesquisaPage';
import { ListaPesquisasPage } from './pages/ListaPesquisasPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { useInicializarFormulario } from './hooks/useFormularios';
import { usePWA } from './hooks/usePWA';
import AutoSync from './components/AutoSync';
import './App.css';
import './styles/design-system.css';

// Componente para verificar autenticação
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('user');
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const inicializarFormulario = useInicializarFormulario();
  const { showInstallPrompt, installApp, dismissInstallPrompt } = usePWA();

  // Inicializa o formulário modelo na primeira execução
  useEffect(() => {
    inicializarFormulario.mutate();
  }, []);

  return (
    <Router>
      {/* Componente de sincronização automática */}
      <AutoSync />
      
      <Routes>
        {/* Páginas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Páginas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <HomePageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/pesquisa/:id" element={
          <ProtectedRoute>
            <PesquisaPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/pesquisas" element={
          <ProtectedRoute>
            <ListaPesquisasPageWrapper />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPageWrapper />
          </ProtectedRoute>
        } />
            <Route path="/permissions" element={
              <ProtectedRoute>
                <PermissionsPage />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <ConfiguracoesPage />
              </ProtectedRoute>
            } />
        
        {/* Redirect para home se rota não encontrada */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* PWA Install Banner - aparece em todas as páginas protegidas */}
      {showInstallPrompt && (
        <div className="pwa-install-banner">
          <div className="install-content">
            <div className="install-icon">📱</div>
            <div className="install-text">
              <strong>Instalar App</strong>
              <p>Instale o PORTA A PORTA para acesso rápido e offline!</p>
            </div>
            <div className="install-buttons">
              <button onClick={installApp} className="btn btn-primary btn-small">
                Instalar
              </button>
              <button 
                onClick={dismissInstallPrompt} 
                className="btn btn-secondary btn-small"
              >
                ✖️
              </button>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

// Wrappers para as páginas que precisam de navegação
function HomePageWrapper() {
  const navigate = useNavigate();
  return (
    <HomePage
      onIniciarPesquisa={(pesquisaId) => navigate(`/pesquisa/${pesquisaId}`)}
      onVerPesquisas={() => navigate('/pesquisas')}
      onNavigateToDashboard={() => navigate('/dashboard')}
      onNavigateToSettings={() => navigate('/configuracoes')}
      onNavigateToPermissions={() => navigate('/permissions')}
      onLogout={() => navigate('/login')}
    />
  );
}

function PesquisaPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) return <Navigate to="/" />;
  
  return (
    <PesquisaPage
      pesquisaId={parseInt(id)}
      onFinalizar={() => navigate('/')}
      onCancelar={() => navigate('/')}
    />
  );
}

function ListaPesquisasPageWrapper() {
  const navigate = useNavigate();
  return (
    <ListaPesquisasPage
      onVoltar={() => navigate('/')}
      onEditarPesquisa={(pesquisaId) => navigate(`/pesquisa/${pesquisaId}`)}
    />
  );
}

function DashboardPageWrapper() {
  const navigate = useNavigate();
  return (
    <DashboardPage
      onNavigateHome={() => navigate('/')}
      onNavigatePesquisas={() => navigate('/pesquisas')}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;