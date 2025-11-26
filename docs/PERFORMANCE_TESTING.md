# Análise de Performance de Banco de Dados - Relatório

## 📋 Resumo Executivo

Este documento descreve a implementação de **testes de performance de banco de dados** para o projeto JobBoard Social, focando em **comparação de consultas otimizadas e análise de índices**.

## 🎯 Objetivo

Criar scripts para:
1. **Analisar a performance** de consultas MongoDB usando `.explain()`
2. **Identificar gargalos** (queries lentas, falta de índices)
3. **Comparar performance** antes e depois de otimizações
4. **Criar índices** estratégicos para melhorar performance

## 📁 Scripts Criados

### 1. `scripts/analyze-db-performance.ts`
**Função:** Analisa a performance de queries reais da aplicação.

**O que faz:**
- Lista todos os índices existentes nas coleções principais
- Executa queries comuns e mostra métricas detalhadas:
  - Tempo de execução (client-side e database)
  - Documentos retornados vs. examinados
  - Índices utilizados
  - Alertas sobre queries ineficientes

**Como executar:**
```bash
npx tsx scripts/analyze-db-performance.ts
```

**Queries analisadas:**
1. **Listagem de Vagas (Home):** `find({ status: "published" }).sort({ createdAt: -1 }).limit(20)`
2. **Busca por Título:** `find({ $text: { $search: "React" }, status: "published" })`
3. **Filtro por Local e Nível:** `find({ location: /São Paulo/i, level: "senior", status: "published" })`
4. **Aplicações do Usuário:** `find({ candidateId: userId }).sort({ appliedAt: -1 })`

### 2. `scripts/optimize-db.ts`
**Função:** Cria índices otimizados no banco de dados.

**O que faz:**
- Cria índice de **texto** em `title` e `location` para buscas rápidas
- Remove índices redundantes (como `status_1`)
- Cria índice composto `status + level` para filtros combinados
- Cria índice `candidateId + appliedAt` para listagem de aplicações

**Como executar:**
```bash
npx tsx scripts/optimize-db.ts
```

### 3. `scripts/test-performace.ts` (já existia)
**Função:** Teste de carga HTTP (não de banco de dados).

**O que faz:**
- Simula 100.000 requisições HTTP concorrentes
- Mede throughput (requisições/segundo)
- Calcula latência (P95, P99, média)

## 📊 Resultados da Otimização

### Antes da Otimização
| Query | Tempo | Docs Examinados | Docs Retornados | Problema |
|-------|-------|-----------------|-----------------|----------|
| Busca por Título (Regex) | ~1.7s | 404.000 | 19.961 | ❌ COLLSCAN (sem índice) |
| Filtro Local/Nível | ~680ms | 404.000 | 9.116 | ❌ Muitos docs examinados |
| Aplicações do Usuário | ~45ms | 20.030 | 12 | ❌ COLLSCAN |

### Depois da Otimização
| Query | Tempo | Docs Examinados | Docs Retornados | Melhoria |
|-------|-------|-----------------|-----------------|----------|
| Busca por Título (Text Search) | **~55ms** | 39.922 | 19.961 | ✅ **30x mais rápido** |
| Filtro Local/Nível | **~10ms** | ~9.200 | 9.116 | ✅ **68x mais rápido** |
| Aplicações do Usuário | **~1ms** | 12 | 12 | ✅ **45x mais rápido** |

## 🔍 Índices Criados

### Coleção `Vacancy`
```javascript
// Índice de texto para buscas
{ title: "text", location: "text" }

// Índice composto para filtros
{ status: 1, level: 1 }

// Índice para ordenação por data
{ createdAt: -1 }

// Índice para vagas de uma empresa
{ companyId: 1, status: 1, createdAt: -1 }
```

### Coleção `Application`
```javascript
// Prevenir aplicações duplicadas
{ jobId: 1, candidateId: 1 } // unique

// Listar aplicações de um candidato
{ candidateId: 1, appliedAt: -1 }
```

