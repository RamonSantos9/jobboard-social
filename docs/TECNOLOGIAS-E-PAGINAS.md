# Tecnologias e Páginas - JobBoard Social

Este documento mapeia todas as tecnologias utilizadas e páginas disponíveis na aplicação JobBoard Social.

---

## 📚 Stack Tecnológico

### **Framework e Core**

- **Next.js 16.0.0** - Framework React com renderização server-side e rotas baseadas em arquivos
- **React 19.0.0** - Biblioteca principal para construção da interface
- **React DOM 19.0.0** - Renderização de componentes React no DOM
- **TypeScript 5** - Superset JavaScript com tipagem estática

### **Estilização**

- **Tailwind CSS 4.1.9** - Framework CSS utility-first
- **Tailwind Merge** - Utilitário para mesclar classes Tailwind
- **Tailwindcss Animate** - Animações para Tailwind CSS
- **tw-animate-css** - Animações CSS adicionais
- **Autoprefixer** - PostCSS plugin para adicionar prefixos de vendor
- **PostCSS** - Ferramenta para transformar CSS
- **Class Variance Authority** - Criação de variantes de componentes
- **clsx** - Utilitário para construir classNames condicionais

### **UI Components (Radix UI)**

- **@radix-ui/react-accordion** - Componente de acordeão acessível
- **@radix-ui/react-alert-dialog** - Diálogos de alerta modais
- **@radix-ui/react-aspect-ratio** - Controle de proporção de aspecto
- **@radix-ui/react-avatar** - Componente de avatar
- **@radix-ui/react-checkbox** - Caixas de seleção acessíveis
- **@radix-ui/react-collapsible** - Conteúdo colapsável
- **@radix-ui/react-context-menu** - Menus de contexto
- **@radix-ui/react-dialog** - Diálogos modais
- **@radix-ui/react-dropdown-menu** - Menus dropdown
- **@radix-ui/react-hover-card** - Cards que aparecem ao passar o mouse
- **@radix-ui/react-label** - Labels acessíveis para formulários
- **@radix-ui/react-menubar** - Barras de menu
- **@radix-ui/react-navigation-menu** - Menus de navegação
- **@radix-ui/react-popover** - Popovers flutuantes
- **@radix-ui/react-progress** - Barras de progresso
- **@radix-ui/react-radio-group** - Grupos de radio buttons
- **@radix-ui/react-scroll-area** - Áreas de scroll customizadas
- **@radix-ui/react-select** - Componentes de seleção
- **@radix-ui/react-separator** - Separadores visuais
- **@radix-ui/react-slider** - Controles deslizantes
- **@radix-ui/react-slot** - Composição de componentes
- **@radix-ui/react-switch** - Interruptores toggle
- **@radix-ui/react-tabs** - Componentes de abas
- **@radix-ui/react-toast** - Notificações toast
- **@radix-ui/react-toggle** - Botões de alternância
- **@radix-ui/react-toggle-group** - Grupos de toggles
- **@radix-ui/react-tooltip** - Tooltips acessíveis

### **Bibliotecas de UI Adicionais**

- **shadcn/ui** - Coleção de componentes reutilizáveis
- **Lucide React** - Ícones SVG
- **@tabler/icons-react** - Conjunto adicional de ícones
- **Framer Motion** - Biblioteca de animações
- **Sonner** - Sistema de notificações toast
- **Vaul** - Componente de drawer/modal
- **cmdk** - Command menu (paleta de comandos)

### **Formulários e Validação**

- **React Hook Form** - Gerenciamento de formulários
- **@hookform/resolvers** - Resolvers para validação
- **Zod** - Schema validation e TypeScript type inference
- **input-otp** - Input para códigos OTP

### **Tabelas e Dados**

- **@tanstack/react-table** - Tabelas poderosas e flexíveis
- **Recharts** - Biblioteca de gráficos para React

### **Drag and Drop**

- **@dnd-kit/core** - Core do sistema de drag and drop
- **@dnd-kit/modifiers** - Modificadores para drag and drop
- **@dnd-kit/sortable** - Listas ordenáveis
- **@dnd-kit/utilities** - Utilitários para dnd-kit

### **Carrosséis e Mídia**

- **Embla Carousel React** - Biblioteca de carrossel

### **Autenticação e Segurança**

- **NextAuth.js 5.0.0** - Autenticação para Next.js
- **bcryptjs** - Hashing de senhas

