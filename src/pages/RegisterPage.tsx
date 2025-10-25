import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import '../styles/design-system.css';

interface TipoUsuario {
  id: number;
  nome: string;
  descricao: string;
  nivel_permissao: number;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<number | null>(null);
  const [candidato, setCandidato] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);



  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    if (!tipoUsuario) {
      setError('Selecione o tipo de usuário.');
      setIsLoading(false);
      return;
    }

    try {
      // Registrar usuário no banco com tipo
      const usuarioData: any = {
        nome,
        telefone,
        senha: password, // Em produção, use hash da senha
        tipo_usuario_id: tipoUsuario,
        ativo: true,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };

      // Se for pesquisador, adicionar o campo candidato
      if (tipoUsuario === 1 && candidato) {
        usuarioData.candidato = candidato;
      }

      const { error: usuarioError } = await supabase
        .from('usuarios')
        .insert(usuarioData);

      if (usuarioError) throw usuarioError;

      // Mostrar mensagem de sucesso
      setSuccessMessage('Usuário criado com sucesso!');
      
      // Limpar formulário
      setNome('');
      setTelefone('');
      setPassword('');
      setConfirmPassword('');
      setTipoUsuario(null);
      setCandidato('');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      setError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Moderno */}
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={() => navigate('/permissions')}
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
            <h1 className="header-title">Criar Conta</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <div className="page-section">
          <div className="card">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  className="form-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite seu nome"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Digite seu telefone"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar senha *</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de usuário *</label>
                <select
                  className="form-select"
                  value={tipoUsuario || ''}
                  onChange={(e) => setTipoUsuario(Number(e.target.value))}
                  required
                >
                  <option value="">Selecione o tipo de usuário...</option>
                  <option value="1">Pesquisador</option>
                  <option value="5">Superadmin</option>
                </select>
              </div>

              {/* Campo Candidato - apenas para pesquisadores */}
              {tipoUsuario === 1 && (
                <div className="form-group">
                  <label className="form-label">Candidato *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={candidato}
                    onChange={(e) => setCandidato(e.target.value)}
                    placeholder="Nome do candidato"
                    required
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    Digite o nome do candidato associado a este pesquisador
                  </small>
                </div>
              )}

              {error && (
                <div className="status-badge offline mt-3">
                  {error}
                </div>
              )}

              {successMessage && (
                <div style={{
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {successMessage}
                </div>
              )}

              <button 
                type="submit" 
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginTop: '1rem',
                  backgroundColor: '#1a9bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};