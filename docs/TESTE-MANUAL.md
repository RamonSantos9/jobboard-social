# 🧪 Roteiro de Teste Manual - JobBoard Social

**Data:** 01/12/2025  
**Versão:** 1.0  
**Testador:** Ramon Santos

---

## 📋 Checklist de Testes

### ✅ Correções Implementadas Hoje

#### 1. Bug "Vaga não encontrada"

**Status:** 🔧 CORRIGIDO  
**Arquivos alterados:**

- `app/api/feed/recommended/route.ts` (linha 236)
- `app/api/posts/route.ts` (linha 291)

**Como testar:**

1. [ ] Fazer login com: ramonfishh@gmail.com / eusouasenha
2. [ ] Navegar para http://localhost:3000/feed
3. [ ] Procurar por cards de vagas no feed
4. [ ] Clicar no botão "Ver detalhes" de uma vaga
5. [ ] **Resultado esperado:** Página de detalhes da vaga deve carregar sem erro
6. [ ] **Resultado anterior:** Mostrava "Vaga não encontrada"

**Resultado do teste:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

#### 2. Erro de Hidratação React

**Status:** 🔧 CORRIGIDO  
**Arquivo alterado:** `app/layout.tsx` (linha 26)

**Como testar:**

1. [ ] Abrir http://localhost:3000
2. [ ] Abrir o Console do navegador (F12 → Console)
3. [ ] Procurar por erro: "A tree hydrated but some attributes..."
4. [ ] **Resultado esperado:** Não deve aparecer erro de hidratação
5. [ ] **Resultado anterior:** Console mostrava warning de hidratação

**Resultado do teste:**

- [ ] ✅ Passou (sem erro no console)
- [ ] ❌ Falhou (ainda tem erro)
- Observações: **********************\_\_\_**********************

---

## 🔍 Testes de Funcionalidades Principais

### 1. Autenticação

#### 1.1 Login

**URL:** http://localhost:3000/feed/auth/login

**Passos:**

1. [ ] Acessar página de login
2. [ ] Verificar se formulário está visível
3. [ ] Preencher email: ramonfishh@gmail.com
4. [ ] Preencher senha: eusouasenha
5. [ ] Clicar em "Entrar" ou "Login"
6. [ ] **Resultado esperado:** Redirecionar para /feed

**Checklist:**

- [ ] Formulário carrega corretamente
- [ ] Campos de input funcionam
- [ ] Botão de submit está habilitado
- [ ] Login bem-sucedido redireciona para feed
- [ ] Mensagem de erro aparece se credenciais inválidas

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

### 2. Feed Principal

#### 2.1 Carregamento do Feed

**URL:** http://localhost:3000/feed

**Passos:**

1. [ ] Fazer login
2. [ ] Verificar se feed carrega
3. [ ] Verificar se há posts e/ou vagas
4. [ ] Scroll para baixo para testar infinite scroll

**Checklist:**

- [ ] Feed carrega em menos de 3 segundos
- [ ] Posts aparecem corretamente
- [ ] Vagas aparecem corretamente
- [ ] Infinite scroll funciona
- [ ] Skeleton loaders aparecem durante carregamento
- [ ] Não há erros no console

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

#### 2.2 Interação com Posts

**Passos:**

1. [ ] Clicar em "Curtir" em um post
2. [ ] Clicar em "Comentar" em um post
3. [ ] Testar reações (like, celebrate, support, etc)
4. [ ] Compartilhar um post

**Checklist:**

- [ ] Curtida funciona e atualiza contador
- [ ] Modal de comentários abre
- [ ] Comentário pode ser enviado
- [ ] Reações funcionam corretamente
- [ ] Compartilhamento funciona

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

### 3. Vagas

#### 3.1 Listagem de Vagas

**URL:** http://localhost:3000/jobs

**Passos:**

1. [ ] Navegar para /jobs
2. [ ] Verificar lista de vagas
3. [ ] Testar filtros (se houver)
4. [ ] Testar busca (se houver)

**Checklist:**

- [ ] Vagas carregam corretamente
- [ ] Cards de vagas estão bem formatados
- [ ] Informações da empresa aparecem
- [ ] Salário aparece (se disponível)
- [ ] Skills aparecem
- [ ] Match score aparece (se disponível)

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

#### 3.2 Detalhes da Vaga (BUG CORRIGIDO)

**Passos:**

1. [ ] No feed ou em /jobs, encontrar uma vaga
2. [ ] Clicar em "Ver detalhes"
3. [ ] Verificar se página de detalhes carrega
4. [ ] Verificar todas as informações da vaga

**Checklist:**

- [ ] Página de detalhes carrega SEM erro "Vaga não encontrada"
- [ ] Título da vaga aparece
- [ ] Descrição completa aparece
- [ ] Requisitos aparecem
- [ ] Responsabilidades aparecem
- [ ] Benefícios aparecem
- [ ] Informações da empresa aparecem
- [ ] Botão "Candidatar-se" funciona

**Resultado:**

- [ ] ✅ Passou (bug corrigido)
- [ ] ❌ Falhou (bug ainda existe)
- Observações: **********************\_\_\_**********************

#### 3.3 Candidatura

**URL:** http://localhost:3000/jobs/[id]/apply

**Passos:**

1. [ ] Clicar em "Candidatar-se" em uma vaga
2. [ ] Preencher formulário de candidatura
3. [ ] Enviar candidatura

**Checklist:**

- [ ] Modal/página de candidatura abre
- [ ] Formulário está completo
- [ ] Validação funciona
- [ ] Candidatura é enviada com sucesso
- [ ] Mensagem de confirmação aparece
- [ ] Status muda para "Candidatado"

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