### **Banco de Dados**

- **MongoDB 7.0.0** - Banco de dados NoSQL
- **Mongoose 8.19.3** - ODM (Object Data Modeling) para MongoDB

### **Utilitários de Data**

- **date-fns** - Biblioteca moderna de manipulação de datas

### **Temas**

- **next-themes** - Gerenciamento de temas (dark/light mode)

### **Painéis Redimensionáveis**

- **react-resizable-panels** - Painéis redimensionáveis

### **Tours e Onboarding**

- **driver.js** - Tours guiados pela aplicação

### **Analytics**

- **@vercel/analytics** - Analytics da Vercel

### **Ferramentas de Desenvolvimento**

- **tsx** - Executor TypeScript para scripts
- **ts-node** - Executor TypeScript para Node.js
- **glob** - Pattern matching de arquivos

---

## 🗺️ Mapa de Páginas

### **Página Principal**

- `/` - Landing page / Home

### **Autenticação**

- `/auth/login` - Login de usuários
- `/auth/register` - Registro de novos usuários
- `/feed/auth/login` - Login alternativo (feed)
- `/feed/auth/login/company` - Login para empresas
- `/feed/auth/register` - Registro alternativo (feed)
- `/feed/auth/forgot-password` - Recuperação de senha

### **Feed Social**

- `/feed` - Feed principal de posts sociais

### **Dashboard**

- `/dashboard` - Dashboard principal do usuário
- `/dashboard/create-company` - Criação de nova empresa

### **Vagas de Emprego**

- `/jobs` - Lista de todas as vagas disponíveis
- `/jobs/[id]` - Detalhes de uma vaga específica
- `/jobs/[id]/apply` - Aplicação para uma vaga
- `/jobs/my-jobs` - Minhas vagas (candidaturas)
- `/jobs/preferences` - Preferências de vagas
- `/jobs/statistics` - Estatísticas de vagas

### **JobBoard**

- `/jobboard/[slug]` - Página de jobboard por slug

### **Empresas**

- `/company/[id]` - Perfil da empresa
- `/company/[id]/invite` - Convite para empresa
- `/company/[id]/admin` - Painel administrativo da empresa
- `/company/[id]/admin/users` - Gerenciamento de usuários da empresa
- `/company/[id]/admin/applications` - Gerenciamento de candidaturas
- `/company/[id]/admin/applications/[applicationId]` - Detalhes de candidatura específica

### **Administração**

- `/admin` - Painel administrativo geral

### **Rede Social**

- `/network` - Rede de conexões/contatos

### **Mensagens**

- `/messages` - Sistema de mensagens

### **Notícias**

- `/news/[id]` - Artigo de notícia específico

### **Notificações**

- `/notifications` - Central de notificações

### **Configurações**

- `/settings/profile` - Edição de perfil
- `/settings/activities` - Atividades da conta
- `/settings/job-account` - Configurações de conta de emprego
- `/settings/config` - Configurações gerais
- `/settings/config/notifications` - Configurações de notificações
- `/settings/config/visibility` - Configurações de visibilidade
- `/settings/config/access-security` - Segurança e acesso
- `/settings/config/account-preferences` - Preferências da conta
- `/settings/config/advertising-data` - Dados de publicidade
- `/settings/config/data-privacy` - Privacidade de dados

### **Convites**

- `/invite/accept` - Aceitar convite

### **Teste**

- `/teste` - Página de testes

---

## 🎨 Principais Componentes

### **Componentes de Layout**

- `Header.tsx` - Cabeçalho da aplicação
- `RightSidebar.tsx` - Barra lateral direita
- `LeftSidebarJobs.tsx` - Barra lateral esquerda (jobs)

### **Componentes de Posts**

- `PostCard.tsx` - Card de post individual
- `PostCardSkeleton.tsx` - Skeleton loading para posts
- `PostDetailModal.tsx` - Modal de detalhes do post
- `PostActions.tsx` - Ações do post (like, comment, share)
- `PostDropdownMenu.tsx` - Menu dropdown do post
- `CreatePostBox.tsx` - Caixa para criar novo post
- `CreatePostModal.tsx` - Modal para criar post
- `MainFeed.tsx` - Feed principal de posts
- `FeaturedPostsCard.tsx` - Card de posts em destaque

### **Componentes de Jobs**

