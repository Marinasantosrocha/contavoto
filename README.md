# ContaVoto - Sistema de Pesquisa de Campo

## 📱 Sobre o Projeto

Sistema de pesquisa de campo porta a porta com sincronização offline, desenvolvido como PWA (Progressive Web App) para funcionamento em dispositivos móveis.

## 🚀 Tecnologias

- **Frontend:** React + TypeScript + Vite
- **PWA:** Service Workers + Cache API
- **Offline:** Dexie (IndexedDB) + React Query
- **Backend:** Supabase (PostgreSQL)
- **IA:** OpenAI + Google Cloud Speech
- **Estilo:** Tailwind CSS + PostCSS

## ✨ Funcionalidades

- ✅ **Pesquisa offline** com sincronização automática
- ✅ **Gravação e transcrição** de áudio automática
- ✅ **Interface mobile-first** responsiva
- ✅ **PWA** instalável como app nativo
- ✅ **Fluxo de pesquisa** por tópicos
- ✅ **Geolocalização** automática
- ✅ **Autenticação** e controle de usuários

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📱 Uso

1. Acesse o sistema via navegador
2. Faça login com suas credenciais
3. Instale como PWA (opcional)
4. Inicie uma nova pesquisa
5. Grave respostas com áudio
6. Sincronize quando online

## 🔧 Configuração

Configure as variáveis de ambiente no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_OPENAI_API_KEY=sua_chave_openai
```

## 📊 Estrutura do Projeto

```
src/
├── components/     # Componentes React
├── hooks/         # Custom hooks
├── pages/         # Páginas da aplicação
├── services/      # Serviços e APIs
├── styles/        # Estilos CSS
└── data/          # Dados e modelos
```

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👤 Autor

**Marinasantosrocha**
- Email: 37419390marina@gmail.com
- GitHub: [@Marinasantosrocha](https://github.com/Marinasantosrocha)

---

Desenvolvido com ❤️ para pesquisas de campo eficientes e modernas.