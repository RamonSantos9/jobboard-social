# Documentação da API

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
