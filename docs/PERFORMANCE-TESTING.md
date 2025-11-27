# Scripts de Teste de Performance - JobBoard

Este documento descreve os scripts de teste de performance disponíveis para avaliar o desempenho do banco de dados e da API.

## 📋 Scripts Disponíveis

### 1. Load Test HTTP (`load-test.ts`)

Testa a performance da API HTTP fazendo requisições concorrentes aos endpoints.

**Como executar:**
```bash
npm run load-test
```

**Variáveis de ambiente:**
- `JOBBOARD_LOAD_BASE_URL` - URL base (padrão: `http://localhost:3000`)
- `JOBBOARD_LOAD_URL` - URL específica para testar (padrão: `/api/jobs?limit=20`)
- `JOBBOARD_LOAD_TOTAL` - Total de requisições (padrão: `10000`)
- `JOBBOARD_LOAD_CONCURRENCY` - Requisições concorrentes (padrão: `100`)
- `JOBBOARD_LOAD_WARMUP` - Requisições de aquecimento (padrão: `100`)
- `JOBBOARD_LOAD_MULTI` - Testar múltiplos endpoints (padrão: `false`)

**Exemplo:**
```bash
# Teste básico
npm run load-test

# Teste com configurações personalizadas
JOBBOARD_LOAD_TOTAL=50000 JOBBOARD_LOAD_CONCURRENCY=200 npm run load-test

# Teste de múltiplos endpoints
JOBBOARD_LOAD_MULTI=true npm run load-test
```

**O que mede:**
- ✅ Latência (min, média, max, percentis P50/P75/P90/P95/P99)
- ✅ Throughput (requisições por segundo)
- ✅ Taxa de erro
- ✅ Códigos de status HTTP
- ✅ Tempo total de execução

---

### 2. Load Test Database (`load-test-database.ts`)

Testa a performance do banco de dados executando queries em todas as coleções.

**Como executar:**
```bash
npm run load-test:db
```

**O que faz:**
- 📊 Mostra estatísticas de todas as coleções (tamanho, documentos, índices)
- 🔍 Executa queries comuns em cada coleção
- 📈 Mede tempo de execução e uso de índices
- ⚡ Identifica queries lentas e collection scans
- 📋 Gera relatório detalhado de performance

**Coleções testadas:**
- Vacancy (vagas)
- Application (candidaturas)
- User (usuários)
- Company (empresas)
- Post (posts)
- Comment (comentários)
- Connection (conexões)
- Notification (notificações)
- Message (mensagens)
- Profile (perfis)
- SavedJob (vagas salvas)
- UserInteraction (interações)

**Tipos de queries testadas:**
- Busca simples (find)
- Busca com filtros múltiplos
- Ordenação e paginação
- Agregações (group, count, avg)
- Populate (joins)
- Busca por índices

**Métricas coletadas:**
- ⏱️ Tempo de execução (client-side e database)
- 📄 Documentos retornados vs examinados
- 🔑 Chaves (índices) examinadas
- 📊 Índice utilizado (ou COLLSCAN)
- 💯 Eficiência da query

---

### 3. Stress Test Database (`stress-test-database.ts`)

Executa teste de stress no banco de dados com queries concorrentes aleatórias.

**Como executar:**
```bash
npm run stress-test:db
```

**Variáveis de ambiente:**
- `DB_STRESS_CONCURRENCY` - Queries concorrentes (padrão: `50`)
- `DB_STRESS_ITERATIONS` - Total de iterações (padrão: `1000`)

**Exemplo:**
```bash
# Teste básico
npm run stress-test:db

# Teste intenso
DB_STRESS_CONCURRENCY=100 DB_STRESS_ITERATIONS=10000 npm run stress-test:db
```

**Tipos de queries executadas:**
- **Simple**: Busca simples com filtros básicos
- **Complex**: Busca com múltiplos filtros e ordenação
- **Aggregation**: Agregações com group e estatísticas
- **Populate**: Busca com relacionamentos (populate)

**O que mede:**
- 🎯 Performance sob carga
- 📊 Estatísticas por tipo de query
- ⚡ Throughput (queries por segundo)
- 📈 Latência (min, média, max, percentis)
- ❌ Taxa de erro
- 🔥 Estabilidade do banco sob stress

---

### 4. Analyze DB Performance (`analyze-db-performance.ts`)

Analisa a performance de queries específicas usando o explain do MongoDB.

**Como executar:**
```bash
npm run analyze-db
```

**O que faz:**
- 🔍 Executa queries comuns com `.explain()`
- 📊 Mostra estatísticas detalhadas de execução
- 🔑 Lista todos os índices de cada coleção
- ⚠️ Identifica queries que precisam de otimização
- 💡 Sugere melhorias (índices, etc.)

**Queries analisadas:**
- Listagem de vagas (home page)
- Busca por título (text search)
- Filtro por localização e nível
- Aplicações por candidato

---

### 5. Check Data Distribution (`check-data-distribution.ts`)

Verifica a distribuição de dados no banco.

**Como executar:**
```bash
npm run check-data
```

