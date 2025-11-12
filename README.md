# JobBoard Social

Plataforma social completa para profissionais e empresas se conectarem através de vagas e networking. Desenvolvida com Next.js 16, React 19, TypeScript, MongoDB e Tailwind CSS.

## Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Frontend](#frontend)
- [Backend](#backend)
- [Banco de Dados](#banco-de-dados)
- [Gráficos e Visualizações](#gráficos-e-visualizações)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Deploy](#deploy)
- [Contribuição](#contribuição)

---

## Visão Geral

JobBoard Social é uma plataforma que integra funcionalidades de rede social profissional com um sistema de gerenciamento de vagas. A aplicação permite que usuários criem perfis profissionais, conectem-se com outros profissionais, publiquem conteúdo, candidatem-se a vagas e empresas gerenciem suas vagas e candidatos.

### Principais Funcionalidades

- Autenticação e autorização com NextAuth.js
- Perfis personalizáveis de usuários e empresas
- Sistema de posts e comentários com reações
- Gerenciamento de vagas e candidaturas
- Sistema de notificações em tempo real
- Dashboard com gráficos e estatísticas
- Sistema de mensagens privadas
- Perfis públicos estilo LinkedIn
- Sistema de conexões (follow/unfollow)
- Recomendação de vagas baseada em perfil

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- Node.js 18.0.0 ou superior
- MongoDB 6.0 ou superior (ou MongoDB Atlas)
- npm 9.0.0 ou superior (ou yarn 1.22.0 ou superior)
- Git

### Verificação de Versões

```bash
node --version
npm --version
mongod --version
```

---

## Instalação

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd jobboard-social
```

### 2. Instale as Dependências

```bash
npm install
```

Ou usando yarn:

```bash
yarn install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

### 4. Execute o Projeto em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobboard-social
# ou para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobboard-social

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-key-aqui-gerar-um-hash-aleatorio

# Cloudinary (para upload de imagens)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret

# Opcional: Email
EMAIL_FROM=noreply@jobboard.com
EMAIL_SERVER=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=seu-email@example.com
EMAIL_PASSWORD=sua-senha
```

### Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Estrutura do Projeto

```
jobboard-social/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Páginas de autenticação
│   ├── admin/                    # Painel administrativo
│   ├── api/                      # API Routes (Backend)
│   ├── company/                  # Páginas de empresas
│   ├── dashboard/                # Dashboard do usuário
│   ├── feed/                     # Feed de posts
│   ├── jobs/                     # Páginas de vagas
│   ├── jobboard/                 # Perfis públicos
│   ├── settings/                 # Configurações do usuário
│   └── layout.tsx                # Layout principal
├── components/                   # Componentes React
│   ├── admin/                    # Componentes administrativos
│   ├── auth/                     # Componentes de autenticação
│   ├── dashboard/                # Componentes do dashboard
│   │   └── graphics/             # Componentes de gráficos
│   └── ui/                       # Componentes UI base (Shadcn)
├── lib/                          # Utilitários e configurações
│   ├── auth-utils.ts             # Utilitários de autenticação
│   ├── db.ts                     # Conexão MongoDB
│   ├── cloudinary.ts             # Configuração Cloudinary
│   └── utils.ts                  # Funções auxiliares
├── models/                       # Schemas Mongoose
│   ├── User.ts                   # Modelo de usuário
│   ├── Profile.ts                # Modelo de perfil
│   ├── Company.ts                # Modelo de empresa
│   ├── Post.ts                   # Modelo de post
│   ├── Vacancy.ts                # Modelo de vaga
│   ├── Application.ts            # Modelo de candidatura
│   ├── Comment.ts                # Modelo de comentário
│   ├── Notification.ts           # Modelo de notificação
│   ├── Message.ts                # Modelo de mensagem
│   └── Connection.ts             # Modelo de conexão
├── hooks/                        # React Hooks customizados
├── scripts/                      # Scripts de seed e utilitários
├── public/                       # Arquivos estáticos
└── types/                        # Definições de tipos TypeScript
```

---

## Frontend

### Arquitetura Frontend

O frontend é construído com Next.js 16 usando o App Router, React 19, TypeScript e Tailwind CSS. A aplicação utiliza componentes do Shadcn/UI para a interface e Recharts para gráficos.

### Tecnologias Frontend

- **Next.js 16.0.1**: Framework React com App Router
- **React 19.0.0**: Biblioteca JavaScript para interfaces
- **TypeScript 5.x**: Superset JavaScript com tipagem estática
- **Tailwind CSS 4.1.9**: Framework CSS utility-first
- **Shadcn/UI**: Componentes UI acessíveis e customizáveis
- **Recharts 2.15.4**: Biblioteca de gráficos para React
- **Framer Motion 12.23.24**: Biblioteca de animações
- **React Hook Form 7.60.0**: Gerenciamento de formulários
- **Zod 3.25.76**: Validação de esquemas
- **NextAuth.js 5.0.0-beta.25**: Autenticação
- **Sonner 1.7.4**: Sistema de notificações toast

### Páginas Principais

#### Autenticação

- **`/auth/login`**: Página de login
- **`/auth/register`**: Página de registro
- **`/feed/auth/login`**: Login no feed
- **`/feed/auth/register`**: Registro no feed

#### Dashboard

- **`/dashboard`**: Dashboard principal do usuário

  - Estatísticas de perfil
  - Gráficos de crescimento
  - Atividades recentes
  - Vagas recomendadas

- **`/dashboard/create-company`**: Criação de empresa

#### Feed

- **`/feed`**: Feed principal de posts
  - Criação de posts
  - Visualização de posts
  - Sistema de comentários
  - Reações e compartilhamentos

#### Vagas

- **`/jobs`**: Listagem de vagas

  - Filtros por localização, tipo, nível
  - Busca de vagas
  - Vagas recomendadas

- **`/jobs/[id]`**: Detalhes da vaga
  - Informações completas
  - Botão de candidatura
  - Informações da empresa

#### Empresas

- **`/company/[id]`**: Página da empresa

  - Informações da empresa
  - Vagas disponíveis
  - Estatísticas

- **`/company/[id]/admin`**: Painel administrativo da empresa

  - Gerenciamento de vagas
  - Candidaturas
  - Estatísticas

- **`/company/[id]/invite`**: Convites para empresa

#### Perfis

- **`/jobboard/[slug]`**: Perfil público do usuário

  - Informações do perfil
  - Experiências
  - Educação
  - Posts destacados

- **`/settings/profile`**: Configurações do perfil
  - Edição de perfil
  - Upload de foto
  - Upload de banner

#### Admin

- **`/admin`**: Painel administrativo
  - Gerenciamento de usuários
  - Gerenciamento de empresas
  - Gerenciamento de vagas
  - Gerenciamento de candidaturas
  - Estatísticas gerais

### Componentes Principais

#### Componentes de UI Base

Localizados em `components/ui/`, estes são componentes base do Shadcn/UI:

- **Button**: Botão customizável
- **Card**: Container de card
- **Dialog**: Modal/dialog
- **Dropdown Menu**: Menu dropdown
- **Input**: Campo de entrada
- **Textarea**: Área de texto
- **Select**: Seleção
- **Avatar**: Avatar de usuário
- **Badge**: Badge/etiqueta
- **Tabs**: Abas
- **Table**: Tabela
- **Chart**: Componentes de gráfico

#### Componentes de Post

- **`PostCard.tsx`**: Card de post no feed

  - Exibe conteúdo do post
  - Mídia (imagens/vídeos)
  - Reações
  - Comentários
  - Compartilhamentos

- **`PostDetailModal.tsx`**: Modal de detalhes do post

  - Visualização completa do post
  - Seção de comentários
  - Reações detalhadas

- **`CreatePostBox.tsx`**: Caixa de criação de post

  - Editor de texto
  - Upload de mídia
  - Menções
  - Hashtags

- **`CommentSection.tsx`**: Seção de comentários

  - Lista de comentários
  - Formulário de comentário
  - Respostas a comentários

- **`CommentItem.tsx`**: Item de comentário

  - Exibição do comentário
  - Respostas
  - Ações (like, responder)

- **`ReactionButton.tsx`**: Botão de reação

  - Menu de reações
  - Contagem de reações

- **`ReactionMenu.tsx`**: Menu de reações
  - Like
  - Celebrate
  - Support
  - Interesting
  - Funny
  - Love

#### Componentes de Vaga

- **`JobCard.tsx`**: Card de vaga

  - Informações da vaga
  - Empresa
  - Localização
  - Tipo e nível
  - Botão de candidatura

- **`CreateJobModal.tsx`**: Modal de criação de vaga

  - Formulário de vaga
  - Campos detalhados
  - Validação

- **`ApplyJobModal.tsx`**: Modal de candidatura
  - Upload de currículo
  - Carta de apresentação
  - Informações do candidato

#### Componentes de Dashboard

- **`StatsCards.tsx`**: Cards de estatísticas

  - Total de usuários
  - Total de vagas
  - Total de posts
  - Total de empresas

- **`SectionsCards.tsx`**: Cards de seções

  - Seções do dashboard
  - Navegação

- **`DataTable.tsx`**: Tabela de dados
  - Tabela com paginação
  - Filtros
  - Ordenação

#### Componentes de Gráficos

Localizados em `components/dashboard/graphics/`:

- **`chart-area-interactive.tsx`**: Gráfico de área interativo

  - Exibe crescimento de usuários e vagas
  - Filtros por período (7 dias, 30 dias, 90 dias)
  - Tooltip com informações detalhadas
  - Responsivo para mobile

- **`chart-bar-label-custom.tsx`**: Gráfico de barras com labels customizados

  - Barras verticais
  - Labels personalizados
  - Cores customizáveis

- **`chart-line-label.tsx`**: Gráfico de linhas com labels

  - Linhas de tendência
  - Múltiplas séries
  - Labels formatados

- **`chart-pie-interactive.tsx`**: Gráfico de pizza interativo

  - Distribuição de dados
  - Interatividade
  - Tooltip

- **`chart-pie-label-custom.tsx`**: Gráfico de pizza com labels customizados

  - Labels personalizados
  - Cores customizáveis

- **`chart-radial-shape.tsx`**: Gráfico radial
  - Formato circular
  - Múltiplas séries
  - Animações

#### Componentes de Perfil

- **`EditProfileModal.tsx`**: Modal de edição de perfil

  - Formulário completo
  - Upload de foto
  - Upload de banner
  - Experiências
  - Educação

- **`FeaturedPostsCard.tsx`**: Card de posts destacados
  - Lista de posts destacados
  - Visualização

#### Componentes de Notificação

- **`NotificationsDropdown.tsx`**: Dropdown de notificações

  - Lista de notificações
  - Marcar como lida
  - Ações

- **`ReactionNotification.tsx`**: Notificação de reação
  - Exibição de reação
  - Link para post

#### Componentes Administrativos

Localizados em `components/admin/`:

- **`create-user-drawer.tsx`**: Drawer de criação de usuário
- **`edit-user-drawer.tsx`**: Drawer de edição de usuário
- **`create-company-drawer.tsx`**: Drawer de criação de empresa
- **`edit-company-drawer.tsx`**: Drawer de edição de empresa
- **`create-vacancy-drawer.tsx`**: Drawer de criação de vaga
- **`edit-vacancy-drawer.tsx`**: Drawer de edição de vaga
- **`create-application-drawer.tsx`**: Drawer de criação de candidatura
- **`edit-application-drawer.tsx`**: Drawer de edição de candidatura

### Hooks Customizados

- **`use-mobile.ts`**: Hook para detectar dispositivos móveis
- **`use-modal-system.ts`**: Hook para gerenciar sistema de modais

### Estilização

#### Tailwind CSS

A aplicação utiliza Tailwind CSS 4.1.9 para estilização. As configurações estão em `tailwind.config.js`.

#### Temas

A aplicação suporta temas claro e escuro usando `next-themes`.

#### Componentes Shadcn/UI

Os componentes UI são baseados no Shadcn/UI, que utiliza Radix UI para acessibilidade e Tailwind CSS para estilização.

---

## Backend

### Arquitetura Backend

O backend é construído com Next.js API Routes, MongoDB com Mongoose, e NextAuth.js para autenticação. Todas as rotas de API estão localizadas em `app/api/`.

### Tecnologias Backend

- **Next.js API Routes**: Rotas de API integradas
- **MongoDB 6.0+**: Banco de dados NoSQL
- **Mongoose 8.19.3**: ODM para MongoDB
- **NextAuth.js 5.0.0-beta.25**: Autenticação e autorização
- **bcryptjs 3.0.3**: Hash de senhas
- **Cloudinary**: Upload e gerenciamento de mídia
- **Zod 3.25.76**: Validação de dados

### Estrutura de APIs

#### Autenticação

**`/api/auth/[...nextauth]/route.ts`**

- Configuração do NextAuth.js
- Providers de autenticação
- Callbacks
- Session management

**`/api/auth/login/route.ts`**

- Login de usuário
- Validação de credenciais
- Retorno de sessão

**`/api/auth/register/route.ts`**

- Registro de usuário
- Criação de perfil
- Validação de dados

**`/api/auth/check-admin/route.ts`**

- Verificação de permissões de admin
- Retorno de status de admin

#### Usuários

**`/api/users/route.ts`**

- GET: Listagem de usuários
- Filtros e busca
- Paginação

#### Perfis

**`/api/profile/route.ts`**

- GET: Perfil do usuário logado
- PUT: Atualização de perfil
- Upload de foto e banner

**`/api/profile/public/[slug]/route.ts`**

- GET: Perfil público por slug
- Informações públicas do perfil

**`/api/profile/banner/route.ts`**

- POST: Upload de banner
- Processamento de imagem

#### Posts

**`/api/posts/route.ts`**

- GET: Listagem de posts
  - Filtros
  - Paginação
  - Ordenação
- POST: Criação de post
  - Validação de conteúdo
  - Processamento de mídia
  - Extração de menções e hashtags

**`/api/posts/[id]/route.ts`**

- GET: Detalhes do post
- PUT: Atualização do post
- DELETE: Exclusão do post

**`/api/posts/[id]/like/route.ts`**

- POST: Like/Unlike no post
- Atualização de contadores

**`/api/posts/[id]/reaction/route.ts`**

- POST: Adicionar reação
- PUT: Atualizar reação
- DELETE: Remover reação

**`/api/posts/[id]/comments/route.ts`**

- GET: Listagem de comentários
- POST: Criar comentário
  - Validação
  - Respostas a comentários
  - Menções

**`/api/posts/[id]/share/route.ts`**

- POST: Compartilhar post
- Atualização de contadores

**`/api/posts/[id]/save/route.ts`**

- POST: Salvar post
- DELETE: Remover post salvo

**`/api/posts/[id]/highlight/route.ts`**

- POST: Destacar post
- DELETE: Remover destaque

**`/api/posts/[id]/hide/route.ts`**

- POST: Ocultar post
- DELETE: Mostrar post

**`/api/posts/[id]/report/route.ts`**

- POST: Reportar post
- Validação de report

**`/api/posts/highlighted/[userId]/route.ts`**

- GET: Posts destacados do usuário

#### Vagas

**`/api/jobs/route.ts`**

- GET: Listagem de vagas
  - Filtros
  - Paginação
  - Ordenação

**`/api/jobs/[id]/route.ts`**

- GET: Detalhes da vaga
- PUT: Atualização da vaga
- DELETE: Exclusão da vaga

**`/api/jobs/create/route.ts`**

- POST: Criação de vaga
  - Validação de dados
  - Verificação de permissões
  - Criação de notificações

**`/api/jobs/recommended/route.ts`**

- GET: Vagas recomendadas
  - Algoritmo de recomendação
  - Baseado em perfil do usuário
  - Skills e experiência

#### Candidaturas

**`/api/applications/route.ts`**

- POST: Criar candidatura
  - Validação
  - Upload de currículo
  - Criação de notificações

**`/api/applications/[id]/route.ts`**

- GET: Detalhes da candidatura
- PUT: Atualizar candidatura
- DELETE: Excluir candidatura

#### Empresas

**`/api/company/create/route.ts`**

- POST: Criar empresa
  - Validação
  - Criação de perfil
  - Atribuição de admin

**`/api/company/[id]/route.ts`**

- GET: Detalhes da empresa
- PUT: Atualizar empresa
- DELETE: Excluir empresa

**`/api/company/invite/route.ts`**

- POST: Enviar convite
  - Validação
  - Criação de notificação
  - Envio de email

**`/api/company/recruiters/[id]/approve/route.ts`**

- POST: Aprovar recrutador
  - Validação de permissões
  - Atualização de status

**`/api/company/recruiters/[id]/reject/route.ts`**

- POST: Rejeitar recrutador
  - Validação de permissões
  - Remoção de solicitação

#### Conexões

**`/api/follow/[id]/route.ts`**

- POST: Seguir usuário
- DELETE: Deixar de seguir

**`/api/follow/check/[id]/route.ts`**

- GET: Verificar se está seguindo
- Retorno de status

#### Notificações

**`/api/notifications/route.ts`**

- GET: Listagem de notificações
  - Filtros
  - Paginação
  - Ordenação por data

**`/api/notifications/mark-read/route.ts`**

- POST: Marcar notificação como lida
- PUT: Marcar todas como lidas

#### Dashboard

**`/api/dashboard/stats/route.ts`**

- GET: Estatísticas gerais
  - Total de usuários
  - Total de vagas
  - Total de posts
  - Total de empresas
  - Tendências

**`/api/dashboard/company-stats/route.ts`**

- GET: Estatísticas da empresa
  - Vagas
  - Candidaturas
  - Visualizações

**`/api/dashboard/company/[id]/stats/route.ts`**

- GET: Estatísticas específicas da empresa
  - Detalhes
  - Gráficos

**`/api/dashboard/recent-activities/route.ts`**

- GET: Atividades recentes
  - Posts
  - Candidaturas
  - Conexões

#### Admin

**`/api/admin/users/route.ts`**

- GET: Listagem de usuários (admin)
- POST: Criar usuário (admin)

**`/api/admin/users/[id]/route.ts`**

- GET: Detalhes do usuário (admin)
- PUT: Atualizar usuário (admin)
- DELETE: Excluir usuário (admin)

**`/api/admin/users/search/route.ts`**

- GET: Buscar usuários (admin)
  - Filtros
  - Busca por nome/email

**`/api/admin/users/recent/route.ts`**

- GET: Usuários recentes (admin)

**`/api/admin/companies/route.ts`**

- GET: Listagem de empresas (admin)
- POST: Criar empresa (admin)

**`/api/admin/companies/[id]/route.ts`**

- GET: Detalhes da empresa (admin)
- PUT: Atualizar empresa (admin)
- DELETE: Excluir empresa (admin)

**`/api/admin/companies/[id]/assign-admin/route.ts`**

- POST: Atribuir admin à empresa
  - Validação de permissões

**`/api/admin/companies/recent/route.ts`**

- GET: Empresas recentes (admin)

**`/api/admin/vacancies/route.ts`**

- GET: Listagem de vagas (admin)
- POST: Criar vaga (admin)

**`/api/admin/vacancies/[id]/route.ts`**

- GET: Detalhes da vaga (admin)
- PUT: Atualizar vaga (admin)
- DELETE: Excluir vaga (admin)

**`/api/admin/applications/route.ts`**

- GET: Listagem de candidaturas (admin)
- POST: Criar candidatura (admin)

**`/api/admin/applications/[id]/route.ts`**

- GET: Detalhes da candidatura (admin)
- PUT: Atualizar candidatura (admin)
- DELETE: Excluir candidatura (admin)

**`/api/admin/dashboard-data/route.ts`**

- GET: Dados do dashboard (admin)
  - Estatísticas gerais
  - Gráficos
  - Tendências

#### Upload

**`/api/upload/route.ts`**

- POST: Upload de arquivos
  - Imagens
  - Vídeos
  - Documentos
  - Processamento com Cloudinary

#### Mensagens

**`/api/messages/route.ts`**

- GET: Listagem de mensagens
- POST: Enviar mensagem
  - Validação
  - Criação de notificação

#### Convites

**`/api/invite/accept/route.ts`**

- POST: Aceitar convite
  - Validação
  - Atualização de status

**`/api/invite/accept-notification/route.ts`**

- POST: Aceitar convite via notificação
  - Validação
  - Atualização de status

**`/api/invite/verify/route.ts`**

- GET: Verificar convite
  - Validação de token
  - Retorno de informações

### Modelos de Dados

#### User Model

Localizado em `models/User.ts`:

```typescript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "user" | "admin",
  companyId: ObjectId (ref: Company),
  isRecruiter: Boolean,
  status: "active" | "pending" | "suspended",
  onboardingCompleted: Boolean,
  isActive: Boolean,
  profile: ObjectId (ref: Profile),
  createdAt: Date,
  updatedAt: Date
}
```

#### Profile Model

Localizado em `models/Profile.ts`:

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  firstName: String,
  lastName: String,
  slug: String (unique),
  bio: String,
  headline: String,
  skills: [String],
  experience: [{
    title: String,
    company: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  location: String,
  photoUrl: String,
  bannerUrl: String,
  connectionsCount: Number,
  followersCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Company Model

Localizado em `models/Company.ts`:

```typescript
{
  _id: ObjectId,
  name: String,
  cnpj: String (unique),
  industry: String,
  description: String,
  size: String,
  location: String,
  website: String,
  logoUrl: String,
  bannerUrl: String,
  admins: [ObjectId] (ref: User),
  recruiters: [ObjectId] (ref: User),
  isVerified: Boolean,
  jobsCount: Number,
  followersCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Post Model

Localizado em `models/Post.ts`:

```typescript
{
  _id: ObjectId,
  authorId: ObjectId (ref: User),
  companyId: ObjectId (ref: Company, optional),
  content: String,
  mediaUrl: String,
  mediaUrls: [String],
  mediaType: "image" | "video",
  likes: [ObjectId] (ref: User),
  reactions: [{
    userId: ObjectId (ref: User),
    companyId: ObjectId (ref: Company, optional),
    type: "like" | "celebrate" | "support" | "interesting" | "funny" | "love"
  }],
  commentsCount: Number,
  sharesCount: Number,
  hashtags: [String],
  mentions: [ObjectId] (ref: User),
  isHighlighted: Boolean,
  isHidden: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Vacancy Model

Localizado em `models/Vacancy.ts`:

```typescript
{
  _id: ObjectId,
  companyId: ObjectId (ref: Company),
  title: String,
  description: String,
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  skills: [String],
  location: String,
  remote: Boolean,
  type: "full-time" | "part-time" | "contract" | "internship",
  level: "junior" | "pleno" | "senior" | "especialista",
  category: String,
  salaryRange: {
    min: Number,
    max: Number,
    currency: String
  },
  workLocationType: "remote" | "hybrid" | "on-site",
  status: "open" | "closed" | "paused",
  applicationsCount: Number,
  viewsCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Application Model

Localizado em `models/Application.ts`:

```typescript
{
  _id: ObjectId,
  jobId: ObjectId (ref: Vacancy),
  candidateId: ObjectId (ref: User),
  resumeUrl: String,
  coverLetter: String,
  status: "pending" | "reviewing" | "accepted" | "rejected",
  appliedAt: Date,
  updatedAt: Date
}
```

#### Comment Model

Localizado em `models/Comment.ts`:

```typescript
{
  _id: ObjectId,
  postId: ObjectId (ref: Post),
  authorId: ObjectId (ref: User),
  content: String,
  parentId: ObjectId (ref: Comment, optional),
  likes: [ObjectId] (ref: User),
  repliesCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Notification Model

Localizado em `models/Notification.ts`:

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String,
  title: String,
  message: String,
  link: String,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Message Model

Localizado em `models/Message.ts`:

```typescript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  content: String,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Connection Model

Localizado em `models/Connection.ts`:

```typescript
{
  _id: ObjectId,
  followerId: ObjectId (ref: User),
  followingId: ObjectId (ref: User),
  createdAt: Date
}
```

### Autenticação e Autorização

#### NextAuth.js

A aplicação utiliza NextAuth.js 5.0.0-beta.25 para autenticação. A configuração está em `auth.ts` e `app/api/auth/[...nextauth]/route.ts`.

#### Fluxo de Autenticação

1. Usuário faz login com email e senha
2. Credenciais são validadas no banco de dados
3. Senha é verificada com bcrypt
4. Sessão é criada com NextAuth.js
5. Token JWT é gerado e armazenado em cookie

#### Autorização

- **Usuário comum**: Acesso às funcionalidades básicas
- **Recrutador**: Acesso a funcionalidades de recrutamento
- **Admin de empresa**: Acesso ao painel da empresa
- **Admin do sistema**: Acesso ao painel administrativo

### Validação de Dados

A aplicação utiliza Zod para validação de dados em todas as rotas de API. Os esquemas de validação são definidos em cada rota.

### Upload de Arquivos

#### Cloudinary

A aplicação utiliza Cloudinary para upload e gerenciamento de mídia. A configuração está em `lib/cloudinary.ts`.

#### Tipos de Arquivo Suportados

- Imagens: JPG, PNG, GIF, WebP
- Vídeos: MP4, WebM
- Documentos: PDF, DOC, DOCX

#### Processamento

- Redimensionamento de imagens
- Otimização de qualidade
- Geração de thumbnails
- Conversão de formato

---

## Banco de Dados

### MongoDB

A aplicação utiliza MongoDB como banco de dados principal. A conexão é gerenciada através do Mongoose.

### Conexão

A conexão com o MongoDB é configurada em `lib/db.ts`:

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

### Índices

Os modelos incluem índices para melhorar a performance:

- **User**: índice único em `email`
- **Profile**: índice único em `slug`, índice em `userId`
- **Company**: índice único em `cnpj`, índice em `name`
- **Post**: índice em `authorId`, `companyId`, `createdAt`
- **Vacancy**: índice em `companyId`, `status`, `createdAt`
- **Application**: índice em `jobId`, `candidateId`, `status`
- **Comment**: índice em `postId`, `authorId`, `parentId`
- **Notification**: índice em `userId`, `read`, `createdAt`
- **Message**: índice em `senderId`, `receiverId`, `createdAt`
- **Connection**: índice único em `followerId` e `followingId`

### Relacionamentos

Os modelos estão relacionados através de referências:

- **User** → **Profile** (1:1)
- **User** → **Company** (N:1)
- **User** → **Post** (1:N)
- **Company** → **Post** (1:N)
- **Company** → **Vacancy** (1:N)
- **Vacancy** → **Application** (1:N)
- **User** → **Application** (1:N)
- **Post** → **Comment** (1:N)
- **Comment** → **Comment** (1:N, self-referential)
- **User** → **Notification** (1:N)
- **User** → **Message** (1:N, como sender e receiver)
- **User** → **Connection** (1:N, como follower e following)

---

## Gráficos e Visualizações

### Biblioteca Recharts

A aplicação utiliza Recharts 2.15.4 para criar gráficos interativos e responsivos.

### Componentes de Gráfico

#### ChartAreaInteractive

Localizado em `components/dashboard/graphics/chart-area-interactive.tsx`:

- **Tipo**: Gráfico de área
- **Dados**: Crescimento de usuários e vagas ao longo do tempo
- **Funcionalidades**:

  - Filtros por período (7 dias, 30 dias, 90 dias)
  - Tooltip interativo
  - Gradientes de cor
  - Responsivo para mobile
  - Animações suaves

- **Configuração**:

  - Duas séries: usuários e vagas
  - Eixo X: meses (formato: MMM/YY)
  - Eixo Y: contagem
  - Cores: variáveis CSS personalizáveis

- **API**: `/api/dashboard/stats`
  - Retorna `trends.usersByMonth` e `trends.vacanciesByMonth`
  - Formato: `{ month: "YYYY-MM", count: number }`

#### ChartBarLabelCustom

Localizado em `components/dashboard/graphics/chart-bar-label-custom.tsx`:

- **Tipo**: Gráfico de barras
- **Dados**: Dados categóricos com labels customizados
- **Funcionalidades**:
  - Barras verticais
  - Labels personalizados
  - Cores customizáveis
  - Tooltip interativo

#### ChartLineLabel

Localizado em `components/dashboard/graphics/chart-line-label.tsx`:

- **Tipo**: Gráfico de linhas
- **Dados**: Tendências ao longo do tempo
- **Funcionalidades**:
  - Múltiplas séries
  - Labels formatados
  - Linhas suaves
  - Marcadores de pontos

#### ChartPieInteractive

Localizado em `components/dashboard/graphics/chart-pie-interactive.tsx`:

- **Tipo**: Gráfico de pizza
- **Dados**: Distribuição de dados
- **Funcionalidades**:
  - Interatividade
  - Tooltip
  - Animações
  - Legendas

#### ChartPieLabelCustom

Localizado em `components/dashboard/graphics/chart-pie-label-custom.tsx`:

- **Tipo**: Gráfico de pizza
- **Dados**: Distribuição com labels customizados
- **Funcionalidades**:
  - Labels personalizados
  - Cores customizáveis
  - Tooltip interativo

#### ChartRadialShape

Localizado em `components/dashboard/graphics/chart-radial-shape.tsx`:

- **Tipo**: Gráfico radial
- **Dados**: Dados em formato circular
- **Funcionalidades**:
  - Formato circular
  - Múltiplas séries
  - Animações
  - Tooltip

### Configuração de Gráficos

Os gráficos utilizam a configuração definida em `components/ui/chart.tsx`:

```typescript
interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}
```

### Responsividade

Todos os gráficos são responsivos e se adaptam a diferentes tamanhos de tela:

- **Desktop**: Gráficos completos com todas as funcionalidades
- **Tablet**: Gráficos adaptados com menos detalhes
- **Mobile**: Gráficos simplificados com controles otimizados

### Dados dos Gráficos

#### Estatísticas Gerais

**Endpoint**: `/api/dashboard/stats`

```json
{
  "totalUsers": 1000,
  "totalVacancies": 500,
  "totalPosts": 2000,
  "totalCompanies": 100,
  "trends": {
    "usersByMonth": [
      { "month": "2024-01", "count": 100 },
      { "month": "2024-02", "count": 150 }
    ],
    "vacanciesByMonth": [
      { "month": "2024-01", "count": 50 },
      { "month": "2024-02", "count": 75 }
    ]
  }
}
```

#### Estatísticas da Empresa

**Endpoint**: `/api/dashboard/company/[id]/stats`

```json
{
  "totalVacancies": 50,
  "totalApplications": 200,
  "totalViews": 1000,
  "applicationsByMonth": [
    { "month": "2024-01", "count": 20 },
    { "month": "2024-02", "count": 30 }
  ]
}
```

---

## Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev
```

Inicia o servidor de desenvolvimento em [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Cria uma build otimizada para produção.

### Produção

```bash
npm run start
```

Inicia o servidor de produção (requer build anterior).

### Linting

```bash
npm run lint
```

Executa o ESLint para verificar erros no código.

### Scripts Customizados

#### Seed de Dados

```bash
node scripts/seed-vagas.ts
```

Cria dados de exemplo para desenvolvimento.

#### Seed de Dashboard

```bash
node scripts/seed-dashboard.ts
```

Cria dados de exemplo para o dashboard.

---

## Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

#### Variáveis de Ambiente na Vercel

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobboard-social
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-forte
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

### MongoDB Atlas

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster gratuito
3. Configure a string de conexão no `.env.local`
4. Adicione seu IP à whitelist

### Cloudinary

1. Crie uma conta no [Cloudinary](https://cloudinary.com)
2. Obtenha suas credenciais (Cloud Name, API Key, API Secret)
3. Configure no `.env.local`

### Variáveis de Ambiente para Produção

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobboard-social
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-forte-gerada-com-openssl
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
EMAIL_FROM=noreply@seu-dominio.com
EMAIL_SERVER=smtp.seu-dominio.com
EMAIL_PORT=587
EMAIL_USER=seu-email@seu-dominio.com
EMAIL_PASSWORD=sua-senha
```

---

## Contribuição

Agradecemos muito sua disposição para contribuir com este projeto!

Para obter informações detalhadas sobre como contribuir, consulte o [Guia de Contribuição](CONTRIBUTING.md).

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Verifique se há outros PRs similares antes de começar
- Formate seu código com `npm run lint`
- Certifique-se de que todos os testes passam
- Execute o build localmente para verificar se não há erros
- Atualize a documentação se necessário

### Nova Funcionalidade

Antes de enviar uma nova funcionalidade, certifique-se de abrir uma issue (Solicitação de Funcionalidade) com informações suficientes e razões sobre a nova funcionalidade.

Após a solicitação de funcionalidade ser aprovada, você pode enviar um pull request.

### Correções de Bugs

Forneça uma descrição detalhada do bug (com demonstração ao vivo se possível).

OU abra um relatório de bug e vincule-o no seu PR.

### Documentação

Contribuir para a documentação é relativamente mais fácil, certifique-se de verificar os erros de digitação e gramática antes de enviar.

### Novo em Contribuições?

Você pode começar contribuindo com a documentação, ela está localizada em:

- `README.md`: Documentação principal
- `CONTRIBUTING.md`: Guia de contribuição
- Comentários no código: Documentação inline

Para executar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Você não precisa de variáveis de ambiente extras para executar o projeto localmente (exceto MongoDB).

### Padrões de Código

- Utilize TypeScript para todo o código
- Siga os padrões de código do ESLint
- Adicione comentários para código complexo
- Escreva testes para novas funcionalidades
- Documente novas APIs e componentes

### Estrutura de Commits

Siga o padrão Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

---

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a documentação
2. Abra uma [issue](https://github.com/ramonsantos9/jobboard-social/issues)
3. Entre em contato: ramonrodrigues@aluno.faculdadeserradourada.com

---

## Próximas Funcionalidades

- [ ] Sistema de mensagens em tempo real com WebSockets
- [ ] Notificações push
- [ ] Sistema de recomendações avançado
- [ ] Analytics detalhados para empresas
- [ ] Sistema de avaliações
- [ ] Marketplace de cursos
- [ ] Sistema de badges e conquistas
- [ ] Modo escuro completo

---

Desenvolvido com Next.js, React, TypeScript, MongoDB e Tailwind CSS.