- `JobCard.tsx` - Card de vaga de emprego
- `JobCardSkeleton.tsx` - Skeleton loading para vagas
- `CreateJobModal.tsx` - Modal para criar vaga
- `ApplyJobModal.tsx` - Modal para candidatar-se a vaga

### **Componentes de Interação Social**

- `ReactionButton.tsx` - Botão de reação
- `ReactionMenu.tsx` - Menu de reações
- `ReactionNotification.tsx` - Notificação de reação
- `CommentSection.tsx` - Seção de comentários
- `CommentItem.tsx` - Item de comentário individual
- `ShareModal.tsx` - Modal de compartilhamento
- `SendMessagePopup.tsx` - Popup para enviar mensagem

### **Componentes de Mídia**

- `MediaGridLayout.tsx` - Layout em grid para mídia
- `MediaExpansionModal.tsx` - Modal de expansão de mídia
- `UploadMediaDialog.tsx` - Dialog para upload de mídia
- `UploadVideoDialog.tsx` - Dialog para upload de vídeo
- `ImageEditorModal.tsx` - Modal de edição de imagem
- `PhotoEditModal.tsx` - Modal de edição de foto

### **Componentes de Perfil**

- `EditProfileModal.tsx` - Modal de edição de perfil
- `ProfilePhotoModal.tsx` - Modal de foto de perfil
- `ProfileSkeleton.tsx` - Skeleton loading para perfil

### **Componentes de Navegação**

- `UserDropdownMenu.tsx` - Menu dropdown do usuário
- `NotificationsDropdown.tsx` - Dropdown de notificações
- `SearchModal.tsx` - Modal de busca
- `FloatingMessages.tsx` - Mensagens flutuantes

### **Componentes de Formulário**

- `ButtonGroupInput.tsx` - Input de grupo de botões
- `InstitutionCombobox.tsx` - Combobox de instituições
- `LocationCombobox.tsx` - Combobox de localização

### **Componentes Administrativos (Admin)**

- `create-application-drawer.tsx` - Drawer para criar candidatura
- `create-company-drawer.tsx` - Drawer para criar empresa
- `create-user-drawer.tsx` - Drawer para criar usuário
- `create-vacancy-drawer.tsx` - Drawer para criar vaga
- `edit-application-drawer.tsx` - Drawer para editar candidatura
- `edit-company-drawer.tsx` - Drawer para editar empresa
- `edit-user-drawer.tsx` - Drawer para editar usuário

### **Componentes de Dashboard**

- `data-table.tsx` - Tabela de dados
- `nav-main.tsx` - Navegação principal do dashboard

### **Outros Componentes**

- `AuthGuard.tsx` - Guarda de autenticação
- `BannerModal.tsx` - Modal de banner
- `TourGuide.tsx` - Guia de tour da aplicação
- `LinkedInIcon.tsx` - Ícone do LinkedIn
- `LogoIcon.tsx` - Ícone do logo

---

## 🔌 API Routes

A aplicação possui 73 rotas de API localizadas em `/app/api/`, incluindo endpoints para:

- Gerenciamento de posts
- Autenticação
- Perfis de usuário
- Vagas de emprego
- Empresas
- Mensagens
- Notificações
- Reações e comentários
- Upload de mídia
- E muito mais...

---

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter
- `npm run test:performance` - Testes de performance
- `npm run create-indexes` - Cria índices no banco de dados
- `npm run load-test` - Testes de carga
- `npm run load-test:db` - Testes de carga no banco de dados
- `npm run stress-test:db` - Testes de estresse no banco de dados
- `npm run analyze-db` - Análise de performance do banco
- `npm run check-data` - Verifica distribuição de dados

---

## 📦 Estrutura de Pastas

```
jobboard-social/
├── app/                    # Páginas e rotas (App Router)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard
│   ├── feed/              # Feed social
│   ├── jobs/              # Vagas de emprego
│   ├── company/           # Empresas
│   ├── admin/             # Administração
│   ├── settings/          # Configurações
│   └── ...
├── components/            # Componentes React reutilizáveis
│   ├── admin/            # Componentes administrativos
│   ├── dashboard/        # Componentes do dashboard
│   └── ...
├── hooks/                # Custom React Hooks
├── docs/                 # Documentação
└── scripts/              # Scripts utilitários
```

---

**Última atualização:** 03 de dezembro de 2025
