# Teste de Carga HTTP - Guia Completo

## 📋 Visão Geral

O script `scripts/load-test.ts` realiza testes de carga HTTP na sua aplicação para medir:
- **Throughput** (requisições por segundo)
- **Latência** (tempo de resposta)
- **Taxa de erro**
- **Distribuição de status HTTP**

## 🚀 Como Usar

### Uso Básico

```bash
# Teste padrão (10.000 requisições, 100 concorrentes)
npx tsx scripts/load-test.ts

# Com servidor local rodando
npm run dev
# Em outro terminal:
npx tsx scripts/load-test.ts
```

### Configuração via Variáveis de Ambiente

```bash
# Teste leve (1.000 requisições)
JOBBOARD_LOAD_TOTAL=1000 npx tsx scripts/load-test.ts

# Teste pesado (100.000 requisições, 500 concorrentes)
JOBBOARD_LOAD_TOTAL=100000 JOBBOARD_LOAD_CONCURRENCY=500 npx tsx scripts/load-test.ts

# Testar endpoint específico
JOBBOARD_LOAD_URL="http://localhost:3000/api/companies" npx tsx scripts/load-test.ts

# Sem warmup
JOBBOARD_LOAD_WARMUP=0 npx tsx scripts/load-test.ts
```

## ⚙️ Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `JOBBOARD_LOAD_URL` | `http://localhost:3000/api/jobs?limit=20` | URL do endpoint a testar |
| `JOBBOARD_LOAD_TOTAL` | `10000` | Total de requisições |
| `JOBBOARD_LOAD_CONCURRENCY` | `100` | Requisições simultâneas |
| `JOBBOARD_LOAD_WARMUP` | `100` | Requisições de aquecimento |

## 📊 Métricas Reportadas

### 1. Tempo e Throughput
- **Tempo total:** Duração do teste
- **Throughput médio:** Requisições por segundo (req/s)
- **Requisições bem-sucedidas:** Total - erros
- **Taxa de erro:** Percentual de falhas

### 2. Latência
- **Mínima:** Menor tempo de resposta
- **Média:** Tempo médio
- **Mediana:** Valor central (P50)
- **Máxima:** Maior tempo de resposta
- **Desvio padrão:** Variabilidade

### 3. Percentis
- **P50 (Mediana):** 50% das requisições são mais rápidas
- **P75:** 75% das requisições são mais rápidas
- **P90:** 90% das requisições são mais rápidas
- **P95:** 95% das requisições são mais rápidas (SLA comum)
- **P99:** 99% das requisições são mais rápidas

### 4. Status HTTP
- Distribuição de códigos de status (200, 404, 500, etc.)
- Percentual de cada status

## 🎯 Interpretando Resultados

### ✅ Bom Desempenho
```
Throughput: > 500 req/s
P95: < 200ms
Taxa de erro: < 1%
```

### ⚠️ Desempenho Aceitável
```
Throughput: 100-500 req/s
P95: 200-500ms
Taxa de erro: 1-5%
```

### ❌ Desempenho Ruim
```
Throughput: < 100 req/s
P95: > 1000ms
Taxa de erro: > 5%
```

## 📈 Exemplo de Saída

```
╔════════════════════════════════════════════════════════════╗
║         JobBoard - Teste de Carga HTTP                    ║
╚════════════════════════════════════════════════════════════╝

📋 Configuração:
   Endpoint: http://localhost:3000/api/jobs?limit=20
   Total de requisições: 10,000
   Concorrência: 100
   Warmup: 100 requisições
   CPUs disponíveis: 8
   Memória total: 16.00 GB
   Memória livre: 8.50 GB

🔥 Aquecendo servidor...
✅ Warmup concluído

🚀 Iniciando teste de carga...

[██████████████████████████████] 100.0% | 10,000/10,000 | 850 req/s | ETA: 0s

╔════════════════════════════════════════════════════════════╗
║                      RESULTADOS                            ║
╚════════════════════════════════════════════════════════════╝

⏱️  Tempo e Throughput:
   Tempo total: 11.76s
   Throughput médio: 850.34 req/s
   Requisições bem-sucedidas: 10,000
   Requisições com erro: 0 (0.00%)

📊 Latência (ms):
   Mínima:  45.23 ms
   Média:   117.45 ms
   Mediana: 110.32 ms
   Máxima:  456.78 ms
   Desvio:  35.67 ms

📈 Percentis:
   P50: 110.32 ms
   P75: 135.67 ms
   P90: 165.43 ms
   P95: 189.21 ms
   P99: 234.56 ms

🔢 Status HTTP:
   ✅ 200: 10,000 (100.00%)

╔════════════════════════════════════════════════════════════╗
║                      ANÁLISE                               ║
╚════════════════════════════════════════════════════════════╝

✅ Taxa de erro aceitável
🎉 P95 excelente (< 200ms)
🎉 Throughput excelente (> 500 req/s)
```

## 🔧 Troubleshooting

