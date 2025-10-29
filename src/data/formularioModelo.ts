import { Formulario } from '../db/localDB';

// ⚠️ VERSÃO DE TESTE - APENAS 4 PERGUNTAS
export const formularioPortaAPortaModelo: Omit<Formulario, 'id' | 'criadoEm' | 'sincronizado'> = {
  nome: "Pesquisa Teste Rápido",
  descricao: "Formulário simplificado para testes de áudio",
  preCandidato: "Candidato Teste",
  telefoneContato: "(00) 00000-0000",
  campos: [
    {
      id: 'nome_morador',
      tipo: 'texto',
      label: '1. Qual é o seu nome?',
      obrigatorio: true,
    },
    {
      id: 'telefone_morador',
      tipo: 'telefone',
      label: '2. Telefone (opcional)',
      obrigatorio: false,
    },
    {
      id: 'problema_bairro',
      tipo: 'textarea',
      label: '3. Qual o principal problema do seu bairro?',
      obrigatorio: true,
    },
    {
      id: 'sugestao',
      tipo: 'textarea',
      label: '4. O que você sugere para melhorar?',
      obrigatorio: false,
    },
  ],
};

// Formulário completo (comentado para testes)
export const formularioPortaAPortaCompleto: Omit<Formulario, 'id' | 'criadoEm' | 'sincronizado'> = {
  nome: "Pesquisa Porta a Porta - Modelo Completo",
  descricao: "Formulário completo de pesquisa porta a porta com perguntas sobre educação, saúde, infraestrutura e transporte",
  preCandidato: "[NOME DO CANDIDATO]",
  telefoneContato: "[XX XXXXX-XXXX]",
  campos: [
    // Seção: Dados de Localização
    {
      id: 'secao_localizacao',
      tipo: 'textarea',
      label: '📍 DADOS DO LOCAL DA PESQUISA',
      obrigatorio: false,
    },
    {
      id: 'endereco',
      tipo: 'texto',
      label: 'Endereço',
      obrigatorio: true,
    },
    {
      id: 'bairro',
      tipo: 'texto',
      label: 'Bairro',
      obrigatorio: true,
    },
    {
      id: 'numero_residencia',
      tipo: 'texto',
      label: 'Número da Residência',
      obrigatorio: false,
    },
    {
      id: 'ponto_referencia',
      tipo: 'texto',
      label: 'Ponto de Referência',
      obrigatorio: false,
    },
    
    // Seção: Perfil do Entrevistado
    {
      id: 'secao_perfil',
      tipo: 'textarea',
      label: '👤 PERFIL DO ENTREVISTADO',
      obrigatorio: false,
    },
    {
      id: 'nome_morador',
      tipo: 'texto',
      label: '1. Poderia me dizer o seu nome, por favor?',
      obrigatorio: true,
    },
    {
      id: 'telefone_morador',
      tipo: 'telefone',
      label: 'Telefone do morador',
      obrigatorio: false,
    },
    {
      id: 'sexo',
      tipo: 'radio',
      label: 'Sexo',
      obrigatorio: true,
      opcoes: ['Masculino', 'Feminino'],
    },
    {
      id: 'idade',
      tipo: 'radio',
      label: '2. Qual é a idade do senhor(a)?',
      obrigatorio: true,
      opcoes: [
        '16 ou menos anos',
        'De 17 a 24 anos',
        'De 25 a 34 anos',
        'De 35 a 45 anos',
        'De 46 a 54 anos',
        '55 ou mais anos',
      ],
    },
    {
      id: 'estado_civil',
      tipo: 'radio',
      label: '3. Qual o estado Civil do senhor(a)?',
      obrigatorio: true,
      opcoes: ['Casado(a)', 'Solteiro(a)', 'Viúvo(a)'],
    },
    {
      id: 'trabalha',
      tipo: 'radio',
      label: '4. O senhor(a) trabalha atualmente?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'ocupacao',
      tipo: 'texto',
      label: 'Qual a ocupação do senhor(a)?',
      obrigatorio: false,
      condicao: {
        campoDependente: 'trabalha',
        valorRequerido: 'Sim',
      },
    },
    {
      id: 'pratica_religiao',
      tipo: 'radio',
      label: '5. O senhor(a) é praticante de alguma religião?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'qual_religiao',
      tipo: 'radio',
      label: '5.1. Qual religião?',
      obrigatorio: false,
      opcoes: ['Evangélica', 'Católica', 'Espírita', 'Outra'],
      condicao: {
        campoDependente: 'pratica_religiao',
        valorRequerido: 'Sim',
      },
    },
    {
      id: 'religiao_outra',
      tipo: 'texto',
      label: 'Especifique qual religião:',
      obrigatorio: false,
      condicao: {
        campoDependente: 'qual_religiao',
        valorRequerido: 'Outra',
      },
    },
    {
      id: 'tem_filhos',
      tipo: 'radio',
      label: '6. O senhor(a) tem filhos?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'quantidade_filhos',
      tipo: 'radio',
      label: '6.1. Quantos filhos o senhor(a) tem?',
      obrigatorio: false,
      opcoes: ['1', '2 a 3', '4 ou mais'],
      condicao: {
        campoDependente: 'tem_filhos',
        valorRequerido: 'Sim',
      },
    },
    
    // Seção: Educação
    {
      id: 'secao_educacao',
      tipo: 'textarea',
      label: '🎓 EDUCAÇÃO',
      obrigatorio: false,
    },
    {
      id: 'filho_estuda_municipal',
      tipo: 'radio',
      label: '7. O filho(a) do senhor(a) estuda na rede municipal de ensino?',
      obrigatorio: false,
      opcoes: ['Sim', 'Não'],
      condicao: {
        campoDependente: 'tem_filhos',
        valorRequerido: 'Sim',
      },
    },
    {
      id: 'avaliacao_merenda',
      tipo: 'radio',
      label: '8. Nos últimos 4 anos, como avalia a merenda escolar?',
      obrigatorio: false,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'avaliacao_ensino',
      tipo: 'radio',
      label: '9. Nos últimos 4 anos, como avalia a qualidade do ensino?',
      obrigatorio: false,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'comentario_educacao',
      tipo: 'textarea',
      label: '10. Gostaria de fazer algum comentário sobre a educação? Algo que precisa melhorar?',
      obrigatorio: false,
    },
    
    // Seção: Saúde Pública
    {
      id: 'secao_saude',
      tipo: 'textarea',
      label: '🏥 SAÚDE PÚBLICA',
      obrigatorio: false,
    },
    {
      id: 'utilizou_saude',
      tipo: 'radio',
      label: '11. Utilizou ou tentou utilizar serviços de posto de saúde, UPA ou Farmácia Central nos últimos 12 meses?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'avaliacao_atendimento_saude',
      tipo: 'radio',
      label: '12. Nos últimos 4 anos, como avalia o atendimento no posto de saúde ou UPA?',
      obrigatorio: false,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'avaliacao_saude_publica',
      tipo: 'radio',
      label: '13. Nos últimos 4 anos, como avalia a saúde pública do município?',
      obrigatorio: false,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'comentario_saude',
      tipo: 'textarea',
      label: '14. Comentários sobre a saúde do município e em que deveria melhorar:',
      obrigatorio: false,
    },
    
    // Seção: Infraestrutura e Zeladoria
    {
      id: 'secao_infraestrutura',
      tipo: 'textarea',
      label: '🏗️ INFRAESTRUTURA E ZELADORIA',
      obrigatorio: false,
    },
    {
      id: 'avaliacao_iluminacao',
      tipo: 'radio',
      label: '15. Nos últimos 4 anos, como avalia a iluminação pública do bairro?',
      obrigatorio: true,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'falta_agua',
      tipo: 'radio',
      label: '16. Falta água com frequência?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'avaliacao_asfalto',
      tipo: 'radio',
      label: '17. Nos últimos 4 anos, como avalia o asfalto e condições das ruas do bairro?',
      obrigatorio: true,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'avaliacao_limpeza',
      tipo: 'radio',
      label: '18. Nos últimos 4 anos, como avalia a limpeza na sua rua e bairro?',
      obrigatorio: true,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
    },
    {
      id: 'comentario_infraestrutura',
      tipo: 'textarea',
      label: '19. Comentários sobre infraestrutura e em que deveria melhorar:',
      obrigatorio: false,
    },
    
    // Seção: Transporte Público
    {
      id: 'secao_transporte',
      tipo: 'textarea',
      label: '🚌 TRANSPORTE PÚBLICO',
      obrigatorio: false,
    },
    {
      id: 'usa_transporte',
      tipo: 'radio',
      label: '20. O senhor(a) utiliza regularmente o transporte público?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não', 'Às Vezes'],
    },
    {
      id: 'avaliacao_transporte',
      tipo: 'radio',
      label: '20.1. Nos últimos 4 anos, como avalia o transporte público?',
      obrigatorio: false,
      opcoes: ['Piorou', 'Está Igual', 'Melhorou'],
      condicao: {
        campoDependente: 'usa_transporte',
        valorRequerido: 'Sim',
      },
    },
    
    // Seção: Custo de Vida
    {
      id: 'secao_custo_vida',
      tipo: 'textarea',
      label: '💰 CUSTO DE VIDA',
      obrigatorio: false,
    },
    {
      id: 'opiniao_custo_vida',
      tipo: 'radio',
      label: '21. "O alto custo de vida é um problema que precisa ser resolvido":',
      obrigatorio: true,
      opcoes: [
        'Discordo Totalmente',
        'Discordo Parcialmente',
        'Nem Concordo Nem Discordo',
        'Concordo Parcialmente',
        'Concordo Totalmente',
      ],
    },
    {
      id: 'despesa_mais_afeta',
      tipo: 'textarea',
      label: '22. Qual despesa afeta mais o seu custo de vida (moradia, alimentação, transporte)?',
      obrigatorio: false,
    },
    {
      id: 'acoes_custo_vida',
      tipo: 'textarea',
      label: '23. Quais ações o poder público deveria implementar para lidar com o alto custo de vida?',
      obrigatorio: false,
    },
    
    // Seção: Gerais
    {
      id: 'secao_gerais',
      tipo: 'textarea',
      label: '📝 QUESTÕES GERAIS',
      obrigatorio: false,
    },
    {
      id: 'problema_urgente',
      tipo: 'textarea',
      label: '24. Qual é o problema mais urgente a ser resolvido na sua rua ou bairro?',
      obrigatorio: true,
    },
    {
      id: 'comentario_final',
      tipo: 'textarea',
      label: '25. Há mais algum ponto que queira comentar ou alguma questão importante que não abordamos?',
      obrigatorio: false,
    },
  ],
};