### 4. Navegação

#### 4.1 Menu Principal

**Passos:**

1. [ ] Verificar menu de navegação
2. [ ] Clicar em cada item do menu
3. [ ] Verificar se navegação funciona

**Checklist:**

- [ ] Feed (/feed)
- [ ] Vagas (/jobs)
- [ ] Rede (/network)
- [ ] Mensagens (/messages)
- [ ] Notificações (/notifications)
- [ ] Perfil (link para perfil do usuário)

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

### 5. Performance

#### 5.1 Tempo de Carregamento

**Ferramenta:** Chrome DevTools → Network

**Passos:**

1. [ ] Abrir DevTools (F12)
2. [ ] Ir para aba Network
3. [ ] Recarregar página (Ctrl+R)
4. [ ] Anotar tempo de carregamento

**Métricas:**

- Tempo total de carregamento: **\_\_\_** ms
- First Contentful Paint: **\_\_\_** ms
- Largest Contentful Paint: **\_\_\_** ms
- Time to Interactive: **\_\_\_** ms

**Checklist:**

- [ ] Página carrega em menos de 3 segundos
- [ ] Não há requests falhando (status 4xx ou 5xx)
- [ ] Imagens carregam corretamente
- [ ] Não há recursos bloqueando renderização

**Resultado:**

- [ ] ✅ Passou (< 3s)
- [ ] ⚠️ Aceitável (3-5s)
- [ ] ❌ Lento (> 5s)
- Observações: **********************\_\_\_**********************

---

### 6. Console do Navegador

#### 6.1 Erros JavaScript

**Passos:**

1. [ ] Abrir Console (F12 → Console)
2. [ ] Navegar por diferentes páginas
3. [ ] Documentar todos os erros

**Checklist:**

- [ ] Sem erros (vermelho) no console
- [ ] Sem warnings (amarelo) críticos
- [ ] Sem failed requests
- [ ] Sem erros de hidratação (CORRIGIDO)

**Erros encontrados:**

```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
```

**Resultado:**

- [ ] ✅ Sem erros
- [ ] ⚠️ Apenas warnings
- [ ] ❌ Erros críticos
- Observações: **********************\_\_\_**********************

---

### 7. Responsividade

#### 7.1 Mobile (375px)

**Passos:**

1. [ ] Abrir DevTools (F12)
2. [ ] Ativar modo responsivo (Ctrl+Shift+M)
3. [ ] Selecionar iPhone SE (375px)
4. [ ] Navegar pelo site

**Checklist:**

- [ ] Layout se adapta ao mobile
- [ ] Menu mobile funciona
- [ ] Botões são clicáveis
- [ ] Texto é legível
- [ ] Não há overflow horizontal
- [ ] Imagens se ajustam

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

#### 7.2 Tablet (768px)

**Passos:**

1. [ ] Selecionar iPad (768px)
2. [ ] Navegar pelo site

**Checklist:**

- [ ] Layout se adapta ao tablet
- [ ] Sidebar aparece/desaparece corretamente
- [ ] Cards se reorganizam

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

### 8. Acessibilidade (A11y)

#### 8.1 Navegação por Teclado

**Passos:**

1. [ ] Usar apenas Tab para navegar
2. [ ] Usar Enter para ativar botões
3. [ ] Usar Esc para fechar modais

**Checklist:**

- [ ] Todos os elementos interativos são acessíveis via Tab
- [ ] Ordem de foco faz sentido
- [ ] Foco visual é claro
- [ ] Enter ativa botões
- [ ] Esc fecha modais

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

#### 8.2 Leitores de Tela

**Ferramenta:** NVDA ou JAWS (Windows) / VoiceOver (Mac)

**Checklist:**

- [ ] Imagens têm alt text
- [ ] Botões têm labels descritivos
- [ ] Formulários têm labels
- [ ] Headings estão em ordem
- [ ] Links são descritivos

**Resultado:**

- [ ] ✅ Passou
- [ ] ❌ Falhou
- Observações: **********************\_\_\_**********************

---

## 📊 Resumo dos Testes

### Bugs Corrigidos

- [ ] ✅ "Vaga não encontrada" - CORRIGIDO
- [ ] ✅ Erro de hidratação - CORRIGIDO

### Funcionalidades Testadas

- [ ] Autenticação
- [ ] Feed
- [ ] Vagas
- [ ] Navegação
- [ ] Performance
- [ ] Responsividade
- [ ] Acessibilidade

### Novos Bugs Encontrados

1. ***
2. ***
3. ***

### Melhorias Sugeridas

1. ***
2. ***
3. ***

---

## 📸 Screenshots

**Instruções:** Tire screenshots dos seguintes momentos:

1. [ ] Login page
2. [ ] Feed principal
3. [ ] Lista de vagas
4. [ ] Detalhes de vaga (bug corrigido)
5. [ ] Console do navegador
6. [ ] Mobile view
7. [ ] Qualquer erro encontrado

**Salvar em:** `docs/screenshots/teste-manual-[data]/`

---

## ✅ Conclusão

**Data do teste:** ******\_\_\_******  
**Tempo total:** ******\_\_\_******  
**Status geral:**

- [ ] ✅ Tudo funcionando
- [ ] ⚠️ Funcionando com ressalvas
- [ ] ❌ Problemas críticos

**Assinatura:** ******\_\_\_******

---

**Próximos passos:**

1. Corrigir bugs encontrados
2. Implementar melhorias sugeridas
3. Executar testes automatizados
4. Deploy em ambiente de staging
