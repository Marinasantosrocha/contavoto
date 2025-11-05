# 🎨 Como Personalizar o Formulário

## 📋 Personalizando o Formulário Padrão

O app vem com um formulário modelo pré-configurado, mas você pode personalizá-lo completamente!

### Localização do Arquivo

```
src/data/formularioModelo.ts
```

## 🔧 Estrutura do Formulário

### 1. Informações Básicas

```typescript
export const formularioPortaAPortaModelo = {
  nome: "Nome do Formulário",
  descricao: "Descrição breve",
  preCandidato: "NOME DO CANDIDATO",  // ← Aparece no script
  telefoneContato: "99 99999-9999",    // ← Para contato
  campos: [
    // ... campos aqui
  ],
};
```

### 2. Tipos de Campos Disponíveis

#### 📝 Texto Simples

```typescript
{
  id: 'nome_completo',
  tipo: 'texto',
  label: 'Nome completo do entrevistado',
  obrigatorio: true,
}
```

#### 📞 Telefone

```typescript
{
  id: 'telefone',
  tipo: 'telefone',
  label: 'Número de telefone',
  obrigatorio: true,
}
```

#### 🔢 Número

```typescript
{
  id: 'idade',
  tipo: 'numero',
  label: 'Qual sua idade?',
  obrigatorio: true,
}
```

#### ⭕ Múltipla Escolha (Radio)

```typescript
{
  id: 'satisfacao',
  tipo: 'radio',
  label: 'Como avalia o serviço?',
  obrigatorio: true,
  opcoes: ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'],
}
```

#### ☑️ Caixas de Seleção (Checkbox)

```typescript
{
  id: 'problemas',
  tipo: 'checkbox',
  label: 'Quais problemas afetam o bairro? (múltipla escolha)',
  obrigatorio: false,
  opcoes: [
    'Iluminação',
    'Asfalto',
    'Limpeza',
    'Segurança',
    'Transporte',
  ],
}
```

#### 📋 Lista Suspensa (Select)

```typescript
{
  id: 'escolaridade',
  tipo: 'select',
  label: 'Qual sua escolaridade?',
  obrigatorio: true,
  opcoes: [
    'Fundamental Incompleto',
    'Fundamental Completo',
    'Médio Incompleto',
    'Médio Completo',
    'Superior Incompleto',
    'Superior Completo',
    'Pós-graduação',
  ],
}
```

#### 📄 Texto Longo (Textarea)

```typescript
{
  id: 'sugestoes',
  tipo: 'textarea',
  label: 'Deixe suas sugestões:',
  obrigatorio: false,
}
```

#### 🎨 Seção / Título

```typescript
{
  id: 'secao_dados_pessoais',
  tipo: 'textarea',
  label: '👤 DADOS PESSOAIS',
  obrigatorio: false,
}
```

> **Nota**: Campos com `id` começando com `secao_` são tratados como títulos decorativos.

## 🔀 Perguntas Condicionais

Mostre perguntas apenas se outra pergunta tiver determinada resposta:

```typescript
// Pergunta principal
{
  id: 'tem_carro',
  tipo: 'radio',
  label: 'Você tem carro?',
  obrigatorio: true,
  opcoes: ['Sim', 'Não'],
}

// Pergunta que SÓ aparece se responder "Sim"
{
  id: 'marca_carro',
  tipo: 'texto',
  label: 'Qual a marca do seu carro?',
  obrigatorio: false,
  condicao: {
    campoDependente: 'tem_carro',    // ← ID da pergunta principal
    valorRequerido: 'Sim',           // ← Valor que ativa esta pergunta
  },
}
```

### Exemplo Completo de Condicionais

```typescript
// 1. Pergunta: Tem filhos?
{
  id: 'tem_filhos',
  tipo: 'radio',
  label: 'Você tem filhos?',
  obrigatorio: true,
  opcoes: ['Sim', 'Não'],
}

// 2. Só aparece se tem_filhos = "Sim"
{
  id: 'quantos_filhos',
  tipo: 'radio',
  label: 'Quantos filhos você tem?',
  obrigatorio: false,
  opcoes: ['1', '2', '3', '4 ou mais'],
  condicao: {
    campoDependente: 'tem_filhos',
    valorRequerido: 'Sim',
  },
}

// 3. Só aparece se tem_filhos = "Sim"
{
  id: 'filhos_estudam',
  tipo: 'radio',
  label: 'Seus filhos estudam?',
  obrigatorio: false,
  opcoes: ['Sim', 'Não', 'Alguns sim'],
  condicao: {
    campoDependente: 'tem_filhos',
    valorRequerido: 'Sim',
  },
}
```

## 📝 Exemplo: Formulário Personalizado

### Pesquisa de Saúde Pública