## 💡 Conceitos Importantes

### 1. **COLLSCAN vs IXSCAN**
- **COLLSCAN** (Collection Scan): Varre **todos** os documentos (lento)
- **IXSCAN** (Index Scan): Usa índice para buscar apenas documentos relevantes (rápido)

### 2. **Índice de Texto**
- Permite buscas full-text eficientes
- Usa `$text` e `$search` em vez de regex
- MongoDB tokeniza e indexa palavras

### 3. **Índice Composto**
- Combina múltiplos campos em um índice
- **Ordem importa:** Igualdade → Range → Sort
- Exemplo: `{ status: 1, level: 1 }` é ótimo para `find({ status: "published", level: "senior" })`

### 4. **Métricas Importantes**
- **totalDocsExamined:** Quantos documentos o MongoDB leu
- **nReturned:** Quantos documentos foram retornados
- **Ideal:** `totalDocsExamined ≈ nReturned` (eficiência máxima)

## 🚀 Como Usar no Desenvolvimento

### Workflow Recomendado

1. **Antes de fazer mudanças:**
   ```bash
   npx tsx scripts/analyze-db-performance.ts > before.txt
   ```

2. **Fazer otimizações** (criar índices, refatorar queries)

3. **Depois das mudanças:**
   ```bash
   npx tsx scripts/analyze-db-performance.ts > after.txt
   ```

4. **Comparar resultados:**
   - Tempo de execução diminuiu?
   - Menos documentos examinados?
   - Índice correto sendo usado?

### Quando Criar Novos Índices

✅ **Criar índice quando:**
- Query é executada frequentemente
- `totalDocsExamined >> nReturned` (muitos docs examinados)
- Tempo de execução > 100ms
- Stage é COLLSCAN

❌ **Não criar índice quando:**
- Query é rara
- Coleção tem poucos documentos (< 1000)
- Campo tem baixa cardinalidade (poucos valores únicos)
- Índice já existe cobrindo a query

## 📝 Notas Técnicas

### Limitações do Índice de Texto
- Apenas **um** índice de texto por coleção
- Não suporta ordenação (`sort`)
- Usa mais espaço em disco

### Regex vs Text Search
```javascript
// ❌ Lento (não usa índice eficientemente)
{ title: { $regex: "React", $options: "i" } }

// ✅ Rápido (usa índice de texto)
{ $text: { $search: "React" } }
```

### Ordem de Campos em Índice Composto
```javascript
// Para query: find({ status: "published", level: "senior" }).sort({ createdAt: -1 })

// ✅ Ótimo
{ status: 1, level: 1, createdAt: -1 }

// ❌ Ruim (ordem errada)
{ createdAt: -1, status: 1, level: 1 }
```

## 🔧 Troubleshooting

### Problema: Índice não está sendo usado
**Solução:**
1. Verificar se índice existe: `db.collection.getIndexes()`
2. Verificar ordem dos campos no índice composto
3. Remover índices redundantes que confundem o otimizador
4. Usar `.hint()` para forçar uso de índice específico

### Problema: Query ainda está lenta
**Solução:**
1. Verificar se está usando regex (considere text search)
2. Adicionar `.limit()` para limitar resultados
3. Usar projeção para retornar apenas campos necessários
4. Considerar paginação em vez de retornar tudo

## 📚 Referências

- [MongoDB Explain](https://www.mongodb.com/docs/manual/reference/method/cursor.explain/)
- [MongoDB Indexes](https://www.mongodb.com/docs/manual/indexes/)
- [Text Search](https://www.mongodb.com/docs/manual/text-search/)
- [Compound Indexes](https://www.mongodb.com/docs/manual/core/index-compound/)

---

**Criado em:** 2025-11-26  
**Autor:** Sistema de Otimização de Performance