**O que mostra:**
- 📊 Contagem de documentos por coleção
- 📈 Distribuição de dados (status, tipos, etc.)
- 🔍 Estatísticas de uso
- 📋 Relatório de consistência

---

## 🎯 Quando usar cada script

### Durante o desenvolvimento:
- `npm run analyze-db` - Para verificar se as queries estão otimizadas
- `npm run check-data` - Para verificar a distribuição de dados

### Antes de deploy:
- `npm run load-test:db` - Para testar performance do banco
- `npm run load-test` - Para testar performance da API
- `npm run stress-test:db` - Para garantir estabilidade sob carga

### Após mudanças no schema:
- `npm run analyze-db` - Para verificar se os índices estão sendo usados
- `npm run load-test:db` - Para comparar performance

### Para debugging de performance:
- `npm run analyze-db` - Para identificar queries lentas
- `npm run load-test:db` - Para medir impacto de otimizações

---

## 📊 Interpretando os Resultados

### Latência (Load Tests)
- **Excelente**: P95 < 100ms
- **Bom**: P95 < 500ms
- **Aceitável**: P95 < 1000ms
- **Crítico**: P95 > 1000ms

### Throughput (Load Tests)
- **Excelente**: > 500 req/s
- **Bom**: 100-500 req/s
- **Baixo**: < 100 req/s

### Taxa de Erro
- **Aceitável**: < 1%
- **Atenção**: 1-5%
- **Crítico**: > 5%

### Eficiência de Query (Database)
- **Excelente**: 100% (docs retornados = docs examinados)
- **Bom**: > 50%
- **Ruim**: < 50%
- **Crítico**: COLLSCAN em coleções grandes

### Índices
- ✅ **Bom**: Query usa índice específico
- ⚠️ **Atenção**: Query usa índice genérico (_id)
- ❌ **Crítico**: COLLSCAN (sem índice)

---

## 🔧 Otimizações Recomendadas

### Se P95 > 500ms:
1. Verificar se queries estão usando índices (`analyze-db`)
2. Criar índices compostos para queries frequentes
3. Adicionar `.lean()` em queries que não precisam de documentos Mongoose
4. Limitar resultados com `.limit()`
5. Usar projeção para retornar apenas campos necessários

### Se Taxa de Erro > 1%:
1. Verificar logs de erro
2. Aumentar timeout de conexão
3. Verificar pool de conexões do MongoDB
4. Verificar recursos do servidor (CPU, memória)

### Se COLLSCAN detectado:
1. Criar índice para o campo filtrado
2. Considerar índice composto para queries com múltiplos filtros
3. Usar índice de texto para buscas full-text

---

## 📝 Exemplos de Uso Completo

### Cenário 1: Teste completo antes de deploy
```bash
# 1. Verificar distribuição de dados
npm run check-data

# 2. Analisar performance de queries
npm run analyze-db

# 3. Teste de carga do banco
npm run load-test:db

# 4. Teste de stress
DB_STRESS_ITERATIONS=5000 npm run stress-test:db

# 5. Iniciar servidor
npm run dev

# 6. Em outro terminal, teste de carga HTTP
JOBBOARD_LOAD_TOTAL=10000 npm run load-test
```

### Cenário 2: Debugging de performance
```bash
# 1. Identificar queries lentas
npm run analyze-db

# 2. Testar performance atual
npm run load-test:db

# 3. Fazer otimizações (criar índices, etc.)

# 4. Testar novamente
npm run load-test:db

# 5. Comparar resultados
```

### Cenário 3: Teste de capacidade
```bash
# Teste progressivo de carga
DB_STRESS_CONCURRENCY=10 DB_STRESS_ITERATIONS=1000 npm run stress-test:db
DB_STRESS_CONCURRENCY=50 DB_STRESS_ITERATIONS=5000 npm run stress-test:db
DB_STRESS_CONCURRENCY=100 DB_STRESS_ITERATIONS=10000 npm run stress-test:db
DB_STRESS_CONCURRENCY=200 DB_STRESS_ITERATIONS=20000 npm run stress-test:db
```

---

## ⚙️ Requisitos

- Node.js 18+
- MongoDB rodando
- Arquivo `.env.local` configurado com `MONGODB_URI`
- Dependência `tsx` instalada (já incluída no projeto)

---

## 🚨 Avisos Importantes

1. **Não execute testes de stress em produção!** Use apenas em ambiente de desenvolvimento ou staging.

2. **Testes de carga podem consumir muitos recursos.** Monitore CPU e memória durante a execução.

3. **Resultados variam conforme hardware.** Compare sempre no mesmo ambiente.

4. **Banco de dados deve ter dados suficientes.** Scripts de seed podem ser necessários para testes realistas.

5. **Testes HTTP requerem servidor rodando.** Execute `npm run dev` antes de `npm run load-test`.

---

## 📚 Recursos Adicionais

- [MongoDB Performance Best Practices](https://www.mongodb.com/docs/manual/administration/analyzing-mongodb-performance/)
- [Mongoose Performance Tips](https://mongoosejs.com/docs/guide.html#performance)
- [Next.js API Routes Performance](https://nextjs.org/docs/api-routes/introduction)

---

**Criado por:** Ramon Santos  
**Última atualização:** 2025-11-27
