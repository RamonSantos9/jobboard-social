# Guia de Contribuição

Agradecemos muito sua disposição para contribuir com este projeto!

Antes de enviar um pull request, existem algumas diretrizes que você deve observar.

## Diretrizes

Este projeto é uma aplicação Next.js usando TypeScript, React, MongoDB e Tailwind CSS.

### Antes de Enviar

- Verifique se há outros PRs similares
- Formate seu código com `npm run lint`
- Certifique-se de que todos os testes passam
- Execute o build localmente para verificar se não há erros
- Atualize a documentação se necessário

### Nova Funcionalidade

Antes de enviar uma nova funcionalidade, certifique-se de abrir uma issue (Solicitação de Funcionalidade) com informações suficientes e razões sobre a nova funcionalidade.

Após a solicitação de funcionalidade ser aprovada, você pode enviar um pull request.

#### Checklist para Nova Funcionalidade

- [ ] Issue criada e aprovada
- [ ] Código seguindo os padrões do projeto
- [ ] TypeScript sem erros
- [ ] Testes adicionados (se aplicável)
- [ ] Documentação atualizada
- [ ] Build passando sem erros
- [ ] Lint passando sem erros

### Correções de Bugs

Forneça uma descrição detalhada do bug (com demonstração ao vivo se possível).

OU abra um relatório de bug e vincule-o no seu PR.

#### Checklist para Correção de Bug

- [ ] Bug identificado e descrito
- [ ] Código corrigido
- [ ] Testes adicionados (se aplicável)
- [ ] Build passando sem erros
- [ ] Lint passando sem erros
- [ ] Issue vinculada ao PR (se existir)

### Documentação

Contribuir para a documentação é relativamente mais fácil, certifique-se de verificar os erros de digitação e gramática antes de enviar.

#### Checklist para Documentação

- [ ] Documentação atualizada
- [ ] Erros de digitação corrigidos
- [ ] Gramática verificada
- [ ] Exemplos testados
- [ ] Links verificados

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js 18.0.0 ou superior
- npm 9.0.0 ou superior (ou yarn 1.22.0 ou superior)
- MongoDB 6.0 ou superior (ou MongoDB Atlas)

### Instalação

1. Fork o repositório
2. Clone seu fork localmente:

```bash
git clone https://github.com/seu-usuario/jobboard-social.git
cd jobboard-social
```

3. Instale as dependências:

```bash
npm install
```

4. Configure as variáveis de ambiente:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
MONGODB_URI=mongodb://localhost:27017/jobboard-social
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

5. Execute o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## Padrões de Código

### TypeScript

- Utilize TypeScript para todo o código
- Defina tipos explícitos para todas as funções e variáveis
- Evite usar `any` - use tipos específicos ou `unknown`
- Utilize interfaces para definir estruturas de dados
- Utilize tipos para unions e intersections

### React

- Utilize componentes funcionais
- Utilize hooks para gerenciamento de estado
- Utilize TypeScript para tipagem de props
- Siga as convenções de nomenclatura do React
- Utilize `use client` para componentes client-side
- Utilize Server Components quando possível

### Next.js

- Utilize App Router para novas páginas
- Utilize API Routes para endpoints de API
- Utilize Server Components quando possível
- Utilize Client Components apenas quando necessário
- Siga as convenções de roteamento do Next.js

### Estilização

- Utilize Tailwind CSS para estilização
- Siga as convenções de classes do Tailwind
- Utilize componentes Shadcn/UI quando possível
- Mantenha consistência visual com o design system

### Banco de Dados

- Utilize Mongoose para modelos
- Defina schemas com validação
- Utilize índices para performance
- Utilize referências para relacionamentos
- Valide dados antes de salvar

## Estrutura do Projeto

### Diretórios Principais

- `app/`: Páginas e rotas do Next.js
  - `api/`: Rotas de API
  - `(auth)/`: Páginas de autenticação
  - `dashboard/`: Páginas do dashboard
  - `feed/`: Páginas do feed
  - `jobs/`: Páginas de vagas
  - `company/`: Páginas de empresas
  - `settings/`: Páginas de configurações

- `components/`: Componentes React
  - `ui/`: Componentes UI base (Shadcn)
  - `admin/`: Componentes administrativos
  - `auth/`: Componentes de autenticação
  - `dashboard/`: Componentes do dashboard
    - `graphics/`: Componentes de gráficos

