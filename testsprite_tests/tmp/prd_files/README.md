# JobBoard Social 🚀

Uma plataforma social completa para profissionais e empresas se conectarem através de vagas e networking, construída com Next.js, Node.js e MongoDB.

## ✨ Funcionalidades

### 👥 Usuários

- **Cadastro e Login** com autenticação segura
- **Perfis personalizáveis** com foto, bio, skills e experiência
- **Sistema de conexões** (follow/unfollow)
- **Dashboard personalizado** com estatísticas

### 💼 Vagas

- **Postagem de vagas** para recrutadores
- **Sistema de candidaturas** com status tracking
- **Filtros avançados** por localização, tipo, nível
- **Feed dinâmico** com vagas relevantes

### 🌐 Social

- **Feed de posts** com interações (likes, comentários)
- **Sistema de notificações** em tempo real
- **Chat entre usuários** (DM)
- **Perfis públicos** estilo LinkedIn

### 🏢 Empresas

- **Perfis de empresa** com informações detalhadas
- **Gestão de vagas** e candidatos
- **Estatísticas de engajamento**

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: NextAuth.js
- **Estilização**: Tailwind CSS + Shadcn/UI
- **Upload de Mídia**: Cloudinary
- **Notificações**: Socket.io (opcional)

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd jobboard-social
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobboard-social

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

### 4. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🗄️ Estrutura do Banco de Dados

### Collections MongoDB

#### Users

```javascript
{
  email: String,
  password: String (hashed),
  role: 'candidate' | 'recruiter' | 'admin',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Profiles

```javascript
{
  userId: ObjectId,
  firstName: String,
  lastName: String,
  bio: String,
  headline: String,
  skills: [String],
  experience: [Object],
  education: [Object],
  location: String,
  photoUrl: String,
  bannerUrl: String,
  connectionsCount: Number
}
```

#### Jobs

```javascript
{
  companyId: ObjectId,
  title: String,
  description: String,
  requirements: [String],
  responsibilities: [String],
  salaryRange: Object,
  location: String,
  remote: Boolean,
  type: String,
  level: String,
  category: String,
  skills: [String],
  benefits: [String],
  status: String,
  applicationsCount: Number,
  viewsCount: Number
}
```

#### Applications

```javascript
{
  jobId: ObjectId,
  candidateId: ObjectId,
  resumeUrl: String,
  coverLetter: String,
  status: String,
  appliedAt: Date
}
```

#### Posts

```javascript
{
  authorId: ObjectId,
  content: String,
  mediaUrl: String,
  mediaType: String,
  likes: [ObjectId],
  commentsCount: Number,
  sharesCount: Number,
  hashtags: [String],
  mentions: [ObjectId]
}
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### MongoDB Atlas

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster gratuito
3. Configure a string de conexão no `.env.local`

### Variáveis de Ambiente para Produção

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobboard-social
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-forte
```

## 📁 Estrutura do Projeto

```
jobboard-social/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── dashboard/          # Dashboard do usuário
│   ├── jobs/              # Páginas de vagas
│   ├── profile/           # Perfis de usuários
│   ├── api/               # API Routes
│   │   ├── auth/          # Autenticação
│   │   ├── jobs/          # CRUD de vagas
│   │   ├── posts/         # CRUD de posts
│   │   ├── users/         # Dados dos usuários
│   │   └── applications/  # Candidaturas
├── components/            # Componentes React
│   └── ui/               # Componentes UI base
├── lib/                   # Utilitários e configurações
│   ├── db.ts             # Conexão MongoDB
│   ├── auth.ts           # Configuração NextAuth
│   └── utils.ts          # Funções auxiliares
├── models/               # Schemas MongoDB
│   ├── User.ts
│   ├── Profile.ts
│   ├── Job.ts
│   ├── Company.ts
│   ├── Post.ts
│   ├── Application.ts
│   └── Connection.ts
└── styles/               # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Linting do código
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Próximas Funcionalidades

- [ ] Sistema de mensagens em tempo real
- [ ] Notificações push
- [ ] Sistema de recomendações
- [ ] Analytics para empresas
- [ ] Integração com LinkedIn
- [ ] App mobile (React Native)
- [ ] Sistema de avaliações
- [ ] Marketplace de cursos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação](docs/)
2. Abra uma [issue](https://github.com/seu-usuario/jobboard-social/issues)
3. Entre em contato: seu-email@exemplo.com

---

Feito com ❤️ para conectar profissionais e oportunidades!
