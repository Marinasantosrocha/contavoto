import { useState, useMemo } from 'react';
import { 
  usePesquisas, 
  usePesquisadores, 
  usePesquisasSupabase
} from '../hooks/usePesquisas';
import { useAceiteStats } from '../hooks/useAceiteStats';
import { useAceitePorEntrevistador } from '../hooks/useAceitePorEntrevistador';
// import { useFormularios } from '../hooks/useFormularios';
import { useRfbAnalytics } from '../hooks/useRfbAnalytics';
import { RFB_FIELDS, getFieldLabel, orderEntries } from '../data/rfbMappings';
import { ChartCard } from '../components/ChartCard';
import { DonutChart } from '../components/charts/DonutChart';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { BarHorizontal } from '../components/charts/BarHorizontal';
import { Stacked100BarList } from '../components/charts/Stacked100BarList';
import { SimpleSelect } from '../components/SimpleSelect';
import '../styles/dashboard.css';

interface DashboardPageProps {
  onNavigateHome: () => void;
  onNavigatePesquisas: () => void;
}

type Periodo = 'hoje' | 'semana' | 'mes' | 'todos';

export const DashboardPage = ({ 
  onNavigateHome, 
  onNavigatePesquisas
}: DashboardPageProps) => {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>('todos');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(null);
  const [pesquisadorSelecionado, setPesquisadorSelecionado] = useState<number | null>(null);
  const [formularioSelecionado, _setFormularioSelecionado] = useState<string | null>(null);
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<Record<string, string | null>>({});
  
  // Obter usuário logado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoUsuario = user.tipo_usuario_id || user.tipo;
  const isPesquisador = tipoUsuario === 1 || tipoUsuario === 'pesquisador';
  const nomeEntrevistadorLogado = user.nome || user.name || user.entrevistador;

  // Buscar TODAS as pesquisas do Supabase (filtros aplicados no frontend)
  const { data: pesquisas = [] } = usePesquisasSupabase();
  const { data: pesquisadores = [] } = usePesquisadores();
  const { data: aceiteStats } = useAceiteStats();
  const { data: aceitePorEntrevistador = {} } = useAceitePorEntrevistador();

  // Filtrar pesquisas por pesquisador (se for pesquisador logado, apenas suas pesquisas)
  // Usa 'entrevistador' (nome) em vez de usuario_id, pois a tabela não tem usuario_id
  const pesquisasPorPesquisador = pesquisas.filter(p => {
    if (isPesquisador && nomeEntrevistadorLogado) {
      return p.entrevistador === nomeEntrevistadorLogado;
    }
    if (pesquisadorSelecionado) {
      const pesquisador = pesquisadores.find(ps => ps.id === pesquisadorSelecionado);
      if (pesquisador) {
        return p.entrevistador === pesquisador.nome;
      }
    }
    return true; // Mostra todas se for admin/suporte sem filtro
  });

  // Filtrar pesquisas por período e cidade (aplicados primeiro)
  // IMPORTANTE: Filtros interligados - cada filtro afeta as opções dos outros
  const pesquisasPorPeriodo = useMemo(() => {
    if (periodoSelecionado === 'todos') return pesquisas;
    
    return pesquisas.filter(p => {
      const dataInicio = p.iniciadaEm ? new Date(p.iniciadaEm) : (p.iniciada_em ? new Date(p.iniciada_em) : null);
      if (!dataInicio) return false;
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (periodoSelecionado === 'hoje') {
        const dataInicioNormalizada = new Date(dataInicio);
        dataInicioNormalizada.setHours(0, 0, 0, 0);
        return dataInicioNormalizada.getTime() === hoje.getTime();
      } else if (periodoSelecionado === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        umaSemanaAtras.setHours(0, 0, 0, 0);
        return dataInicio >= umaSemanaAtras;
      } else if (periodoSelecionado === 'mes') {
        const umMesAtras = new Date();
        umMesAtras.setMonth(hoje.getMonth() - 1);
        umMesAtras.setHours(0, 0, 0, 0);
        return dataInicio >= umMesAtras;
      }
      return true;
    });
  }, [pesquisas, periodoSelecionado]);

  // Filtrar por cidade (após período)
  const pesquisasPorCidade = useMemo(() => {
    if (!cidadeSelecionada) return pesquisasPorPeriodo;
    return pesquisasPorPeriodo.filter(p => p.cidade === cidadeSelecionada);
  }, [pesquisasPorPeriodo, cidadeSelecionada]);

  // Filtrar por pesquisador (após período e cidade)
  const pesquisasFiltradas = useMemo(() => {
    if (isPesquisador && nomeEntrevistadorLogado) {
      return pesquisasPorCidade.filter(p => p.entrevistador === nomeEntrevistadorLogado);
    }
    if (pesquisadorSelecionado) {
      const pesquisador = pesquisadores.find(ps => ps.id === pesquisadorSelecionado);
      if (pesquisador) {
        return pesquisasPorCidade.filter(p => p.entrevistador === pesquisador.nome);
      }
    }
    return pesquisasPorCidade;
  }, [pesquisasPorCidade, isPesquisador, nomeEntrevistadorLogado, pesquisadorSelecionado, pesquisadores]);

  // ============================================
  // ESTATÍSTICAS DE ACEITE - RESPONDE A TODOS OS FILTROS
  // ============================================
  // IMPORTANTE: Todas as estatísticas abaixo usam pesquisasFiltradas,
  // que já tem aplicados TODOS os filtros: período, pesquisador, cidade e bairro
  // Isso garante que o gráfico "Taxa de Aceite" responda a todos os filtros simultaneamente
  // 
  // A coluna aceite_participacao tem 3 valores possíveis:
  // - "true" = Aceito
  // - "ausente" = Ausente
  // - "false" = Recusa
  //
  // NOTA: Supabase retorna com snake_case (aceite_participacao), IndexedDB usa o mesmo
  
  const aceitaramPeriodo = useMemo(() => {
    return pesquisasFiltradas.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'true';
    }).length;
  }, [pesquisasFiltradas]);
  
  const ausentesPeriodo = useMemo(() => {
    return pesquisasFiltradas.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'ausente';
    }).length;
  }, [pesquisasFiltradas]);
  
  const recusaramPeriodo = useMemo(() => {
    return pesquisasFiltradas.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'false';
    }).length;
  }, [pesquisasFiltradas]);
  
  const totalAbordagens = aceitaramPeriodo + ausentesPeriodo + recusaramPeriodo;
  const taxaAceite = totalAbordagens > 0 ? (aceitaramPeriodo / totalAbordagens) * 100 : 0;
  const taxaAusente = totalAbordagens > 0 ? (ausentesPeriodo / totalAbordagens) * 100 : 0;
  const taxaRecusa = totalAbordagens > 0 ? (recusaramPeriodo / totalAbordagens) * 100 : 0;

  // ============================================
  // AUTORIZAÇÃO DE CONTATO - RESPONDE A TODOS OS FILTROS
  // ============================================
  // Agrupa "Sim, autorizo" como Sim e "Não autorizo" como Não (ignora NULL)
  const autorizaramContato = useMemo(() => {
    return pesquisasFiltradas.filter(p => {
      const autorizacao = (p as any).autorizacao_contato || p.autorizacao_contato;
      return autorizacao?.toLowerCase().includes('sim');
    }).length;
  }, [pesquisasFiltradas]);
  
  const naoAutorizaramContato = useMemo(() => {
    return pesquisasFiltradas.filter(p => {
      const autorizacao = (p as any).autorizacao_contato || p.autorizacao_contato;
      return autorizacao?.toLowerCase().includes('não') || autorizacao?.toLowerCase().includes('nao');
    }).length;
  }, [pesquisasFiltradas]);
  
  const totalAutorizacaoContato = autorizaramContato + naoAutorizaramContato;
  const taxaAutorizouContato = totalAutorizacaoContato > 0 ? (autorizaramContato / totalAutorizacaoContato) * 100 : 0;
  const taxaNaoAutorizouContato = totalAutorizacaoContato > 0 ? (naoAutorizaramContato / totalAutorizacaoContato) * 100 : 0;

  // Aceitas/Ausentes/Recusas por entrevistador baseado nas pesquisas filtradas
  const getContagemEntrevistador = (nome: string) => {
    const pesquisasDoEntrevistador = pesquisasFiltradas.filter(p => p.entrevistador === nome);
    const aceitas = pesquisasDoEntrevistador.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'true';
    }).length;
    const ausentes = pesquisasDoEntrevistador.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'ausente';
    }).length;
    const recusas = pesquisasDoEntrevistador.filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'false';
    }).length;
    return { aceitas, ausentes, recusas, total: aceitas + ausentes + recusas };
  };

  // Agrupar recusas por motivo (apenas quando aceite_participacao === 'false')
  const motivosRecusa: { [key: string]: number } = {};
  pesquisasFiltradas
    .filter(p => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      const motivo = (p as any).motivo_recusa || p.motivo_recusa;
      return aceite === 'false' && motivo;
    })
    .forEach(p => {
      const motivo = (p as any).motivo_recusa || p.motivo_recusa;
      motivosRecusa[motivo!] = (motivosRecusa[motivo!] || 0) + 1;
    });

  // Agrupar por bairro (para o gráfico Top Bairros)
  const pesquisasPorBairro: { [key: string]: number } = {};
  pesquisasFiltradas.forEach(p => {
    const bairro = p.bairro || 'Não informado';
    pesquisasPorBairro[bairro] = (pesquisasPorBairro[bairro] || 0) + 1;
  });

  // Ordenar bairros por quantidade
  const bairrosOrdenados = Object.entries(pesquisasPorBairro)
    .sort(([, a], [, b]) => b - a);

  // Produtividade filtrada (somente pesquisas ACEITAS, respeitando os filtros do dashboard)
  // Calculada no frontend a partir de pesquisasFiltradas, para garantir alinhamento de filtros.
  const produtividadeFiltrada = useMemo(() => {
    type TempoEntrevista = { inicio?: Date | null; fim?: Date | null; duracaoMin?: number | null };

    // 1) Filtra somente pesquisas ACEITAS (aceite_participacao = 'true'),
    // respeitando todos os filtros já aplicados em pesquisasFiltradas.
    const entrevistasValidas = pesquisasFiltradas.filter((p: any) => {
      const aceite = (p as any).aceite_participacao || p.aceite_participacao;
      return aceite === 'true';
    });

    console.log('📊 [Produtividade] Pesquisas filtradas (todas):', pesquisasFiltradas.length);
    console.log('📊 [Produtividade] Entrevistas aceitas para produtividade:', entrevistasValidas.length);

    // 2) Agrupa por entrevistador
    const porEntrevistador = new Map<string, TempoEntrevista[]>();

    entrevistasValidas.forEach((p: any) => {
      const nome = p.entrevistador;
      if (!nome) return;

      const duracaoAudioSeg = Number((p as any).audio_duracao);
      const duracaoMin =
        Number.isFinite(duracaoAudioSeg) && duracaoAudioSeg > 0
          ? duracaoAudioSeg / 60
          : null;
      if (duracaoMin) {
        console.log('⏱️ [Produtividade] Entrevista com áudio:', nome, '->', duracaoMin, 'min');
      }

      const inicioRaw = p.iniciadaEm || p.iniciada_em;
      const fimRaw = p.finalizadaEm || p.finalizada_em;
      const inicio = inicioRaw ? new Date(inicioRaw) : null;
      const fim = fimRaw ? new Date(fimRaw) : null;

      if (!porEntrevistador.has(nome)) {
        porEntrevistador.set(nome, []);
      }
      porEntrevistador.get(nome)!.push({ inicio, fim, duracaoMin });
    });

    // 3) Calcula métricas por entrevistador
    const resultado: {
      entrevistador: string;
      total_entrevistas: number;
      duracao_media_minutos: number;
      intervalo_medio_minutos: number | null;
    }[] = [];

    for (const [nome, tempos] of porEntrevistador.entries()) {
      if (!tempos.length) continue;

      // Ordena por início
      tempos.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

      // Duração média (usando apenas as entrevistas que possuem duração de áudio)
      const duracoes = tempos
        .map(t => t.duracaoMin ?? null)
        .filter(d => Number.isFinite(d) && d > 0);

      if (!duracoes.length) continue;

      const duracaoMedia =
        Math.round((duracoes.reduce((sum, d) => sum + d, 0) / duracoes.length) * 10) / 10;

      // Intervalo médio entre entrevistas (apenas 0 < intervalo <= 60 minutos),
      // calculado somente quando temos iniciada_em/finalizada_em válidos.
      const intervalos: number[] = [];
      for (let i = 0; i < tempos.length - 1; i++) {
        const atual = tempos[i];
        const prox = tempos[i + 1];
        if (!atual.fim || !prox.inicio) continue;
        const diffMin = (prox.inicio.getTime() - atual.fim.getTime()) / 60000;
        if (Number.isFinite(diffMin) && diffMin > 0 && diffMin <= 60) {
          intervalos.push(diffMin);
        }
      }

      const intervaloMedio =
        intervalos.length > 0
          ? Math.round((intervalos.reduce((sum, d) => sum + d, 0) / intervalos.length) * 10) / 10
          : null;

      resultado.push({
        entrevistador: nome,
        total_entrevistas: duracoes.length,
        duracao_media_minutos: duracaoMedia,
        intervalo_medio_minutos: intervaloMedio,
      });
    }

    // Ordena por total de entrevistas (maior primeiro)
    resultado.sort((a, b) => b.total_entrevistas - a.total_entrevistas);
    return resultado;
  }, [pesquisasFiltradas]);

  // ============================================
  // OPÇÕES DE FILTROS INTERLIGADOS
  // ============================================
  // As opções de cada filtro dependem dos filtros anteriores

  // Cidades disponíveis (extraídas de TODAS as pesquisas)
  const opcoesCidades = useMemo(() => {
    console.log('📊 Total de pesquisas carregadas:', pesquisas.length);
    console.log('📍 Primeiras 5 cidades:', pesquisas.slice(0, 5).map(p => p.cidade));
    
    const cidadesSet = new Set<string>();
    pesquisas.forEach(p => {
      if (p.cidade) {
        console.log('🏙️ Adicionando cidade:', p.cidade);
        cidadesSet.add(p.cidade);
      }
    });
    const cidadesArray = Array.from(cidadesSet).sort((a, b) => a.localeCompare(b));
    console.log('✅ Cidades únicas finais:', cidadesArray);
    
    return [
      { value: '', label: 'Todas as Cidades' }, 
      ...cidadesArray.map(c => ({ value: c, label: c }))
    ];
  }, [pesquisas]);

  // Pesquisadores disponíveis (extraídos das pesquisas filtradas por período e cidade)
  const opcoesPesquisadores = useMemo(() => {
    if (isPesquisador) return []; // Pesquisador logado não vê este filtro
    
    // Extrair entrevistadores das pesquisas já filtradas por período e cidade
    const entrevistadoresSet = new Set<string>();
    pesquisasPorCidade.forEach(p => {
      if (p.entrevistador) entrevistadoresSet.add(p.entrevistador);
    });
    
    const entrevistadoresArray = Array.from(entrevistadoresSet).sort((a, b) => a.localeCompare(b));
    console.log('👥 Entrevistadores disponíveis:', entrevistadoresArray);
    
    // Mapear nomes para IDs de pesquisadores
    const opcoes = entrevistadoresArray.map(nome => {
      const pesquisador = pesquisadores.find(ps => ps.nome === nome);
      return pesquisador ? { value: pesquisador.id, label: nome } : { value: nome, label: nome };
    });
    
    return [{ value: '', label: 'Todos os Pesquisadores' }, ...opcoes];
  }, [pesquisasPorCidade, pesquisadores, isPesquisador]);

  // Buscar agregações da RFB (respostas normalizadas) para perguntas de múltipla escolha
  // Determina o nome do pesquisador para filtrar (se aplicável)
  const pesquisadorNomeFiltro = useMemo(() => {
    if (isPesquisador && nomeEntrevistadorLogado) {
      return nomeEntrevistadorLogado;
    }
    if (pesquisadorSelecionado) {
      const pesquisador = pesquisadores.find(p => p.id === pesquisadorSelecionado);
      return pesquisador?.nome || null;
    }
    return null;
  }, [isPesquisador, nomeEntrevistadorLogado, pesquisadorSelecionado, pesquisadores]);

  const { data: rfbAgg } = useRfbAnalytics({
    periodo: periodoSelecionado,
    pesquisadorNome: pesquisadorNomeFiltro,
    formularioUuid: formularioSelecionado,
    cidade: cidadeSelecionada,
    bairro: null, // Removido filtro de bairro
    categorySelections: opcoesSelecionadas,
  });

  // beautify não é mais usado; labels amigáveis vêm de rfbMappings

  const handleSliceClick = (fieldKey: string, name: string) => {
    setOpcoesSelecionadas((prev) => ({ ...prev, [fieldKey]: name }));
  };

  const clearSelection = (fieldKey: string) => {
    setOpcoesSelecionadas((prev) => ({ ...prev, [fieldKey]: null }));
  };

  const clearAllSelections = () => setOpcoesSelecionadas({});

  return (
    <>
      {/* Menu Lateral para Admin/Suporte */}
      {!isPesquisador && <Sidebar />}
      
    <div className={`app-container ${!isPesquisador ? 'app-with-sidebar' : ''}`}>
      <header className="modern-header home-header">
        <div className="header-content">
          <div className="header-left">
            <svg 
              onClick={onNavigateHome}
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
            <h1 className="header-title">Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="main-content dashboard-desktop">
        {/* Filtros - Interligados (Período → Cidade → Entrevistador) */}
        <div className="dashboard-filters-row">
          <SimpleSelect
            label="Período de Análise"
            options={[
              { value: 'hoje', label: 'Hoje' },
              { value: 'semana', label: 'Últimos 7 dias' },
              { value: 'mes', label: 'Últimos 30 dias' },
              { value: 'todos', label: 'Todos os períodos' }
            ]}
            value={periodoSelecionado}
            onChange={(value) => {
              setPeriodoSelecionado(value as Periodo);
              // Limpar filtros dependentes ao mudar período
              setCidadeSelecionada(null);
              setPesquisadorSelecionado(null);
            }}
          />

          <SimpleSelect
            label="Cidade"
            options={opcoesCidades}
            value={cidadeSelecionada || ''}
            onChange={(value) => {
              setCidadeSelecionada((value as string) || null);
              // Limpar pesquisador ao mudar cidade
              setPesquisadorSelecionado(null);
            }}
          />

          {/* Filtro de Entrevistador (apenas para não-pesquisadores) */}
          {!isPesquisador && (
            <SimpleSelect
              label="Entrevistador"
              options={opcoesPesquisadores}
              value={pesquisadorSelecionado || ''}
              onChange={(value) => setPesquisadorSelecionado(value ? Number(value) : null)}
            />
          )}
        </div>

        {/* Grid estilo Power BI */}
        <div className="dashboard-grid">

          {/* Taxa de Aceite - 6 colunas */}
          <div className="dashboard-card" style={{ gridColumn: 'span 6' }}>
            <ChartCard title="Taxa de Aceite" subtitle={`Base: ${totalAbordagens} abordagens`}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: '1.25rem', alignItems: 'center' }}>
              <DonutChart 
                data={[
                  { name: 'Aceitaram', value: aceitaramPeriodo }, 
                  { name: 'Ausentes', value: ausentesPeriodo },
                  { name: 'Recusaram', value: recusaramPeriodo }
                ]}
                // Azul primário para Aceitaram, Cinza para Ausentes, Vermelho para Recusaram
                colors={["#1a9bff", "#9CA3AF", "#FF7B7B"]}
              />
              <div className="taxa-container">
                <div className="taxa-chart">
                  <div className="taxa-bar-container">
                    <div className="taxa-bar-label">
                      <span>Aceitaram</span>
                      <span className="taxa-percentage">{taxaAceite.toFixed(1)}%</span>
                    </div>
                    <div className="taxa-bar">
                      <div className="taxa-bar-fill success" style={{ width: `${taxaAceite}%` }}>
                        {aceitaramPeriodo}
                      </div>
                    </div>
                  </div>
                    <div className="taxa-bar-container">
                      <div className="taxa-bar-label">
                        <span>Ausentes</span>
                        <span className="taxa-percentage" style={{ color: '#9CA3AF' }}>{taxaAusente.toFixed(1)}%</span>
                      </div>
                      <div className="taxa-bar">
                        <div className="taxa-bar-fill" style={{ width: `${taxaAusente}%`, background: '#9CA3AF' }}>
                          {ausentesPeriodo}
                        </div>
                      </div>
                    </div>
                  <div className="taxa-bar-container">
                    <div className="taxa-bar-label">
                      <span>Recusaram</span>
                      <span className="taxa-percentage danger">{taxaRecusa.toFixed(1)}%</span>
                    </div>
                    <div className="taxa-bar">
                      <div className="taxa-bar-fill danger" style={{ width: `${taxaRecusa}%` }}>
                        {recusaramPeriodo}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
          </div>

          {/* Autorização de Contato - 6 colunas */}
          <div className="dashboard-card" style={{ gridColumn: 'span 6' }}>
            <ChartCard title="Autorização de Contato" subtitle={`Base: ${totalAutorizacaoContato} respostas`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 360px) 1fr', gap: '1.25rem', alignItems: 'center' }}>
                <DonutChart 
                  data={[
                    { name: 'Sim', value: autorizaramContato }, 
                    { name: 'Não', value: naoAutorizaramContato }
                  ]}
                  colors={["#1a9bff", "#FF7B7B"]} // Azul para Sim, Vermelho para Não (mesmo padrão de Taxa de Aceite)
                />
                <div className="taxa-container">
                  <div className="taxa-chart">
                    <div className="taxa-bar-container">
                      <div className="taxa-bar-label">
                        <span>Sim</span>
                        <span className="taxa-percentage">{taxaAutorizouContato.toFixed(1)}%</span>
                      </div>
                      <div className="taxa-bar">
                        <div className="taxa-bar-fill success" style={{ width: `${taxaAutorizouContato}%` }}>
                          {autorizaramContato}
                        </div>
                      </div>
                    </div>
                    <div className="taxa-bar-container">
                      <div className="taxa-bar-label">
                        <span>Não</span>
                        <span className="taxa-percentage danger">{taxaNaoAutorizouContato.toFixed(1)}%</span>
                      </div>
                      <div className="taxa-bar">
                        <div className="taxa-bar-fill danger" style={{ width: `${taxaNaoAutorizouContato}%` }}>
                          {naoAutorizaramContato}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Opiniões por Tema (RFB) */}
          <div className="dashboard-card dashboard-card-full">
          <ChartCard 
            title="Opiniões por Tema" 
            subtitle={rfbAgg ? `Base: ${rfbAgg.total} respostas normalizadas` : 'Carregando...'}
            right={(
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {Object.entries(opcoesSelecionadas).filter(([,v]) => !!v).map(([k, v]) => (
                    <span key={k} style={{ background: 'rgba(26,155,255,0.12)', color: '#1a9bff', border: '1px solid #1a9bff', borderRadius: 16, padding: '2px 8px', fontSize: 12 }}>
                      {getFieldLabel(k)}: {v}
                      <button onClick={() => clearSelection(k)} style={{ marginLeft: 6, border: 'none', background: 'transparent', color: '#1a9bff', cursor: 'pointer' }}>×</button>
                    </span>
                  ))}
                  {Object.values(opcoesSelecionadas).some(Boolean) && (
                    <button onClick={clearAllSelections} style={{ marginLeft: 8, border: '1px solid #6C757D', background: 'transparent', color: '#6C757D', borderRadius: 16, padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}>Limpar filtros</button>
                  )}
                </div>
              )}
          >
            {!rfbAgg && (
              <div style={{ padding: '1rem', color: '#6C757D' }}>Carregando gráficos…</div>
            )}
            {rfbAgg && rfbAgg.total === 0 && (
              <div style={{ padding: '1rem', color: '#6C757D' }}>Sem dados para exibir com os filtros atuais.</div>
            )}
            {rfbAgg && rfbAgg.total > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 1) Percepção por Tema (scale3) - barras empilhadas 100% */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem' }}>Percepção por Tema</h4>
                  </div>
                  <Stacked100BarList
                    rows={RFB_FIELDS.filter(f => f.type === 'scale3').map(f => ({
                      key: f.key,
                      label: f.label,
                      dist: rfbAgg.distribuicoes[f.key] || {},
                      order: f.order,
                    }))}
                    onSegmentClick={(field, opt) => handleSliceClick(field, opt)}
                  />
                </div>

                {/* 2) Visão Deputado (Indicadores Binários) - barras empilhadas 100% */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div className="card-header" style={{ padding: 0, marginBottom: '0.5rem' }}>
                    <h4 className="card-title" style={{ fontSize: '1rem' }}>Visão Deputado</h4>
                  </div>
                  <Stacked100BarList
                    rows={RFB_FIELDS.filter(f => f.type === 'binary').map(f => ({
                      key: f.key,
                      label: f.label,
                      dist: rfbAgg.distribuicoes[f.key] || {},
                      order: f.order,
                    }))}
                    onSegmentClick={(field, opt) => handleSliceClick(field, opt)}
                  />
                </div>

                {/* 3) Perfil: Faixa etária e Tempo de moradia - donuts por campo (sem título principal) */}
                <div className="card" style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {RFB_FIELDS.filter(f => f.type === 'ordinal').map(f => {
                      const dist = rfbAgg.distribuicoes[f.key] || {};
                      const entries = orderEntries(Object.entries(dist), f.key);
                      if (entries.length === 0) return null;
                      const data = entries.map(([name, value]) => ({ name, value }));
                      return (
                        <div key={f.key} className="card" style={{ padding: '0.5rem' }}>
                          <div className="card-header" style={{ padding: '0.25rem 0.5rem' }}>
                            <h5 className="card-title" style={{ fontSize: '0.95rem' }}>{f.label}</h5>
                          </div>
                          <DonutChart data={data} height={240} />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </ChartCard>
          </div>

          {/* Produtividade dos Pesquisadores */}
          <div className="dashboard-card dashboard-card-full">
          <ChartCard 
            title="Produtividade dos Pesquisadores" 
            subtitle="Tempo médio de entrevista e intervalo entre entrevistas"
          >
            {produtividadeFiltrada && produtividadeFiltrada.length > 0 ? (
              <div style={{ marginTop: '1rem' }}>
                {produtividadeFiltrada.map((item) => (
                  <div key={item.entrevistador} style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      marginBottom: '0.75rem'
                    }}>
                      {(() => {
                        const cont = getContagemEntrevistador(item.entrevistador);
                        return `${item.entrevistador} (${item.total_entrevistas} entrevistas · ${cont.aceitas} aceitas · ${cont.ausentes} ausentes · ${cont.recusas} recusas)`;
                      })()}
                    </h4>
                    
                    {/* Duração Média */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.25rem',
                        fontSize: '14px'
                      }}>
                        <span style={{ color: '#6b7280' }}>Duração média da entrevista</span>
                        <span style={{ fontWeight: '600', color: '#1a9bff' }}>
                          {item.duracao_media_minutos?.toFixed(1) || '0'} min
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '24px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${Math.min((item.duracao_media_minutos / 30) * 100, 100)}%`, 
                          height: '100%', 
                          backgroundColor: '#1a9bff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {item.duracao_media_minutos > 5 && `${item.duracao_media_minutos.toFixed(1)}m`}
                        </div>
                      </div>
                    </div>

                    {/* Intervalo Médio */}
                    {item.intervalo_medio_minutos && (
                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '0.25rem',
                          fontSize: '14px'
                        }}>
                          <span style={{ color: '#6b7280' }}>Intervalo médio entre entrevistas</span>
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                            {item.intervalo_medio_minutos.toFixed(1)} min
                          </span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '24px', 
                          backgroundColor: '#f3f4f6', 
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${Math.min((item.intervalo_medio_minutos / 30) * 100, 100)}%`, 
                            height: '100%', 
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {item.intervalo_medio_minutos > 5 && `${item.intervalo_medio_minutos.toFixed(1)}m`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  padding: '1rem', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <strong>Nota:</strong> Intervalos maiores que 60 minutos (horário de almoço) não são considerados no cálculo.
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#6b7280' 
              }}>
                Nenhum dado de produtividade disponível
              </div>
            )}
          </ChartCard>
          </div>
        </div>
      </main>

      {/* Menu Inferior apenas para Pesquisadores */}
      {isPesquisador && (
        <BottomNav 
          onNavigateHome={onNavigateHome}
          onNavigatePesquisas={onNavigatePesquisas}
        />
      )}
    </div>
    </>
  );
};