### Problema: "ECONNREFUSED"
**Causa:** Servidor não está rodando  
**Solução:** Execute `npm run dev` antes do teste

### Problema: Taxa de erro alta
**Causa:** Servidor sobrecarregado ou bugs  
**Solução:**
1. Reduza concorrência: `JOBBOARD_LOAD_CONCURRENCY=50`
2. Verifique logs do servidor
3. Analise queries lentas no banco

### Problema: P95 muito alto
**Causa:** Queries lentas ou falta de índices  
**Solução:**
1. Execute `npx tsx scripts/analyze-db-performance.ts`
2. Crie índices necessários
3. Otimize queries N+1

### Problema: Throughput baixo
**Causa:** Gargalo no servidor ou banco  
**Solução:**
1. Verifique uso de CPU/memória
2. Otimize banco de dados
3. Considere caching (Redis)
4. Use connection pooling

## 📝 Boas Práticas

### 1. Sempre faça Warmup
O warmup aquece o servidor (JIT, cache, connection pool):
```bash
JOBBOARD_LOAD_WARMUP=500 npx tsx scripts/load-test.ts
```

### 2. Teste Progressivamente
Comece com carga baixa e aumente gradualmente:
```bash
# Teste 1: Leve
JOBBOARD_LOAD_TOTAL=1000 JOBBOARD_LOAD_CONCURRENCY=10 npx tsx scripts/load-test.ts

# Teste 2: Médio
JOBBOARD_LOAD_TOTAL=10000 JOBBOARD_LOAD_CONCURRENCY=100 npx tsx scripts/load-test.ts

# Teste 3: Pesado
JOBBOARD_LOAD_TOTAL=100000 JOBBOARD_LOAD_CONCURRENCY=500 npx tsx scripts/load-test.ts
```

### 3. Teste Diferentes Endpoints
```bash
# Home
JOBBOARD_LOAD_URL="http://localhost:3000/api/jobs" npx tsx scripts/load-test.ts

# Busca
JOBBOARD_LOAD_URL="http://localhost:3000/api/jobs?search=React" npx tsx scripts/load-test.ts

# Empresa
JOBBOARD_LOAD_URL="http://localhost:3000/api/companies/123" npx tsx scripts/load-test.ts
```

### 4. Monitore Recursos
Durante o teste, monitore:
- CPU: `top` ou `htop`
- Memória: `free -h`
- Conexões DB: MongoDB Atlas Dashboard
- Logs: `npm run dev` (outro terminal)

## 🎯 Cenários de Teste Recomendados

### Teste de Fumaça (Smoke Test)
Verifica se o sistema funciona basicamente:
```bash
JOBBOARD_LOAD_TOTAL=100 JOBBOARD_LOAD_CONCURRENCY=10 npx tsx scripts/load-test.ts
```

### Teste de Carga (Load Test)
Simula uso normal esperado:
```bash
JOBBOARD_LOAD_TOTAL=10000 JOBBOARD_LOAD_CONCURRENCY=100 npx tsx scripts/load-test.ts
```

### Teste de Estresse (Stress Test)
Encontra limites do sistema:
```bash
JOBBOARD_LOAD_TOTAL=100000 JOBBOARD_LOAD_CONCURRENCY=500 npx tsx scripts/load-test.ts
```

### Teste de Pico (Spike Test)
Simula picos repentinos:
```bash
# Primeiro: carga normal
JOBBOARD_LOAD_TOTAL=5000 JOBBOARD_LOAD_CONCURRENCY=50 npx tsx scripts/load-test.ts

# Depois: pico
JOBBOARD_LOAD_TOTAL=5000 JOBBOARD_LOAD_CONCURRENCY=500 npx tsx scripts/load-test.ts
```

## 📊 Comparação com Outras Ferramentas

| Ferramenta | Vantagens | Desvantagens |
|------------|-----------|--------------|
| **load-test.ts** | Integrado ao projeto, TypeScript, fácil customizar | Menos features que ferramentas dedicadas |
| **Apache Bench (ab)** | Simples, rápido | Limitado, sem percentis |
| **wrk** | Muito rápido, Lua scripting | Curva de aprendizado |
| **k6** | Muito completo, JavaScript | Requer instalação separada |
| **Artillery** | YAML config, CI/CD friendly | Node.js overhead |

## 🔗 Integração com CI/CD

### GitHub Actions
```yaml
name: Load Test

on:
  push:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run dev &
      - run: sleep 10
      - run: JOBBOARD_LOAD_TOTAL=1000 npx tsx scripts/load-test.ts
```

## 📚 Referências

- [Performance Testing Best Practices](https://www.nginx.com/blog/performance-testing-best-practices/)
- [Understanding Percentiles](https://www.elastic.co/blog/averages-can-dangerous-use-percentile)
- [Load Testing vs Stress Testing](https://www.blazemeter.com/blog/performance-testing-vs-load-testing-vs-stress-testing)

---

**Criado em:** 2025-11-26  
**Versão:** 2.0
