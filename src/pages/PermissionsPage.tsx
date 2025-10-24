import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { trocarFotoUsuario } from '../services/storageService';
import { BottomNav } from '../components/BottomNav';
import '../styles/design-system.css';

interface TipoUsuario {
  nome: string;
  nivel_permissao: number;
}

interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  tipo_usuario_id: number;
  candidato?: string;
  foto_url?: string;
  tipos_usuarios?: TipoUsuario | TipoUsuario[];
}

export const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nome' | 'status'>('nome');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editCandidato, setEditCandidato] = useState('');
  const [editFotoFile, setEditFotoFile] = useState<File | null>(null);
  const [editFotoPreview, setEditFotoPreview] = useState<string>('');

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
          candidato,
          foto_url,
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

  const handleAddUser = () => {
    setShowAddUser(true);
    // Redirecionar para página de registro ou modal
    navigate('/register');
  };

  const handleEditUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    setEditNome(usuario.nome);
    setEditTelefone(usuario.telefone);
    setEditCandidato(usuario.candidato || '');
    setEditFotoPreview(usuario.foto_url || '');
    setEditFotoFile(null);
  };

  const handleEditFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Tipo de arquivo não permitido. Use JPG, PNG ou WebP.');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 5MB.');
        return;
      }

      setEditFotoFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        nome: editNome,
        telefone: editTelefone,
        atualizado_em: new Date().toISOString()
      };

      // Se for pesquisador (tipo_usuario_id === 1), incluir campo candidato
      if (editingUser.tipo_usuario_id === 1) {
        updateData.candidato = editCandidato;
      }

      // Se tiver nova foto, fazer upload
      if (editFotoFile) {
        const fotoAntigaPath = editingUser.foto_url 
          ? editingUser.foto_url.split('/').pop() 
          : undefined;
        
        const resultadoFoto = await trocarFotoUsuario(
          editFotoFile, 
          parseInt(editingUser.id),
          fotoAntigaPath ? `avatars/${fotoAntigaPath}` : undefined
        );
        
        if (resultadoFoto.sucesso) {
          updateData.foto_url = resultadoFoto.url;
        } else {
          console.error('Erro ao fazer upload da foto:', resultadoFoto.erro);
        }
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      setEditFotoFile(null);
      setEditFotoPreview('');
      await carregarUsuarios();
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      alert('Erro ao editar usuário');
    }
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
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={() => navigate('/')}
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
                stroke="#20B2AA" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
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
      <main className="main-content">
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
                onClick={() => handleEditUser(usuario)}
                style={{
                  padding: '1rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: usuario.foto_url ? 'transparent' : '#20B2AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    color: 'white',
                    fontSize: '1.2rem',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {usuario.foto_url ? (
                      <img 
                        src={usuario.foto_url} 
                        alt={usuario.nome}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="list-item-content">
                    <div className="list-item-title">{usuario.nome}</div>
                    <div className="list-item-subtitle">
                      {usuario.telefone} • {Array.isArray(usuario.tipos_usuarios) ? usuario.tipos_usuarios[0]?.nome : usuario.tipos_usuarios?.nome || 'N/A'}
                    </div>
                  </div>
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

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#1f2937'
            }}>
              Editar Usuário
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '6px',
                color: '#374151'
              }}>
                Nome
              </label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Nome do usuário"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '6px',
                color: '#374151'
              }}>
                Telefone
              </label>
              <input
                type="tel"
                value={editTelefone}
                onChange={(e) => setEditTelefone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Telefone do usuário"
              />
            </div>

            {editingUser.tipo_usuario_id === 1 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  marginBottom: '6px',
                  color: '#374151'
                }}>
                  Candidato
                </label>
                <input
                  type="text"
                  value={editCandidato}
                  onChange={(e) => setEditCandidato(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="Nome do candidato"
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  marginTop: '4px' 
                }}>
                  Nome do candidato associado a este pesquisador
                </p>
              </div>
            )}

            {/* Campo de Foto */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                marginBottom: '6px',
                color: '#374151'
              }}>
                Foto de Perfil
              </label>
              
              {editFotoPreview && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginBottom: '12px' 
                }}>
                  <img 
                    src={editFotoPreview} 
                    alt="Preview"
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #20B2AA'
                    }}
                  />
                </div>
              )}
              
              <label 
                htmlFor="edit-foto-upload" 
                className="btn btn-secondary"
                style={{ 
                  cursor: 'pointer',
                  display: 'block',
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                >
                  <path 
                    d="M12 5C8.68629 5 6 7.68629 6 11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11C18 7.68629 15.3137 5 12 5ZM12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15Z" 
                    fill="#6b7280"
                  />
                  <path 
                    d="M4 20H20V22H4V20Z" 
                    fill="#6b7280"
                  />
                </svg>
                {editFotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
              </label>
              <input
                id="edit-foto-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleEditFotoChange}
                style={{ display: 'none' }}
              />
              <p style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '4px',
                textAlign: 'center'
              }}>
                JPG, PNG ou WebP • Máximo 5MB
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegação Inferior */}
      <BottomNav />
    </div>
  );
};