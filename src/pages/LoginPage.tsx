import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Verificar se está online
        if (!navigator.onLine) {
          setError('❌ Sem conexão. O login requer internet na primeira vez. Se já estiver logado, o app funciona offline.');
          setIsLoading(false);
          return;
        }

        try {
          // Login com telefone e senha
          await AuthService.login(telefone, password);
          
          // Usuário já é salvo no localStorage pelo AuthService
          navigate('/');
        } catch (error: any) {
          console.error('Erro no login:', error);
          
          // Verificar se perdeu conexão durante o login
          if (!navigator.onLine) {
            setError('❌ Conexão perdida durante o login. Tente novamente quando estiver online.');
          } else {
            setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
          }
        } finally {
          setIsLoading(false);
        }
      };

  return (
    <div className="auth-page login-page" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: '100vh',
      maxHeight: '100vh',
      height: '100vh',
      margin: 0,
      padding: 0,
      background: '#fff',
      overflow: 'hidden'
    }}>
      {/* Lado Esquerdo - Branco com Logo */}
      <div style={{
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem',
        height: '100vh'
      }}>
        <img 
          src="/Logo_home.png" 
          alt="Logo Opine.ai" 
          style={{ 
            width: '100%',
            maxWidth: '350px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto'
          }} 
        />
      </div>

      {/* Lado Direito - Azul com Formulário */}
      <div style={{
        background: '#1a9bff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '2.5rem',
          fontWeight: '500',
          letterSpacing: '0.1em',
          marginBottom: '1.5rem',
          textTransform: 'none',
          fontFamily: "'Poppins', sans-serif"
        }}>
          Bem-vindo
        </h1>
        
        <form onSubmit={handleLogin} style={{
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Telefone"
              required
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '50px',
                background: '#fff',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '50px',
                background: '#fff',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#fff',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              textAlign: 'center',
              background: 'rgba(255,0,0,0.2)',
              padding: '0.75rem',
              borderRadius: '10px'
            }}>
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#fff',
              background: '#00d084',
              border: 'none',
              borderRadius: '50px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,208,132,0.3)',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
        
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.85rem',
          width: '100%'
        }}>
          <p>© Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};