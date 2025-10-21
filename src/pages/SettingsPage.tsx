import { useEffect, useState } from 'react';
import { db, MediaJob } from '../db/localDB';
import { PesquisaService } from '../services/pesquisaService';
import { useFormularios } from '../hooks/useFormularios';
import { BottomNav } from '../components/BottomNav';
import '../styles/design-system.css';

interface SettingsPageProps {
  onNavigateToHome?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToPermissions?: () => void;
  onLogout?: () => void;
}

export const SettingsPage = ({
  onNavigateToHome,
  onNavigateToDashboard,
  onNavigateToPermissions,
  onLogout
}: SettingsPageProps) => {
  const { data: formularios = [], refetch } = useFormularios();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState<MediaJob[]>([]);

  useEffect(() => {
    const load = async () => {
      const all = await db.mediaJobs.toArray();
      setJobs(all);
    };
    load();
  }, []);

  const refreshJobs = async () => {
    const all = await db.mediaJobs.toArray();
    setJobs(all);
  };

  const handleLimparBanco = async () => {
    if (!confirm('⚠️ Isso vai deletar TODOS os dados locais (formulários e pesquisas não sincronizadas). Deseja continuar?')) {
      return;
    }

    setLoading(true);
    try {
      await PesquisaService.limparTudo();
      setMessage('✅ Banco limpo com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage('❌ Erro ao limpar banco: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessarFila = async () => {
    setLoading(true);
    try {
      const { processMediaQueueOnce } = await import('../services/mediaQueue');
      await processMediaQueueOnce();
      await refreshJobs();
      setMessage('✅ Fila processada.');
    } catch (e) {
      setMessage('❌ Erro ao processar fila: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecriarFormularios = async () => {
    if (!confirm('Isso vai recriar os formulários padrão. Deseja continuar?')) {
      return;
    }

    setLoading(true);
    try {
      // Limpar formulários existentes
      await db.formularios.clear();
      
      // Recriar formulários
      await PesquisaService.inicializarFormularioModelo();
      
      setMessage('✅ Formulários recriados com sucesso!');
      await refetch();
    } catch (error) {
      setMessage('❌ Erro ao recriar formulários: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirFormulario = async (id: number, nome: string) => {
    if (!confirm(`Deseja excluir o formulário "${nome}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await db.formularios.delete(id);
      setMessage(`✅ Formulário "${nome}" excluído!`);
      await refetch();
    } catch (error) {
      setMessage('❌ Erro ao excluir formulário: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = user.tipo_usuario_id === 5;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>⚙️ Configurações</h1>
        <p className="subtitle">Gerenciar formulários e dados</p>
      </header>

      <main className="app-main">
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        {/* Seção: Formulários */}
        <section className="card">
          <h2>📋 Formulários Cadastrados</h2>
          
          {formularios.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum formulário cadastrado</p>
              <button 
                onClick={handleRecriarFormularios}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Criando...' : '➕ Criar Formulários Padrão'}
              </button>
            </div>
          ) : (
            <>
              <div className="formularios-list">
                {formularios.map((form) => (
                  <div key={form.id} className="formulario-item">
                    <div className="formulario-info">
                      <h3>{form.nome}</h3>
                      <p className="text-muted">{form.campos.length} perguntas</p>
                      <p className="text-small">{form.descricao}</p>
                    </div>
                    <button
                      onClick={() => handleExcluirFormulario(form.id!, form.nome)}
                      disabled={loading}
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                ))}
              </div>

              <div className="actions" style={{ marginTop: '20px' }}>
                <button 
                  onClick={handleRecriarFormularios}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Recriando...' : '🔄 Recriar Formulários Padrão'}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Seção: Dados Locais */}
        <section className="card" style={{ marginTop: '20px' }}>
          <h2>🗄️ Banco de Dados Local</h2>
          <p className="text-muted">Limpe o banco local para resolver problemas de sincronização</p>
          
          <div className="warning-box">
            <strong>⚠️ Atenção:</strong>
            <ul>
              <li>Isso vai deletar TODOS os dados locais</li>
              <li>Pesquisas não sincronizadas serão perdidas</li>
              <li>Você precisará fazer login novamente</li>
            </ul>
          </div>

          <button 
            onClick={handleLimparBanco}
            disabled={loading}
            className="btn btn-danger"
            style={{ marginTop: '15px' }}
          >
            {loading ? 'Limpando...' : '🧹 Limpar Banco de Dados'}
          </button>
        </section>

        {/* Seção: Informações */}
        <section className="card" style={{ marginTop: '20px' }}>
          <h2>ℹ️ Informações</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Usuário:</span>
              <span className="info-value">{user.nome}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tipo:</span>
              <span className="info-value">
                {user.tipo_usuario_id === 1 ? 'Pesquisador' :
                 user.tipo_usuario_id === 2 ? 'Candidato' :
                 user.tipo_usuario_id === 5 ? 'Super Admin' : 'Outro'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Formulários:</span>
              <span className="info-value">{formularios.length}</span>
            </div>
          </div>
        </section>
      </main>

      <main className="app-main">
        <section className="card" style={{ marginTop: '20px' }}>
          <h2>🎙️ Fila de Upload de Áudio</h2>
          <p className="text-muted">Status dos jobs de mídia (offline → online).</p>
          <div className="info-grid">
            <div className="info-item"><span className="info-label">Total:</span><span className="info-value">{jobs.length}</span></div>
            <div className="info-item"><span className="info-label">Pendentes:</span><span className="info-value">{jobs.filter(j=>j.status==='pendente').length}</span></div>
            <div className="info-item"><span className="info-label">Erro:</span><span className="info-value">{jobs.filter(j=>j.status==='erro').length}</span></div>
          </div>
          {jobs.filter(j=>j.status==='erro').slice(0,3).map(j => (
            <div key={j.id} className="formulario-item" style={{marginTop:'10px'}}>
              <div className="formulario-info">
                <h3>Job #{j.id} • Pesquisa {j.pesquisaId}</h3>
                <p className="text-small">Tentativas: {j.tentativas} • Próxima: {j.proximaTentativa ? new Date(j.proximaTentativa).toLocaleString() : '-'}</p>
                {j.ultimoErro && <p className="text-muted">Erro: {j.ultimoErro}</p>}
              </div>
            </div>
          ))}
          <div className="actions" style={{ marginTop: '15px' }}>
            <button className="btn btn-secondary" onClick={handleProcessarFila} disabled={loading}>
              {loading ? 'Processando...' : '⚡ Processar fila agora'}
            </button>
            <button className="btn" onClick={refreshJobs} disabled={loading}>Atualizar</button>
          </div>
        </section>
      </main>

      <BottomNav
        onNavigateHome={onNavigateToHome}
        onNavigateDashboard={onNavigateToDashboard}
      />

      <style>{`
        .alert {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .formularios-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .formulario-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }

        .formulario-info h3 {
          margin: 0 0 5px 0;
          font-size: 16px;
          color: #212529;
        }

        .formulario-info p {
          margin: 3px 0;
          font-size: 14px;
        }

        .text-muted {
          color: #6c757d;
        }

        .text-small {
          font-size: 13px;
          color: #868e96;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
        }

        .warning-box {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .warning-box ul {
          margin: 10px 0 0 20px;
          padding: 0;
        }

        .warning-box li {
          margin: 5px 0;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 15px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .info-label {
          font-weight: 600;
          color: #495057;
        }

        .info-value {
          color: #212529;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .empty-state p {
          margin-bottom: 20px;
          font-size: 16px;
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
};
