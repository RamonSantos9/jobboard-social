<!-- 4df5f4cb-876d-4b8f-b53d-3a893525cb80 0b566133-7179-4e9c-80b5-ed71c5f9e88e -->
# Sistema Completo de Vagas e Melhorias de Perfil

## 1. Correção da Animação Open Peeps

- Corrigir caminho da imagem em `components/ui/skiper-ui/skiper39.tsx` (linha 304: remover "public/" do caminho)
- Verificar se `public/images/peeps/all-peeps.svg` existe e está correto
- Se necessário, criar sprite sheet PNG com pessoas reais do Open Peeps

## 2. Modal de Anunciar Vaga

- Criar `components/CreateJobModal.tsx` com design idêntico à imagem fornecida
- Campos: Cargo (obrigatório), Empresa (pre-preenchido), Tipo de local de trabalho (Combobox), Localidade, Tipo de vaga (Combobox)
- Usar componentes Popover + Command do shadcn para comboboxes
- Campos opcionais: salário, descrição detalhada, benefícios
- API: `app/api/jobs/create/route.ts` (POST)

## 3. Expansão do Modelo Profile

- Atualizar `models/Profile.ts` com novos campos:
- `currentTitle?: string` (cargo atual)
- `currentCompany?: string` (empresa atual)
- `sector?: string` (setor)
- `academicFormation?: Array<{...}>` (formação acadêmica expandida)
- `contactInfo?: { phone?: string, email?: string, website?: string }`
- `preferredLocation?: string` (para recomendação)
- Todos os campos novos serão opcionais

## 4. Página de Perfil com CRUD Completo (Estilo LinkedIn)

- Redesenhar `app/jobboard/[slug]/page.tsx` com layout idêntico ao LinkedIn:
- Banner azul grande no topo com ícone de câmera para editar
- Foto de perfil circular sobrepondo o banner
- Nome, cargo atual, skills, localização e informações de contato
- Botões de ação: "Tenho interesse em...", "Adicionar seção", etc.
- Seção "Buscando emprego" com cargos desejados
- Seção "Sugestões para você" (apenas para o próprio perfil)
- Sidebar direita com: idioma do perfil, URL pública, "Quem seus visitantes também viram", "Pessoas que talvez você conheça"
- Adicionar ícone de lápis (Edit3) em cada seção editável que abre `EditProfileModal`
- Criar `components/EditProfileModal.tsx` com formulários para:
- Informações básicas (cargo, setor, localização, contato)
- Experiência (CRUD completo)
- Educação (CRUD completo)
- Skills (adicionar/remover)
- Corrigir `components/LeftSidebar.tsx` para usar dados reais da API `/api/profile`
- Garantir que clique na imagem do avatar redireciona para `/jobboard/${slug}`
- API: `app/api/profile/route.ts` (PUT para atualizar) - já existe

## 5. Feed Personalizado de Vagas (/jobs)

- Melhorar `app/jobs/page.tsx`:
- Adicionar botão "Anunciar Vaga" que abre o modal
- Implementar algoritmo de recomendação baseado em:
- Skills do perfil vs skills da vaga
- Localização preferida vs localização da vaga
- Nível de experiência vs nível da vaga
- Setor do usuário vs categoria da vaga
- Ordenar vagas por score de match
- Adicionar filtros avançados usando Comboboxes

## 6. Integração de Vagas no Feed Principal

- Atualizar `components/MainFeed.tsx`:
- Adicionar tipo `JobPost` ao interface `Post`
- Modificar API `/api/posts` para incluir vagas recomendadas
- Criar componente `components/JobCard.tsx` para exibir vagas no feed
- Vagas aparecem misturadas com posts, mas com design diferenciado

## 7. Sistema de Recomendação

- Criar `lib/jobRecommendation.ts`:
- Função `calculateJobMatchScore(profile, job)` retorna score 0-100
- Matching por: skills (40%), localização (20%), nível (20%), setor (20%)
- API: `app/api/jobs/recommended/route.ts` retorna vagas ordenadas por score

## 8. Script de Dados Fictícios

- Criar `scripts/seed-jobs.js`:
- 500+ vagas com dados variados (títulos, empresas, localizações, skills)
- 50+ empresas fictícias
- Variedade de: setores, níveis, tipos, localizações, salários
- Integrar com empresas existentes no banco

## 9. APIs Necessárias

- `app/api/jobs/create/route.ts` - Criar vaga (autenticado, apenas recrutadores/empresas)
- `app/api/jobs/recommended/route.ts` - Vagas recomendadas para usuário logado
- `app/api/jobs/[id]/route.ts` - Detalhes de uma vaga específica
- `app/api/profile/route.ts` - Atualizar perfil (PUT)

## 10. Componentes UI Necessários

- Verificar se `components/ui/popover.tsx` e `components/ui/command.tsx` existem
- Se não existirem, criar usando `npx shadcn add popover command`
- Criar `components/CreateJobModal.tsx`
- Criar `components/EditProfileModal.tsx`
- Criar `components/JobCard.tsx`
- Melhorar `components/JobFilters.tsx` (usar Comboboxes)

## Arquivos a Criar/Modificar

**Novos arquivos:**

- `components/CreateJobModal.tsx`
- `components/EditProfileModal.tsx`
- `components/JobCard.tsx`
- `lib/jobRecommendation.ts`
- `app/api/jobs/create/route.ts`
- `app/api/jobs/recommended/route.ts`
- `app/api/jobs/[id]/route.ts`
- `scripts/seed-jobs.js`

**Arquivos a modificar:**

- `components/ui/skiper-ui/skiper39.tsx` (corrigir caminho imagem)
- `models/Profile.ts` (adicionar novos campos)
- `app/jobboard/[slug]/page.tsx` (adicionar CRUD completo)
- `app/jobs/page.tsx` (feed personalizado + recomendação)
- `components/MainFeed.tsx` (integrar vagas)
- `app/api/posts/route.ts` (incluir vagas no feed)
- `app/api/profile/route.ts` (PUT para atualizar)

**Ordem de implementação:**

1. Correção animação Open Peeps
2. Expansão modelo Profile + CRUD perfil
3. Modal criar vaga + API
4. Sistema recomendação
5. Feed personalizado /jobs
6. Integração no feed principal
7. Script dados fictícios