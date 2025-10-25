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
    <div className="auth-page login-page">
      <style>{`
        @media screen and (orientation: landscape) {
          html {
            transform: rotate(-90deg);
            transform-origin: left top;
            width: 100vh;
            height: 100vw;
            overflow-x: hidden;
            position: absolute;
            top: 100%;
            left: 0;
          }
        }
      `}</style>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/Logo_home.png" alt="Logo Opine.ai" className="auth-logo-img" style={{ maxWidth: '100%', width: '100%', maxHeight: '250px', objectFit: 'contain' }} />
          </div>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="telefone">TELEFONE</label>
            <div className="input-with-icon username">
              <input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Digite seu telefone"
                className="input-text"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">SENHA</label>
            <div className="input-with-icon password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="input-text"
                required
              />
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button 
            type="submit" 
            className="btn btn-primary btn-large mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <div className="auth-footer">
          <p>© Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
};