```typescript
export const formularioSaudePublica = {
  nome: "Pesquisa de Saúde Pública",
  descricao: "Avaliação dos serviços de saúde",
  preCandidato: "Secretaria de Saúde",
  telefoneContato: "0800 123 4567",
  campos: [
    // Seção 1: Dados Pessoais
    {
      id: 'secao_dados',
      tipo: 'textarea',
      label: '👤 DADOS PESSOAIS',
      obrigatorio: false,
    },
    {
      id: 'nome',
      tipo: 'texto',
      label: 'Nome completo',
      obrigatorio: true,
    },
    {
      id: 'idade_faixa',
      tipo: 'radio',
      label: 'Faixa etária',
      obrigatorio: true,
      opcoes: [
        'Menos de 18',
        '18 a 30',
        '31 a 45',
        '46 a 60',
        'Mais de 60',
      ],
    },
    
    // Seção 2: Uso de Serviços
    {
      id: 'secao_servicos',
      tipo: 'textarea',
      label: '🏥 USO DE SERVIÇOS DE SAÚDE',
      obrigatorio: false,
    },
    {
      id: 'usou_posto',
      tipo: 'radio',
      label: 'Você utilizou o posto de saúde nos últimos 12 meses?',
      obrigatorio: true,
      opcoes: ['Sim', 'Não'],
    },
    {
      id: 'frequencia',
      tipo: 'radio',
      label: 'Com que frequência?',
      obrigatorio: false,
      opcoes: [
        '1 vez',
        '2 a 3 vezes',
        '4 a 6 vezes',
        'Mais de 6 vezes',
      ],
      condicao: {
        campoDependente: 'usou_posto',
        valorRequerido: 'Sim',
      },
    },
    {
      id: 'avaliacao_atendimento',
      tipo: 'radio',
      label: 'Como avalia o atendimento?',
      obrigatorio: false,
      opcoes: ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'],
      condicao: {
        campoDependente: 'usou_posto',
        valorRequerido: 'Sim',
      },
    },
    
    // Seção 3: Sugestões
    {
      id: 'secao_sugestoes',
      tipo: 'textarea',
      label: '💡 SUGESTÕES',
      obrigatorio: false,
    },
    {
      id: 'principal_problema',
      tipo: 'textarea',
      label: 'Qual o principal problema da saúde no seu bairro?',
      obrigatorio: true,
    },
    {
      id: 'sugestoes_melhoria',
      tipo: 'textarea',
      label: 'Deixe suas sugestões de melhoria:',
      obrigatorio: false,
    },
  ],
};
```

## 🎯 Dicas de Boas Práticas

### 1. Ordem Lógica

Organize perguntas do geral para o específico:
```
1. Dados Pessoais
2. Perguntas Principais
3. Perguntas Específicas/Condicionais
4. Comentários Abertos
```

### 2. Campos Obrigatórios

Marque como obrigatório apenas o essencial:
- ✅ Nome, idade, localização
- ❌ Comentários, sugestões

### 3. Opções Claras

Use opções mutuamente exclusivas:
```typescript
// ✅ BOM
opcoes: ['Sim', 'Não']
opcoes: ['Nunca', 'Às vezes', 'Frequentemente', 'Sempre']

// ❌ RUIM (confuso)
opcoes: ['Sim', 'Não', 'Talvez', 'Às vezes', 'Não sei']
```

### 4. Labels Descritivos

```typescript
// ✅ BOM
label: 'Nos últimos 12 meses, quantas vezes você visitou o posto de saúde?'

// ❌ RUIM
label: 'Visitas'
```

### 5. Use Seções

Divida formulários longos em seções temáticas:
```typescript
{
  id: 'secao_educacao',
  tipo: 'textarea',
  label: '🎓 EDUCAÇÃO',
  obrigatorio: false,
}
```

## 🔄 Como Aplicar as Mudanças

### Método 1: Editar Formulário Existente

1. Abra `src/data/formularioModelo.ts`
2. Edite os campos
3. Salve o arquivo
4. Recarregue o app (F5)

### Método 2: Criar Novo Formulário

1. Crie novo arquivo: `src/data/meuFormulario.ts`
2. Copie a estrutura do modelo
3. Personalize os campos
4. Em `src/services/pesquisaService.ts`, altere:

```typescript
// Linha ~158
import { formularioPortaAPortaModelo } from '../data/formularioModelo';

// Para:
import { meuFormulario } from '../data/meuFormulario';

// E use:
await this.salvarFormulario(meuFormulario);
```

## 🧪 Testando Seu Formulário

1. Salve as alterações
2. Recarregue o app
3. Inicie uma nova pesquisa
4. Verifique:
   - ✅ Todas as perguntas aparecem
   - ✅ Perguntas condicionais funcionam
   - ✅ Campos obrigatórios validam
   - ✅ Script aparece com nome correto

## 💾 Salvando Vários Formulários

Para ter múltiplos formulários disponíveis:

```typescript
// src/data/formularios.ts
export const formularios = [
  {
    nome: "Pesquisa de Saúde",
    descricao: "Avaliação de serviços de saúde",
    preCandidato: "Secretaria",
    telefoneContato: "0800",
    campos: [...]
  },
  {
    nome: "Pesquisa de Educação",
    descricao: "Qualidade do ensino",
    preCandidato: "Secretaria",
    telefoneContato: "0800",
    campos: [...]
  },
];
```

Então em `pesquisaService.ts`:

```typescript
async inicializarFormularios() {
  const count = await db.formularios.count();
  if (count === 0) {
    for (const form of formularios) {
      await this.salvarFormulario(form);
    }
  }
}
```

---

**Agora você está pronto para criar formulários incríveis!** 🚀




