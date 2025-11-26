# Como Funciona o Teste de Carga - Explicação Detalhada

## 🎯 Objetivo

O `load-test.ts` simula **múltiplos usuários** acessando sua API simultaneamente para medir a performance.

## 📊 Fluxo Completo

```
┌─────────────┐      HTTP GET      ┌──────────────┐      Query      ┌──────────┐
│ load-test.ts│ ───────────────────▶│ /api/jobs    │ ───────────────▶│ MongoDB  │
│ (Cliente)   │                     │ (Servidor)   │                 │ (Banco)  │
└─────────────┘                     └──────────────┘                 └──────────┘
       │                                    │                              │
       │                                    │                              │
       │◀───── JSON (20 vagas) ─────────────┤◀──── 20 documentos ──────────┤
```

## 🔍 O que Cada Parte Faz

### 1. **load-test.ts (Cliente)**
```typescript
// Faz requisição HTTP
const response = await fetch("http://localhost:3000/api/jobs?limit=20");
```
- **NÃO** acessa o banco diretamente
- Faz requisições HTTP como um navegador faria
- Mede o tempo de resposta

### 2. **/api/jobs (Servidor)**
```typescript
// No arquivo app/api/jobs/route.ts
const jobs = await Vacancy.find({ status: "published" })
  .limit(20)  // ← Busca APENAS 20 vagas
  .lean();
```
- Recebe a requisição HTTP
- Busca dados do MongoDB
- Retorna JSON

### 3. **MongoDB (Banco)**
- Executa a query
- Retorna 20 documentos
- Usa índices para ser rápido

## ⚙️ Parâmetros Configuráveis

### URL Testada
```typescript
const TARGET_URL = "http://localhost:3000/api/jobs?limit=20";
//                                                      ↑
//                                    Busca APENAS 20 vagas por requisição
```

### Quantidade de Requisições
```bash
$env:JOBBOARD_LOAD_TOTAL=100  # Total de requisições
```
- **100 requisições** = 100 chamadas à API
- Cada uma busca 20 vagas
- Total de dados: 100 × 20 = 2.000 vagas retornadas

### Concorrência
```bash
$env:JOBBOARD_LOAD_CONCURRENCY=10  # Requisições simultâneas
```
- **10 simultâneas** = 10 requisições ao mesmo tempo
- Simula 10 usuários acessando juntos

### Warmup
```bash
$env:JOBBOARD_LOAD_WARMUP=100  # Requisições de aquecimento
```
- Executa **antes** do teste real
- Aquece cache, conexões, JIT
- **NÃO** conta no resultado final

## 🔥 Fase de Warmup (Aquecimento)

### Por que é importante?

**Primeira requisição** (fria):
```
Servidor → Conecta MongoDB → Compila código → Executa query → 10s
```

**Requisições seguintes** (quente):
```
Servidor → (já conectado) → (já compilado) → Executa query → 100ms
```

### O que o warmup faz:

1. **Aquece conexões:**
   - Pool de conexões do MongoDB
   - Keep-alive HTTP

2. **Aquece cache:**
   - Cache em memória da API
   - Cache do MongoDB

3. **Aquece JIT:**
   - Node.js compila código "hot"
   - V8 otimiza funções frequentes

### Novo visual do warmup:

```
🔥 Aquecendo servidor...
   Executando 100 requisições de aquecimento...

   [████████████████████] 100% (100/100)

   ✅ Warmup concluído em 12.45s
   📊 Requisições: 100 sucesso, 0 erros
   ⚡ Taxa: 8 req/s
```

## 📈 Métricas Coletadas

### Durante o Teste

Para **cada requisição**, o script mede:
```typescript
const start = performance.now();
const response = await fetch(TARGET_URL);
const duration = performance.now() - start;  // ← Latência
```

### Estatísticas Calculadas

**Latência:**
- **Mínima:** Requisição mais rápida
- **Média:** Tempo médio
- **Mediana (P50):** 50% são mais rápidas
- **P95:** 95% são mais rápidas (SLA comum)
- **Máxima:** Requisição mais lenta

**Throughput:**
```typescript
const throughput = totalRequests / totalTimeSeconds;  // req/s
```

**Taxa de Erro:**
```typescript
const errorRate = (totalErrors / totalRequests) * 100;  // %
```

## 🎯 Exemplo Prático

### Configuração
```bash
TOTAL_REQUESTS = 100
CONCURRENCY = 10
WARMUP = 50
```

### Execução

**1. Warmup (50 requisições):**
```
Lote 1: 10 requisições simultâneas
Lote 2: 10 requisições simultâneas
Lote 3: 10 requisições simultâneas
Lote 4: 10 requisições simultâneas
Lote 5: 10 requisições simultâneas
```

**2. Teste Real (100 requisições):**
```
Lote 1: 10 simultâneas → Mede tempo
Lote 2: 10 simultâneas → Mede tempo
...
Lote 10: 10 simultâneas → Mede tempo
```

**3. Resultado:**
```
P95: 150ms  ← 95% das requisições < 150ms
Throughput: 500 req/s
Erros: 0%
```

## 💡 Interpretando Resultados

### ✅ Bom Desempenho
```
P95: < 200ms
Throughput: > 500 req/s
Erros: < 1%
```
**Significa:** API rápida, escalável, confiável

### ⚠️ Performance Aceitável
```
P95: 200-500ms
Throughput: 100-500 req/s
Erros: 1-5%
```
**Significa:** Funciona, mas pode melhorar

### ❌ Performance Ruim
```
P95: > 1000ms
Throughput: < 100 req/s
Erros: > 5%
```
**Significa:** Precisa otimização urgente!

## 🔧 Otimizações Testadas

### Antes (Lento)
```
Query: countDocuments() → 10s
Cache: Nenhum
Índices: Faltando
```
**Resultado:** P95 = 10.830ms ❌

### Depois (Rápido)
```
Query: estimatedDocumentCount() → 10ms
Cache: 30 segundos
Índices: Criados
```
**Resultado esperado:** P95 < 200ms ✅

## 📝 Resumo

| Pergunta | Resposta |
|----------|----------|
| **Busca todos os dados?** | ❌ Não! Apenas 20 vagas por requisição |
| **Acessa o banco diretamente?** | ❌ Não! Faz HTTP para a API |
| **Quantas requisições?** | ✅ Configurável (padrão: 10.000) |
| **Simula usuários reais?** | ✅ Sim! Requisições simultâneas |
| **Warmup é necessário?** | ✅ Sim! Aquece cache e conexões |

---

**Criado em:** 2025-11-26  
**Versão:** 2.0
