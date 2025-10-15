import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import '../styles/design-system.css';

interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  tipo_usuario_id: number;
  tipos_usuarios?: {
    nome: string;
    nivel_permissao: number;
  };
}

export const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'status'>('nome');
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          telefone,
          ativo,
          tipo_usuario_id,
          tipos_usuarios (
            nome,
            nivel_permissao
          )
        `)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = usuarios
    .filter(usuario => 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.telefone.includes(searchTerm)
    )
    .sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      } else {
        return a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1;
      }
    });

  const getTipoIcon = (tipoId: number) => {
    switch (tipoId) {
      case 5: return '👑'; // superadmin
      case 4: return '🔧'; // admin
      case 3: return '🛠️'; // suporte
      case 2: return '🗳️'; // candidato
      case 1: return '📋'; // pesquisador
      default: return '👤';
    }
  };

  const getStatusColor = (ativo: boolean) => {
    return ativo ? '#28A745' : '#DC3545';
  };

  const handleAddUser = () => {
    setShowAddUser(true);
    // Redirecionar para página de registro ou modal
    navigate('/register');
  };

  const handleEditUser = (usuario: Usuario) => {
    console.log('Editar usuário:', usuario);
    // Implementar edição
  };

  const handleDeleteUser = async (usuarioId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', usuarioId);
        
        if (error) throw error;
        await carregarUsuarios();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);
      
      if (error) throw error;
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do usuário');
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="modern-header">
        <button 
          className="btn btn-ghost btn-small header-back-btn"
          onClick={() => navigate('/')}
        >
          ←
        </button>
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Usuários</h1>
          </div>
        </div>
      </header>

      {/* Campo de Pesquisa */}
      <div style={{ 
        padding: '1rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ 
                marginBottom: 0,
                paddingLeft: '2.5rem'
              }}
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="#6c757d"
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
          
          <button
            onClick={handleAddUser}
            className="btn btn-primary"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Adicionar
          </button>
        </div>
      </div>

      {/* Opções de Ordenação */}
      <div style={{ 
        padding: '1rem', 
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <span style={{ marginRight: '1rem', color: '#666' }}>Ordenar por:</span>
        <button
          onClick={() => setSortBy('status')}
          className="btn"
          style={{
            backgroundColor: sortBy === 'status' ? '#20B2AA' : 'white',
            color: sortBy === 'status' ? 'white' : '#666',
            border: '1px solid #ddd',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            marginRight: '0.5rem'
          }}
        >
          Status
        </button>
        <button
          onClick={() => setSortBy('nome')}
          className="btn"
          style={{
            backgroundColor: sortBy === 'nome' ? '#20B2AA' : 'white',
            color: sortBy === 'nome' ? 'white' : '#666',
            border: '1px solid #ddd',
            borderRadius: '20px',
            padding: '0.5rem 1rem'
          }}
        >
          Nome
        </button>
      </div>

      {/* Lista de Usuários */}
      <main className="main-content" style={{ padding: 0 }}>
        {loading ? (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <div className="modern-list">
            {usuariosFiltrados.map((usuario) => (
              <div 
                key={usuario.id} 
                className="list-item"
                style={{
                  borderLeft: `4px solid #20B2AA`,
                  padding: '1rem 1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#20B2AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    {getTipoIcon(usuario.tipo_usuario_id)}
                  </div>
                  
                  <div className="list-item-content">
                    <div className="list-item-title">{usuario.nome}</div>
                    <div className="list-item-subtitle">
                      {usuario.telefone} • {usuario.tipos_usuarios?.nome || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => handleEditUser(usuario)}
                    className="btn btn-ghost btn-small"
                    style={{ color: '#FFA500' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(usuario.ativo)
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {usuariosFiltrados.length === 0 && !loading && (
          <div className="text-center" style={{ padding: '2rem' }}>
            <p>Nenhum usuário encontrado.</p>
            <button onClick={handleAddUser} className="btn btn-primary">
              Adicionar Primeiro Usuário
            </button>
          </div>
        )}
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
          <div className="nav-item active">
            <div className="nav-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7H16c-.8 0-1.54.37-2.01 1.01L12 10.5l-1.99-2.49A2.5 2.5 0 0 0 8 7H5.46c-.8 0-1.52.57-1.42 1.37L6.5 16H9v6h2v-6h2v6h2z"/>
              </svg>
            </div>
            <div className="nav-label">Usuários</div>
          </div>
          <div className="nav-item" onClick={() => navigate('/configuracoes')}>
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