# Documentação de Componentes

## Componentes Principais

### Componentes de UI Base

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

### Componentes de Post

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

### Componentes de Vaga

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

### Componentes de Dashboard

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

### Componentes de Gráficos

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

### Componentes de Perfil

- **`EditProfileModal.tsx`**: Modal de edição de perfil
  - Formulário completo
  - Upload de foto
  - Upload de banner
  - Experiências
  - Educação

- **`FeaturedPostsCard.tsx`**: Card de posts destacados
  - Lista de posts destacados
  - Visualização

### Componentes de Notificação

- **`NotificationsDropdown.tsx`**: Dropdown de notificações
  - Lista de notificações
  - Marcar como lida
  - Ações

- **`ReactionNotification.tsx`**: Notificação de reação
  - Exibição de reação
  - Link para post

### Componentes Administrativos

Localizados em `components/admin/`:

- **`create-user-drawer.tsx`**: Drawer de criação de usuário
- **`edit-user-drawer.tsx`**: Drawer de edição de usuário
- **`create-company-drawer.tsx`**: Drawer de criação de empresa
- **`edit-company-drawer.tsx`**: Drawer de edição de empresa
- **`create-vacancy-drawer.tsx`**: Drawer de criação de vaga
- **`edit-vacancy-drawer.tsx`**: Drawer de edição de vaga
- **`create-application-drawer.tsx`**: Drawer de criação de candidatura
- **`edit-application-drawer.tsx`**: Drawer de edição de candidatura
