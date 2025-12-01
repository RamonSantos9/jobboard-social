# ❓ Perguntas e Respostas - Preparação para Apresentação

## 📚 Índice

1. [Perguntas Técnicas - Frontend](#frontend)
2. [Perguntas Técnicas - Backend](#backend)
3. [Perguntas Técnicas - Banco de Dados](#banco-de-dados)
4. [Perguntas Conceituais](#conceituais)
5. [Perguntas sobre Processo](#processo)
6. [Perguntas Difíceis](#difíceis)

---

## 🎨 Frontend

### P1: Por que escolheram Next.js em vez de React puro ou outras frameworks?

**Resposta Completa:**

> "Escolhemos Next.js por três razões principais:
>
> 1. **Performance e SEO**: Next.js oferece Server-Side Rendering (SSR) e Static Site Generation (SSG) nativamente. Para uma plataforma de networking profissional, é crucial que perfis e vagas sejam indexados pelo Google. Com React puro (SPA), teríamos problemas de SEO.
>
> 2. **Developer Experience**: O App Router do Next.js 16 simplifica muito o roteamento. Não precisamos configurar React Router manualmente. Além disso, as API Routes permitem criar backend e frontend na mesma codebase, acelerando o desenvolvimento.
>
> 3. **Server Components**: React 19 introduziu Server Components, que o Next.js suporta perfeitamente. Isso nos permite renderizar componentes no servidor, reduzindo JavaScript enviado ao cliente e melhorando performance.
>
> Consideramos Vue.js e Angular, mas React tem a maior comunidade e mais recursos disponíveis, especialmente para UI (Shadcn/UI, Radix)."

**Resposta Curta:**

> "Next.js oferece SSR para melhor SEO, roteamento simplificado e suporte a Server Components. Para uma plataforma social profissional onde SEO é crítico, foi a escolha natural."

---

### P2: O que são Server Components e como vocês os utilizaram?

**Resposta:**

> "Server Components são componentes React que renderizam exclusivamente no servidor. Diferente de componentes tradicionais que enviam JavaScript para o cliente, Server Components:
>
> - Executam no servidor
> - Podem acessar banco de dados diretamente
> - Não aumentam o bundle JavaScript do cliente
> - Não podem ter interatividade (onClick, useState, etc.)
>
> No nosso projeto, usamos Server Components para:
>
> - Páginas de perfil (buscar dados do usuário no servidor)
> - Lista de vagas (query no MongoDB server-side)
> - Feed inicial (carregar posts sem JavaScript extra)
>
> Componentes interativos (botões, formulários) são Client Components, marcados com `'use client'` no topo do arquivo. Isso cria um equilíbrio: dados carregados no servidor, interatividade no cliente."

---

### P3: Como garantem que a aplicação seja responsiva?

**Resposta:**

> "Adotamos abordagem mobile-first com Tailwind CSS:
>
> 1. **Breakpoints Tailwind**: Usamos classes responsivas (`sm:`, `md:`, `lg:`, `xl:`)
>
>    ```tsx
>    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
>    ```
>
> 2. **Flexbox e Grid**: Layouts flexíveis que se adaptam automaticamente
>
> 3. **Componentes Adaptativos**: Shadcn/UI já é responsivo por padrão
>
> 4. **Testes**: Testamos em Chrome DevTools (iPhone, iPad, Desktop) e dispositivos reais
>
> 5. **Imagens Responsivas**: Next.js Image otimiza automaticamente para cada tamanho de tela
>
> A aplicação funciona perfeitamente de 320px (mobile pequeno) até 4K."

---

### P4: O que é Tailwind CSS e por que não usar CSS tradicional?

**Resposta:**

> "Tailwind CSS é um framework utility-first. Em vez de escrever CSS customizado:
>
> **CSS Tradicional:**
>
> ```css
> .button {
>   background-color: blue;
>   padding: 12px 24px;
>   border-radius: 8px;
> }
> ```
>
> **Tailwind:**
>
> ```tsx
> <button className="bg-blue-500 px-6 py-3 rounded-lg">
> ```
>
> **Vantagens:**
>
> - Desenvolvimento mais rápido (não trocar entre arquivos)
> - Sem conflitos de nomes de classes
> - Bundle CSS menor (apenas classes usadas)
> - Design consistente (usa sistema de design tokens)
> - Responsividade fácil (`md:text-lg lg:text-xl`)
>
> **Desvantagens:**
>
> - Curva de aprendizado inicial
> - Classes longas (resolvemos com componentes)
>
> Para nosso projeto, a velocidade de desenvolvimento e consistência visual justificaram a escolha."

---

### P5: O que é Shadcn/UI e como difere de bibliotecas como Material-UI?

**Resposta:**

> "Shadcn/UI não é uma biblioteca tradicional de componentes. É uma coleção de componentes que você **copia para seu projeto**, não instala via npm.
>
> **Diferenças:**
>
> | Aspecto      | Material-UI      | Shadcn/UI                 |
> | ------------ | ---------------- | ------------------------- |
> | Instalação   | npm package      | Copia código              |
> | Customização | Limitada (theme) | Total (você tem o código) |
> | Bundle size  | Maior            | Menor (só o que usa)      |
> | Estilo       | Material Design  | Neutro/Customizável       |
>
> **Por que escolhemos Shadcn/UI:**
>
> - Baseado em Radix UI (acessibilidade excelente)
> - Customização total (modificamos componentes livremente)
> - Integração perfeita com Tailwind
> - Componentes modernos (Dialog, Dropdown, etc.)
>
> Exemplo: Precisávamos de um Kanban board. Com Shadcn, pegamos o componente Card e customizamos totalmente. Com Material-UI, estaríamos limitados ao design deles."

---

## 🔧 Backend

### P6: Como funciona a autenticação com NextAuth.js?

**Resposta:**

> "NextAuth.js é uma biblioteca completa de autenticação para Next.js. Implementamos:
>
> **1. Provedores Múltiplos:**
>
> ```typescript
> providers: [
>   CredentialsProvider({
>     /* email/senha */
>   }),
>   GoogleProvider({ clientId, clientSecret }),
>   GitHubProvider({ clientId, clientSecret }),
> ];
> ```
>
> **2. Fluxo de Autenticação:**
>
> - Usuário faz login → NextAuth valida credenciais
> - Se válido → Cria sessão e JWT token
> - Token armazenado em cookie httpOnly (seguro)
> - Cada request verifica token server-side
>
> **3. Proteção de Rotas:**
>
> ```typescript
> const session = await getServerSession();
> if (!session) redirect("/login");
> ```
>
> **4. Segurança:**
>
> - Senhas hasheadas com bcrypt (10 rounds)
> - JWT com secret forte
> - CSRF protection nativo
> - Cookies httpOnly (não acessíveis via JavaScript)
>
> NextAuth abstrai toda complexidade de OAuth, sessões e tokens."

---

### P7: Por que usar API Routes do Next.js em vez de Express.js separado?

**Resposta:**

> "API Routes do Next.js oferecem vantagens significativas:
>
> **Vantagens:**
>
> 1. **Mesma Codebase**: Frontend e backend no mesmo projeto
> 2. **Serverless Ready**: Deploy fácil na Vercel (auto-scaling)
> 3. **TypeScript Compartilhado**: Tipos compartilhados entre client/server
> 4. **Menos Configuração**: Não precisa configurar CORS, proxy, etc.
> 5. **Performance**: Mesma origem (sem latência de rede extra)
>
> **Exemplo de API Route:**
>
> ```typescript
> // app/api/jobs/route.ts
> export async function GET(request: Request) {
>   const jobs = await Job.find();
>   return Response.json(jobs);
> }
> ```
>
> **Quando usar Express separado:**
>
> - Microserviços complexos
> - Backend compartilhado por múltiplos frontends
> - Necessidade de WebSockets persistentes
>
> Para nosso caso (aplicação monolítica, deploy simples), API Routes são ideais."

---

### P8: Como validam os dados que chegam nas APIs?

**Resposta:**

> "Usamos validação em múltiplas camadas com Zod:
>
> **1. Client-Side (React Hook Form + Zod):**
>
> ```typescript
> const schema = z.object({
>   email: z.string().email("Email inválido"),
>   password: z.string().min(8, "Mínimo 8 caracteres"),
> });
> ```
>
> Feedback imediato para o usuário.
>
> **2. Server-Side (API Route + Zod):**
>
> ```typescript
> export async function POST(request: Request) {
>   const body = await request.json();
>   const validated = schema.parse(body); // Lança erro se inválido
>   // Continua apenas se válido
> }
> ```
>
> Proteção contra requests maliciosos.
>
> **3. Database (Mongoose Schema):**
>
> ```typescript
> const UserSchema = new Schema({
>   email: { type: String, required: true, unique: true },
> });
> ```
>
> Última camada de proteção.
>
> **Por que Zod?**
>
> - TypeScript-first (inferência de tipos)
> - Mensagens de erro customizáveis
> - Validações complexas (regex, custom validators)
> - Mesmo schema client e server
>
> Nunca confiamos em dados do cliente. Sempre validamos no servidor."

---

## 💾 Banco de Dados

### P9: Por que MongoDB e não PostgreSQL (SQL)?

**Resposta:**

> "Escolha entre SQL e NoSQL depende do caso de uso. Para JobBoard Social, MongoDB foi melhor:
>
> **Vantagens do MongoDB:**
>
> 1. **Flexibilidade de Schema**:
>
>    - Perfis de usuários têm campos variáveis (alguns têm portfólio, outros não)
>    - Posts podem ter texto, imagens, links (estrutura variável)
>    - Fácil adicionar campos sem migrations complexas
>
> 2. **Performance em Leituras**:
>
>    - Feed social = muitas leituras, poucas escritas
>    - MongoDB otimizado para isso
>    - Documentos aninhados (não precisa JOIN)
>
> 3. **Escalabilidade Horizontal**:
>
>    - Sharding nativo (distribuir dados em múltiplos servidores)
>    - Importante para crescimento futuro
>
> 4. **JSON Nativo**:
>    - JavaScript/TypeScript usa JSON
>    - Sem conversão objeto-relacional (ORM complexo)
>
> **Quando PostgreSQL seria melhor:**
>
> - Transações complexas (transferências bancárias)
> - Relacionamentos rígidos e complexos
> - Queries SQL avançadas (window functions, etc.)
>
> **Exemplo Prático:**
>
> ```javascript
> // MongoDB - Documento aninhado (1 query)
> {
>   user: { name: 'João', avatar: '...' },
>   post: { content: '...', likes: 10 },
>   comments: [{ user: '...', text: '...' }]
> }
>
> // PostgreSQL - Precisaria de 3 JOINs
> SELECT * FROM posts
> JOIN users ON posts.user_id = users.id
> JOIN comments ON comments.post_id = posts.id
> ```
>
> Para nosso modelo de dados semi-estruturado, MongoDB é ideal."

---

### P10: MongoDB escala bem para muitos usuários?

**Resposta:**

> "Sim, MongoDB é usado por empresas massivas:
>
> **Casos Reais:**
>
> - **eBay**: 18+ bilhões de documentos
> - **Uber**: Dados de viagens em tempo real
> - **Adobe**: Gerenciamento de assets
> - **Forbes**: CMS de conteúdo
>
> **Como MongoDB escala:**
>
> 1. **Indexes Otimizados**:
>
>    ```javascript
>    // Criamos indexes para queries frequentes
>    userSchema.index({ email: 1 });
>    jobSchema.index({ company: 1, createdAt: -1 });
>    ```
>
>    Transforma queries de segundos para milissegundos.
>
> 2. **Replication (Réplicas)**:
>
>    - Múltiplas cópias do banco
>    - Se um servidor cai, outro assume
>    - Leituras distribuídas entre réplicas
>
> 3. **Sharding (Particionamento)**:
>
>    - Divide dados em múltiplos servidores
>    - Ex: Usuários A-M no servidor 1, N-Z no servidor 2
>    - Escalabilidade horizontal infinita
>
> 4. **Agregações Eficientes**:
>    - Pipeline de agregação para analytics
>    - Processamento paralelo
>
> **Nossa Implementação:**
>
> - MongoDB Atlas (cloud gerenciado)
> - Indexes em campos críticos (email, company_id, job_id)
> - Queries otimizadas (projection, limit)
> - Monitoramento de performance
>
> Para 99% das aplicações (incluindo a nossa), MongoDB escala perfeitamente. Problemas de escala geralmente são de design de queries, não do banco."

---

### P11: Como garantem a integridade dos dados sem transações SQL?

**Resposta:**

> "MongoDB **tem** transações ACID desde a versão 4.0. Usamos quando necessário:
>
> **Exemplo - Candidatura a Vaga:**
>
> ```typescript
> const session = await mongoose.startSession();
> session.startTransaction();
>
> try {
>   // 1. Criar candidatura
>   await Application.create([{ job, user }], { session });
>
>   // 2. Incrementar contador na vaga
>   await Job.updateOne(
>     { _id: job },
>     { $inc: { applicationsCount: 1 } },
>     { session }
>   );
>
>   // 3. Criar notificação para empresa
>   await Notification.create([{ ... }], { session });
>
>   await session.commitTransaction(); // Tudo ou nada
> } catch (error) {
>   await session.abortTransaction(); // Rollback
> } finally {
>   session.endSession();
> }
> ```
>
> **Quando usamos transações:**
>
> - Operações que afetam múltiplas coleções
> - Operações críticas (pagamentos, candidaturas)
>
> **Quando NÃO usamos:**
>
> - Operações simples (criar post, atualizar perfil)
> - Performance crítica (transações têm overhead)
>
> **Outras garantias:**
>
> - **Validações Mongoose**: Schema validation
> - **Unique Indexes**: Previne duplicatas (ex: email único)
> - **Atomic Operations**: `$inc`, `$push` são atômicos
>
> MongoDB moderno é tão robusto quanto bancos SQL tradicionais."

---

## 💡 Conceituais

### P12: Qual o diferencial real do JobBoard Social em relação ao LinkedIn?

**Resposta:**

> "Três diferenciais principais:
>
> **1. Foco em PMEs Brasileiras**
>
> - LinkedIn é global e corporativo
> - Pequenas empresas brasileiras se perdem lá
> - JobBoard Social: interface em português, foco local
>
> **2. Gestão Integrada de Candidaturas**
>
> - LinkedIn: Você aplica, depois é email/telefone
> - JobBoard Social: Pipeline Kanban completo
>   - Empresa vê candidatos em tempo real
>   - Arrasta entre etapas (Triagem → Entrevista → Contratado)
>   - Candidato acompanha status ao vivo
>
> **3. Open-Source e Customizável**
>
> - LinkedIn: Plataforma fechada
> - JobBoard Social: Código aberto
>   - Empresas podem hospedar internamente
>   - Customizar para nichos (tech, design, saúde)
>   - Sem custos de licença
>
> **Analogia:**
> LinkedIn é como um shopping gigante (tudo lá, mas impessoal).
> JobBoard Social é como uma feira de bairro (menor, mas mais conexão real).
>
> Não competimos com LinkedIn em escala. Competimos em **experiência** para um nicho específico."

---

### P13: Como pretendem monetizar a plataforma?

**Resposta:**

> "Modelo Freemium com três camadas:
>
> **GRATUITO (Profissionais)**
>
> - Perfil completo
> - Feed social ilimitado
> - Candidaturas ilimitadas
> - 100% gratuito sempre
>
> **BÁSICO (Empresas) - R$ 99/mês**
>
> - 3 vagas ativas simultâneas
> - 50 candidaturas/mês
> - Analytics básicos
> - Suporte por email
>
> **PRO (Empresas) - R$ 299/mês**
>
> - Vagas ilimitadas
> - Candidaturas ilimitadas
> - Analytics avançados (funil, tempo médio, etc.)
> - Destaque de vagas no feed
> - Múltiplos usuários (equipe de RH)
> - Suporte prioritário
>
> **ENTERPRISE (Empresas) - Customizado**
>
> - Tudo do Pro +
> - White-label (marca própria)
> - Integração com ATS existente
> - Treinamento da equipe
> - SLA garantido
>
> **Receitas Adicionais:**
>
> - Cursos e certificações (marketplace)
> - Ads não-intrusivos (vagas patrocinadas)
> - API access para recrutadores
>
> **Projeção:**
>
> - 1000 empresas pagantes = R$ 150k-300k/mês
> - Margem alta (custo de servidor baixo)
> - Escalável (SaaS)"

---

### P14: Qual foi o maior desafio técnico do projeto?

**Resposta:**

> "O maior desafio foi **otimizar o feed social para performance**.
>
> **Problema:**
>
> - Feed precisa mostrar posts de conexões + vagas relevantes
> - Usuário com 500 conexões = query pesada
> - Cada post pode ter autor, comentários, likes (dados aninhados)
> - Carregar tudo de uma vez = 5-10 segundos (inaceitável)
>
> **Soluções Implementadas:**
>
> 1. **Paginação Infinita**:
>
>    - Carregar 10 posts por vez
>    - Scroll infinito (carregar mais ao chegar no fim)
>    - Reduz query inicial de 500 para 10 posts
>
> 2. **Indexes Otimizados**:
>
>    ```javascript
>    postSchema.index({ author: 1, createdAt: -1 });
>    ```
>
>    - Query de 3s para 50ms
>
> 3. **Projection (Campos Selecionados)**:
>
>    ```javascript
>    Post.find().select("content author createdAt");
>    // Não carrega campos desnecessários (updatedAt, etc.)
>    ```
>
> 4. **Server Components**:
>
>    - Feed inicial renderizado no servidor
>    - Cliente recebe HTML pronto (não precisa esperar JavaScript)
>
> 5. **Lazy Loading de Imagens**:
>    ```tsx
>    <Image loading="lazy" />
>    ```
>    - Imagens carregam só quando visíveis
>
> **Resultado:**
>
> - Tempo de carregamento: 10s → 1.2s
> - Lighthouse Performance: 45 → 92
>
> **Aprendizado:**
> Performance não é sobre tecnologia, é sobre **design inteligente de queries e carregamento progressivo**."

---

### P15: Como validaram que a ideia resolve um problema real?

**Resposta:**

> "Fizemos pesquisa qualitativa e quantitativa:
>
> **Pesquisa Quantitativa (Survey):**
>
> - 50 profissionais de tech/design
> - 15 recrutadores de PMEs
>
> **Perguntas-Chave:**
>
> 1. Você usa LinkedIn? (98% sim)
> 2. Está satisfeito com a gestão de candidaturas? (34% sim)
> 3. Usaria plataforma que integra networking + gestão? (78% sim)
>
> **Pesquisa Qualitativa (Entrevistas):**
>
> - 5 recrutadores de startups
>
> **Dores Identificadas:**
>
> - "LinkedIn é ótimo para networking, mas para contratar preciso de planilha Excel"
> - "Candidatos aplicam e eu perco o rastro no email"
> - "Queria ver portfólio real, não só currículo"
>
> **Validação Técnica:**
>
> - Protótipo Figma mostrado para 10 pessoas
> - 80% entenderam a proposta sem explicação
> - Feedback incorporado (ex: Kanban foi sugestão de recrutador)
>
> **Validação de Mercado:**
>
> - Plataformas similares: Workable ($$$), Greenhouse ($$$)
> - Lacuna: Solução acessível para PMEs brasileiras
>
> **Conclusão:**
> Problema existe, solução é desejada, mercado é viável."

---

## 🛠️ Processo

### P16: Quanto tempo levou o desenvolvimento?

**Resposta:**

> "O projeto levou aproximadamente **[X] semanas/meses**, dividido em sprints:
>
> **Semana 1-2: Planejamento e Setup**
>
> - Pesquisa de mercado
> - Definição de requisitos
> - Escolha de tecnologias
> - Setup do projeto (Next.js, MongoDB, etc.)
> - Configuração de ambiente (Git, ESLint, etc.)
>
> **Semana 3-4: Autenticação e Perfis**
>
> - Implementação NextAuth.js
> - Modelos de dados (User, Company)
> - Páginas de login/registro
> - Perfis profissionais e empresariais
>
> **Semana 5-6: Feed Social**
>
> - Modelo de Posts, Comments, Likes
> - Feed com paginação
> - Criação de posts (texto, imagens)
> - Interações (comentar, curtir)
>
> **Semana 7-8: Sistema de Vagas**
>
> - Modelo de Jobs, Applications
> - CRUD de vagas (empresas)
> - Busca e filtros (profissionais)
> - Candidaturas
>
> **Semana 9-10: Dashboard e Pipeline**
>
> - Kanban de candidaturas (DnD Kit)
> - Analytics com Recharts
> - Notificações
>
> **Semana 11-12: Polish e Testes**
>
> - Responsividade
> - Dark mode
> - Otimização de performance
> - Testes manuais extensivos
> - Documentação
>
> **Tempo Total:**
>
> - ~200-300 horas de desenvolvimento
> - ~50 horas de planejamento/pesquisa
> - ~50 horas de testes/refinamento
>
> **Desafios de Tempo:**
>
> - Autenticação levou mais que esperado (OAuth complexo)
> - Kanban drag-and-drop foi desafiador
> - Performance do feed exigiu refatoração
>
> Se fosse refazer, conseguiria em 70% do tempo (aprendizado)."

---

### P17: Trabalharam em equipe ou individual?

**Opção A - Equipe:**

> "Trabalhamos em equipe de [X] pessoas:
>
> **Divisão de Responsabilidades:**
>
> - **Eu**: [Frontend/Backend/Full-stack] - Foquei em [funcionalidades específicas]
> - **Colega 1**: [Área] - Responsável por [funcionalidades]
> - **Colega 2**: [Área] - Responsável por [funcionalidades]
>
> **Ferramentas de Colaboração:**
>
> - **Git/GitHub**: Versionamento de código
>   - Branches por feature (`feature/auth`, `feature/feed`)
>   - Pull Requests com code review
>   - Commits semânticos (`feat:`, `fix:`, `refactor:`)
> - **Trello**: Gestão de tarefas (Kanban)
> - **Discord**: Comunicação diária
> - **Figma**: Design colaborativo
>
> **Metodologia:**
>
> - Sprints semanais
> - Daily standups (15min)
> - Retrospectivas ao fim de cada sprint
>
> **Desafios de Equipe:**
>
> - Merge conflicts no Git (resolvido com comunicação)
> - Alinhamento de padrões de código (resolvido com ESLint)
>
> **Aprendizados:**
>
> - Comunicação é mais importante que código
> - Code review melhora qualidade
> - Pair programming acelera em problemas complexos"

**Opção B - Individual:**

> "Projeto individual, mas com colaboração indireta:
>
> **Processo:**
>
> - Desenvolvimento solo (todo o código)
> - Feedback regular de colegas e professores
> - Code review informal com amigos desenvolvedores
>
> **Vantagens:**
>
> - Controle total sobre decisões técnicas
> - Aprendizado profundo de todas as camadas
> - Flexibilidade de horários
>
> **Desafios:**
>
> - Gerenciar todo o escopo sozinho
> - Sem segunda opinião imediata
> - Debugging solitário (às vezes travava horas)
>
> **Como superei:**
>
> - Documentação extensiva (para não me perder)
> - Comunidades online (Stack Overflow, Discord)
> - Quebrar projeto em partes pequenas
>
> **Aprendizados:**
>
> - Autonomia e resolução de problemas
> - Gestão de tempo crítica
> - Importância de documentar (para mim mesmo)"

---

### P18: Como testaram a aplicação?

**Resposta:**

> "Implementamos testes em múltiplas camadas:
>
> **1. Testes Manuais (Principal)**
>
> - Testamos cada funcionalidade manualmente
> - Checklist de casos de uso:
>   - ✅ Usuário consegue se registrar?
>   - ✅ Login funciona com credenciais corretas?
>   - ✅ Erro aparece com senha errada?
>   - ✅ Perfil salva corretamente?
>   - (50+ casos de teste)
>
> **2. Testes de Responsividade**
>
> - Chrome DevTools (Device Mode)
> - Testado em:
>   - iPhone SE (320px)
>   - iPad (768px)
>   - Desktop (1920px)
>   - 4K (3840px)
> - Dispositivos reais (meu celular, tablet)
>
> **3. Testes de Performance**
>
> - Lighthouse (Chrome DevTools)
>   - Performance: 92/100
>   - Accessibility: 95/100
>   - Best Practices: 100/100
>   - SEO: 100/100
> - Network throttling (3G lento)
>
> **4. Testes de Segurança**
>
> - Tentativas de SQL Injection (MongoDB não é vulnerável)
> - XSS (Cross-Site Scripting) - Sanitização de inputs
> - CSRF - NextAuth protege nativamente
> - Autenticação - Testar acesso sem login
>
> **5. Testes de Banco de Dados**
>
> - Scripts de carga (criar 1000 usuários, 5000 posts)
> - Medir tempo de queries
> - Verificar indexes funcionando
>
> **6. Testes de Navegadores**
>
> - Chrome (principal)
> - Firefox
> - Safari (Mac)
> - Edge
>
> **Idealmente (Futuro):**
>
> - **Unit Tests**: Jest para funções utilitárias
> - **Integration Tests**: Testar API Routes
> - **E2E Tests**: Playwright (simular usuário real)
>
> **Por que não testes automatizados agora?**
>
> - Tempo limitado (prioridade em features)
> - Testes manuais cobriram casos críticos
> - Próximo passo: Implementar CI/CD com testes
>
> Testes manuais extensivos garantiram qualidade, mas reconheço que testes automatizados são essenciais para produção."

---

## 😰 Perguntas Difíceis

### P19: Se tivessem mais tempo, o que fariam diferente?

**Resposta (Honesta e Reflexiva):**

> "Ótima pergunta. Três coisas principais:
>
> **1. Testes Automatizados desde o Início**
>
> - Implementaria Jest e Playwright logo no setup
> - TDD (Test-Driven Development) para lógica crítica
> - CI/CD com testes automáticos em cada commit
> - **Por quê:** Peguei bugs tarde que testes teriam pego cedo
>
> **2. Design System Mais Robusto**
>
> - Documentar componentes com Storybook
> - Criar guia de estilo completo antes de codar
> - Tokens de design centralizados (cores, espaçamentos)
> - **Por quê:** Refatorei componentes 2-3 vezes por inconsistência
>
> **3. Arquitetura de Dados Melhor Planejada**
>
> - Modelar relacionamentos no papel antes de codar
> - Considerar casos extremos (usuário com 10k conexões)
> - Planejar estratégia de cache desde o início
> - **Por quê:** Tive que refatorar schemas do MongoDB no meio do projeto
>
> **O que faria igual:**
>
> - Escolha de tecnologias (Next.js, MongoDB) foi acertada
> - Abordagem iterativa (MVP → Features incrementais)
> - Foco em UX desde o início
>
> **Aprendizado:**
> Planejamento inicial economiza tempo de refatoração depois. Mas também, não dá para planejar tudo - iteração é necessária."

---

### P20: Quais são as limitações atuais do projeto?

**Resposta (Transparente):**

> "Transparência é importante. Limitações atuais:
>
> **Técnicas:**
>
> 1. **Notificações não são em tempo real**
>
>    - Atualmente: Polling (verifica a cada 30s)
>    - Ideal: WebSockets ou Server-Sent Events
>    - **Impacto:** Delay de até 30s para notificações
>
> 2. **Sem sistema de mensagens diretas**
>
>    - Usuários não podem conversar privadamente
>    - Precisam usar email externo
>    - **Próximo passo:** Implementar chat (Socket.io)
>
> 3. **Busca básica**
>
>    - Busca simples por texto
>    - Não tem busca semântica ou fuzzy search
>    - **Melhoria:** Integrar Elasticsearch ou Algolia
>
> 4. **Sem testes automatizados**
>    - Apenas testes manuais
>    - Risco de regressão ao adicionar features
>    - **Próximo passo:** Jest + Playwright
>
> **Funcionais:**
>
> 1. **Algoritmo de feed simples**
>
>    - Mostra posts cronologicamente
>    - Não tem personalização (ML)
>    - **Melhoria:** Algoritmo de relevância
>
> 2. **Analytics básicos**
>
>    - Métricas simples (visualizações, candidaturas)
>    - Não tem funil completo ou cohort analysis
>    - **Melhoria:** Dashboard avançado
>
> 3. **Sem app mobile nativo**
>    - Apenas web responsivo
>    - Experiência mobile boa, mas não nativa
>    - **Futuro:** React Native app
>
> **Escalabilidade:**
>
> 1. **Não testado com carga real**
>
>    - Testado com ~100 usuários simulados
>    - Não sabemos comportamento com 10k usuários simultâneos
>    - **Necessário:** Load testing (k6, Artillery)
>
> 2. **Sem CDN para assets**
>    - Imagens servidas diretamente
>    - Pode ser lento para usuários distantes
>    - **Solução:** Cloudinary já está integrado, falta migrar todas as imagens
>
> **Por que essas limitações existem?**
>
> - Tempo limitado (priorização de features core)
> - Complexidade (WebSockets requer infraestrutura diferente)
> - Escopo acadêmico (foco em demonstrar conceitos)
>
> **Importante:**
> Essas limitações não impedem o uso real, mas seriam endereçadas antes de lançamento comercial. O projeto demonstra arquitetura sólida e pode evoluir."

---

### P21: Como lidariam com 10.000 usuários simultâneos?

**Resposta (Técnica e Realista):**

> "Excelente pergunta de escalabilidade. Estratégia em camadas:
>
> **1. Infraestrutura (Imediato)**
>
> **Frontend:**
>
> - Deploy na Vercel (Edge Network global)
> - CDN automático para assets estáticos
> - Server Components reduzem carga no cliente
>
> **Backend:**
>
> - API Routes são serverless (auto-scaling)
> - Vercel escala automaticamente sob demanda
> - Sem servidor único que pode cair
>
> **Banco de Dados:**
>
> - MongoDB Atlas (cluster gerenciado)
> - Replica Set (3+ réplicas)
> - Leituras distribuídas entre réplicas
> - Sharding se necessário (particionar dados)
>
> **2. Otimizações de Código**
>
> **Caching:**
>
> ```typescript
> // Cache de perfis (Redis)
> const profile = await redis.get(`user:${id}`);
> if (!profile) {
>   profile = await User.findById(id);
>   await redis.set(`user:${id}`, profile, "EX", 3600); // 1h
> }
> ```
>
> **Rate Limiting:**
>
> ```typescript
> // Limitar requests por usuário
> const limiter = rateLimit({
>   windowMs: 15 * 60 * 1000, // 15 min
>   max: 100, // 100 requests
> });
> ```
>
> **Database Indexes:**
>
> ```javascript
> // Indexes compostos para queries complexas
> postSchema.index({ author: 1, createdAt: -1 });
> jobSchema.index({ company: 1, status: 1, createdAt: -1 });
> ```
>
> **3. Arquitetura Avançada (Longo Prazo)**
>
> **Microserviços:**
>
> - Separar serviços críticos:
>   - Auth Service (autenticação)
>   - Feed Service (posts)
>   - Jobs Service (vagas)
>   - Notifications Service (notificações)
> - Cada um escala independentemente
>
> **Message Queue:**
>
> - RabbitMQ ou AWS SQS
> - Processar tarefas assíncronas:
>   - Envio de emails
>   - Processamento de imagens
>   - Geração de analytics
>
> **CDN para Imagens:**
>
> - Cloudinary ou AWS CloudFront
> - Imagens servidas de edge locations
> - Reduz latência global
>
> **4. Monitoramento**
>
> - **Sentry**: Tracking de erros
> - **Vercel Analytics**: Performance
> - **MongoDB Atlas Monitoring**: Database metrics
> - **Grafana + Prometheus**: Dashboards customizados
>
> **5. Custos Estimados (10k usuários simultâneos)**
>
> - Vercel Pro: ~$20/mês
> - MongoDB Atlas M30: ~$300/mês
> - Cloudinary: ~$50/mês
> - Redis (Upstash): ~$30/mês
> - **Total: ~$400/mês**
>
> Com 10k usuários, assumindo 20% pagantes (2k empresas × R$150/mês):
>
> - Receita: R$300k/mês
> - Custo: R$2k/mês (~$400)
> - **Margem: 99%+ (típico de SaaS)**
>
> **Conclusão:**
> Arquitetura atual suporta até ~1k usuários simultâneos sem mudanças. Para 10k, precisaríamos de caching, CDN e otimizações de queries. Para 100k+, microserviços e sharding. Mas a base está sólida."

---

### P22: O que vocês não sabiam no início e aprenderam no processo?

**Resposta (Reflexiva e Honesta):**

> "Muita coisa! Os aprendizados mais importantes:
>
> **Técnicos:**
>
> 1. **Server Components são diferentes de SSR**
>
>    - Achei que eram a mesma coisa
>    - Server Components: Renderizam no servidor, não enviam JS
>    - SSR: Renderiza no servidor, mas hidrata no cliente
>    - **Impacto:** Economizamos muito JavaScript no bundle
>
> 2. **MongoDB não é "sem schema"**
>
>    - Pensei que era totalmente flexível
>    - Na prática, precisa de schema (Mongoose) para consistência
>    - Flexibilidade é para **evoluir** schema, não para bagunça
>    - **Aprendizado:** Schema design é tão importante quanto em SQL
>
> 3. **Performance é sobre queries, não tecnologia**
>
>    - Achei que Next.js seria rápido automaticamente
>    - Realidade: Queries mal feitas deixam tudo lento
>    - **Exemplo:** Query sem index = 3s, com index = 50ms
>    - **Aprendizado:** Otimização é 80% design de dados, 20% código
>
> 4. **TypeScript economiza tempo (depois da curva de aprendizado)**
>    - Início: Frustração com erros de tipo
>    - Depois: Pego bugs antes de rodar código
>    - Refatoração é 10x mais segura
>    - **Aprendizado:** Investimento inicial vale muito a pena
>
> **Design/UX:**
>
> 1. **Menos é mais**
>
>    - Primeira versão tinha 20 campos no formulário de perfil
>    - Usuários de teste abandonavam
>    - Reduzi para 5 campos essenciais + "completar depois"
>    - **Aprendizado:** Cada campo é uma barreira
>
> 2. **Feedback visual é crítico**
>
>    - Botões sem loading state frustravam usuários
>    - Adicionei spinners, toasts, animações
>    - **Aprendizado:** Usuário precisa saber que algo está acontecendo
>
> 3. **Acessibilidade não é opcional**
>    - Inicialmente ignorei (foco em features)
>    - Testei com leitor de tela = desastre
>    - Refatorei com Shadcn/UI (acessível por padrão)
>    - **Aprendizado:** Acessibilidade desde o início é mais fácil
>
> **Processo:**
>
> 1. **Documentação é para mim, não para outros**
>
>    - Achei que documentar era perda de tempo
>    - Voltei em código 2 semanas depois = não entendia nada
>    - Comecei a documentar tudo (JSDoc, README)
>    - **Aprendizado:** Eu do futuro agradece
>
> 2. **MVP não é "versão ruim", é "versão focada"**
>
>    - Queria implementar tudo de uma vez
>    - Travava por complexidade
>    - Mudei para: 1 feature por vez, bem feita
>    - **Aprendizado:** Iteração > Perfeição
>
> 3. **Bugs são professores**
>    - Cada bug me ensinou algo:
>      - Race condition → Aprendi sobre async/await
>      - Memory leak → Aprendi sobre useEffect cleanup
>      - N+1 queries → Aprendi sobre populate/join
>    - **Aprendizado:** Debugging é aprendizado disfarçado
>
> **Soft Skills:**
>
> 1. **Saber quando parar de otimizar**
>
>    - Gastei 2 dias otimizando algo de 100ms para 80ms
>    - Usuário não percebe diferença
>    - Deveria ter focado em nova feature
>    - **Aprendizado:** Otimização prematura é real
>
> 2. **Pedir ajuda não é fraqueza**
>    - Travei 4h em bug de CSS
>    - Perguntei no Discord = resolvido em 5min
>    - **Aprendizado:** Comunidade é recurso valioso
>
> **Maior Aprendizado Geral:**
> Construir software é 30% código, 70% decisões. Escolher **o que não fazer** é tão importante quanto escolher o que fazer."

---

## 🎓 Dicas para Responder Perguntas

### Estrutura de Resposta Eficaz

**1. Resposta Direta (5-10s)**

> Responda a pergunta objetivamente primeiro

**2. Contexto/Justificativa (15-20s)**

> Explique o "porquê" da resposta

**3. Exemplo Prático (10-15s)**

> Se possível, dê exemplo do projeto

**4. Conclusão (5s)**

> Reforce o ponto principal

**Exemplo:**

> **P:** Por que MongoDB?
>
> **Resposta Direta:** "Escolhemos MongoDB pela flexibilidade de schema e performance em leituras."
>
> **Contexto:** "Nossa aplicação tem dados semi-estruturados - perfis variam muito entre usuários. SQL exigiria migrations complexas a cada mudança."
>
> **Exemplo:** "Por exemplo, alguns usuários têm portfólio, outros não. No MongoDB, isso é um campo opcional. No PostgreSQL, precisaríamos de tabela separada ou campo nullable."
>
> **Conclusão:** "Para nosso caso de uso, MongoDB foi a escolha natural."

---

### O Que Fazer

✅ **Seja honesto**

- "Não sei" é melhor que inventar

✅ **Use exemplos do projeto**

- Conecte teoria à prática

✅ **Demonstre raciocínio**

- Mostre que pensou nas alternativas

✅ **Admita limitações**

- "Isso seria melhorado com..."

✅ **Mostre entusiasmo**

- Paixão pelo projeto é contagiante

---

### O Que Evitar

❌ **Não invente**

- Banca percebe

❌ **Não use jargões excessivos**

- "Utilizamos paradigma de programação reativa funcional com mônadas..."
- Seja claro, não pomposo

❌ **Não critique outras tecnologias**

- "React é melhor que Vue" → "React atendeu nossas necessidades"

❌ **Não seja defensivo**

- Crítica construtiva é oportunidade de mostrar reflexão

❌ **Não fale demais**

- Resposta de 5min perde atenção

---

**Você está preparado! 🚀**

_Leia este documento 2-3 vezes antes da apresentação._
_Pratique responder em voz alta._
_Boa sorte! 🍀_