- `lib/`: Utilitários e configurações
  - `db.ts`: Conexão MongoDB
  - `auth.ts`: Configuração NextAuth
  - `utils.ts`: Funções auxiliares
  - `cloudinary.ts`: Configuração Cloudinary

- `models/`: Schemas Mongoose
  - `User.ts`: Modelo de usuário
  - `Profile.ts`: Modelo de perfil
  - `Company.ts`: Modelo de empresa
  - `Post.ts`: Modelo de post
  - `Vacancy.ts`: Modelo de vaga
  - `Application.ts`: Modelo de candidatura

### Convenções de Nomenclatura

- **Componentes**: PascalCase (ex: `PostCard.tsx`)
- **Arquivos**: kebab-case ou PascalCase (ex: `post-card.tsx` ou `PostCard.tsx`)
- **Funções**: camelCase (ex: `handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)
- **Tipos/Interfaces**: PascalCase (ex: `UserProfile`)
- **Hooks**: camelCase com prefixo `use` (ex: `useAuth`)

## Processo de Contribuição

### 1. Criar uma Branch

Crie uma branch a partir da branch `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-funcionalidade
```

Ou para correção de bug:

```bash
git checkout -b fix/descricao-do-bug
```

### 2. Fazer Alterações

Faça suas alterações seguindo os padrões de código do projeto.

### 3. Testar Localmente

Execute os seguintes comandos para verificar se tudo está funcionando:

```bash
# Verificar erros de TypeScript
npm run build

# Verificar erros de lint
npm run lint

# Testar localmente
npm run dev
```

### 4. Commitar Alterações

Faça commits descritivos seguindo o padrão Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

Exemplos:

```bash
git commit -m "feat: adiciona sistema de notificações"
git commit -m "fix: corrige erro de autenticação"
git commit -m "docs: atualiza README com novas funcionalidades"
```

### 5. Push para o Repositório

Envie suas alterações para seu fork:

```bash
git push origin feature/nome-da-funcionalidade
```

### 6. Abrir Pull Request

1. Vá para o repositório no GitHub
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha o formulário de PR:
   - Título descritivo
   - Descrição detalhada das mudanças
   - Screenshots (se aplicável)
   - Link para issue relacionada (se existir)
5. Clique em "Create Pull Request"

## Checklist do Pull Request

Antes de enviar um PR, certifique-se de:

- [ ] Código segue os padrões do projeto
- [ ] TypeScript sem erros
- [ ] Lint passando sem erros
- [ ] Build passando sem erros
- [ ] Testes adicionados (se aplicável)
- [ ] Documentação atualizada
- [ ] Commits descritivos
- [ ] Branch atualizada com `main`
- [ ] PR vinculado à issue (se existir)
- [ ] Descrição do PR clara e detalhada

## Novo em Contribuições?

### Comece com Documentação

Você pode começar contribuindo com a documentação, ela está localizada em:

- `README.md`: Documentação principal
- `CONTRIBUTING.md`: Este guia
- Comentários no código: Documentação inline

Para executar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Você não precisa de variáveis de ambiente extras para executar o projeto localmente (exceto MongoDB).

### Issues Simples para Começar

Procure por issues marcadas com `good first issue` ou `help wanted` para começar.

### Áreas para Contribuir

- Documentação
- Testes
- Correções de bugs
- Novas funcionalidades
- Melhorias de performance
- Melhorias de acessibilidade
- Melhorias de UX/UI

## Testes

### Executar Testes

```bash
npm test
```

### Adicionar Testes

Quando adicionar novas funcionalidades, considere adicionar testes:

- Testes unitários para funções utilitárias
- Testes de integração para APIs
- Testes de componentes para componentes React
- Testes end-to-end para fluxos completos

## Linting e Formatação

### Executar Lint

```bash
npm run lint
```

### Formatação Automática

O projeto utiliza ESLint para linting. Certifique-se de que seu código está formatado corretamente antes de commitar.

## Perguntas e Suporte

Se você tiver dúvidas ou precisar de ajuda:

1. Verifique a documentação
2. Procure em issues existentes
3. Abra uma nova issue
4. Entre em contato com os maintainers

## Código de Conduta

Este projeto segue um código de conduta. Ao participar, você concorda em manter este código.

### Comportamento Esperado

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

### Comportamento Inaceitável

- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos
- Assédio público ou privado
- Publicar informações privadas de terceiros
- Outras condutas inadequadas em ambiente profissional

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

## Agradecimentos

Obrigado por considerar contribuir para este projeto! Suas contribuições são muito valorizadas.

