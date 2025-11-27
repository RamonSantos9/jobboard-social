import { performance } from "perf_hooks";
import os from "os";

// ==================== CONFIGURAÇÃO ====================
const BASE_URL = process.env.JOBBOARD_LOAD_BASE_URL || "http://localhost:3000";
const TARGET_URL =
  process.env.JOBBOARD_LOAD_URL || `${BASE_URL}/api/jobs?limit=20`;
const TOTAL_REQUESTS = Number(process.env.JOBBOARD_LOAD_TOTAL || 10_000);
const CONCURRENT_REQUESTS = Number(
  process.env.JOBBOARD_LOAD_CONCURRENCY || 100
);
const WARMUP_REQUESTS = Number(process.env.JOBBOARD_LOAD_WARMUP || 100);
const TEST_MULTIPLE_ENDPOINTS = process.env.JOBBOARD_LOAD_MULTI === "true";

// Endpoints para testar (quando TEST_MULTIPLE_ENDPOINTS = true)
const ENDPOINTS = [
  "/api/jobs?limit=20",
  "/api/jobs?limit=50",
  "/api/jobs?status=published",
  "/api/jobs?level=senior",
  "/api/jobs?remote=true",
  "/api/companies",
  "/api/users",
];

// ==================== VALIDAÇÃO ====================
if (TOTAL_REQUESTS <= 0) {
  throw new Error("JOBBOARD_LOAD_TOTAL deve ser maior que zero");
}

if (CONCURRENT_REQUESTS <= 0) {
  throw new Error("JOBBOARD_LOAD_CONCURRENCY deve ser maior que zero");
}

// ==================== TIPOS ====================
interface BatchResult {
  durations: number[];
  errors: number;
  statusCodes: Map<number, number>;
}

interface TestStats {
  average: number;
  min: number;
  max: number;
  median: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Mede o tempo de uma requisição HTTP
 */
async function measureRequest(): Promise<{ duration: number; status: number }> {
  const start = performance.now();

  const response = await fetch(TARGET_URL, {
    headers: {
      "user-agent": "jobboard-load-test/2.0",
      "accept": "application/json",
    },
  });

  // Consumir resposta para não manter conexões pendentes
  await response.arrayBuffer();

  const duration = performance.now() - start;

  return {
    duration,
    status: response.status,
  };
}

/**
 * Executa um lote de requisições concorrentes
 */
async function runBatch(batchSize: number): Promise<BatchResult> {
  const durations: number[] = [];
  const statusCodes = new Map<number, number>();
  let errors = 0;

  await Promise.all(
    Array.from({ length: batchSize }).map(async () => {
      try {
        const { duration, status } = await measureRequest();
        durations.push(duration);
        statusCodes.set(status, (statusCodes.get(status) || 0) + 1);
      } catch (error) {
        errors += 1;
        console.error("Erro na requisição:", error instanceof Error ? error.message : error);
      }
    })
  );

  return { durations, errors, statusCodes };
}

/**
 * Calcula estatísticas descritivas de um array de durações
 */
function calculateStats(durations: number[]): TestStats {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const avg = total / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Percentis
  const getPercentile = (p: number) => sorted[Math.floor(sorted.length * p)];
  const median = getPercentile(0.5);
  const p50 = median;
  const p75 = getPercentile(0.75);
  const p90 = getPercentile(0.90);
  const p95 = getPercentile(0.95);
  const p99 = getPercentile(0.99);

  // Desvio padrão
  const variance = sorted.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  return {
    average: avg,
    min,
    max,
    median,
    p50,
    p75,
    p90,
    p95,
    p99,
    stdDev,
  };
}

/**
 * Formata bytes para formato legível
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Exibe barra de progresso
 */
function showProgress(current: number, total: number, startTime: number) {
  const percentage = (current / total) * 100;
  const elapsed = (performance.now() - startTime) / 1000;
  const rate = current / elapsed;
  const eta = (total - current) / rate;

  const barLength = 30;
  const filled = Math.floor((percentage / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);

  process.stdout.write(
    `\r[${bar}] ${percentage.toFixed(1)}% | ${current.toLocaleString()}/${total.toLocaleString()} | ` +
    `${rate.toFixed(0)} req/s | ETA: ${eta.toFixed(0)}s`
  );
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         JobBoard - Teste de Carga HTTP                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("📋 Configuração:");
  console.log(`   Endpoint: ${TARGET_URL}`);
  console.log(`   Total de requisições: ${TOTAL_REQUESTS.toLocaleString()}`);
  console.log(`   Concorrência: ${CONCURRENT_REQUESTS}`);
  console.log(`   Warmup: ${WARMUP_REQUESTS} requisições`);
  console.log(`   CPUs disponíveis: ${os.cpus().length}`);
  console.log(`   Memória total: ${formatBytes(os.totalmem())}`);
  console.log(`   Memória livre: ${formatBytes(os.freemem())}\n`);

  // ==================== WARMUP ====================
  if (WARMUP_REQUESTS > 0) {
    console.log("🔥 Aquecendo servidor...");
    console.log(`   Executando ${WARMUP_REQUESTS} requisições de aquecimento...\n`);
    
    const warmupStart = performance.now();
    let warmupCompleted = 0;
    let warmupErrors = 0;
    
    // Executar warmup em lotes menores para mostrar progresso
    const warmupBatchSize = Math.min(10, WARMUP_REQUESTS);
    for (let i = 0; i < WARMUP_REQUESTS; i += warmupBatchSize) {
      const batchSize = Math.min(warmupBatchSize, WARMUP_REQUESTS - i);
      const result = await runBatch(batchSize);
      warmupCompleted += batchSize;
      warmupErrors += result.errors;
      
      // Mostrar progresso
      const progress = (warmupCompleted / WARMUP_REQUESTS) * 100;
      const bar = "█".repeat(Math.floor(progress / 5)) + "░".repeat(20 - Math.floor(progress / 5));
      process.stdout.write(`\r   [${bar}] ${progress.toFixed(0)}% (${warmupCompleted}/${WARMUP_REQUESTS})`);
    }
    
    const warmupEnd = performance.now();
    const warmupTime = (warmupEnd - warmupStart) / 1000;
    
    console.log(`\n\n   ✅ Warmup concluído em ${warmupTime.toFixed(2)}s`);
    console.log(`   📊 Requisições: ${warmupCompleted - warmupErrors} sucesso, ${warmupErrors} erros`);
    console.log(`   ⚡ Taxa: ${(warmupCompleted / warmupTime).toFixed(0)} req/s\n`);
  }

  // ==================== TESTE PRINCIPAL ====================
  console.log("🚀 Iniciando teste de carga...\n");

  const durations: number[] = [];
  const allStatusCodes = new Map<number, number>();
  let totalErrors = 0;

  const startedAt = performance.now();

  for (let sent = 0; sent < TOTAL_REQUESTS; sent += CONCURRENT_REQUESTS) {
    const remaining = TOTAL_REQUESTS - sent;
    const batchSize = Math.min(CONCURRENT_REQUESTS, remaining);

    const batchResult = await runBatch(batchSize);
    durations.push(...batchResult.durations);
    totalErrors += batchResult.errors;

    // Agregar status codes
    batchResult.statusCodes.forEach((count, status) => {
      allStatusCodes.set(status, (allStatusCodes.get(status) || 0) + count);
    });

    const progress = Math.min(sent + batchSize, TOTAL_REQUESTS);
    showProgress(progress, TOTAL_REQUESTS, startedAt);
  }

  const endedAt = performance.now();
  const totalTimeSeconds = (endedAt - startedAt) / 1000;

  console.log("\n\n");

  // ==================== RESULTADOS ====================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                      RESULTADOS                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const successfulRequests = TOTAL_REQUESTS - totalErrors;
  const throughput = successfulRequests / totalTimeSeconds;
  const errorRate = (totalErrors / TOTAL_REQUESTS) * 100;

  console.log("⏱️  Tempo e Throughput:");
  console.log(`   Tempo total: ${totalTimeSeconds.toFixed(2)}s`);
  console.log(`   Throughput médio: ${throughput.toFixed(2)} req/s`);
  console.log(`   Requisições bem-sucedidas: ${successfulRequests.toLocaleString()}`);
  console.log(`   Requisições com erro: ${totalErrors.toLocaleString()} (${errorRate.toFixed(2)}%)\n`);

  // Só mostrar estatísticas se houver requisições bem-sucedidas
  if (durations.length > 0) {
    const stats = calculateStats(durations);
    
    console.log("📊 Latência (ms):");
    console.log(`   Mínima:  ${stats.min.toFixed(2)} ms`);
    console.log(`   Média:   ${stats.average.toFixed(2)} ms`);
    console.log(`   Mediana: ${stats.median.toFixed(2)} ms`);
    console.log(`   Máxima:  ${stats.max.toFixed(2)} ms`);
    console.log(`   Desvio:  ${stats.stdDev.toFixed(2)} ms\n`);

    console.log("📈 Percentis:");
    console.log(`   P50: ${stats.p50.toFixed(2)} ms`);
    console.log(`   P75: ${stats.p75.toFixed(2)} ms`);
    console.log(`   P90: ${stats.p90.toFixed(2)} ms`);
    console.log(`   P95: ${stats.p95.toFixed(2)} ms`);
    console.log(`   P99: ${stats.p99.toFixed(2)} ms\n`);

    console.log("🔢 Status HTTP:");
    const sortedStatuses = Array.from(allStatusCodes.entries()).sort((a, b) => a[0] - b[0]);
    sortedStatuses.forEach(([status, count]) => {
      const percentage = (count / successfulRequests) * 100;
      const emoji = status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";
      console.log(`   ${emoji} ${status}: ${count.toLocaleString()} (${percentage.toFixed(2)}%)`);
    });

    // ==================== ANÁLISE ====================
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                      ANÁLISE                               ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    if (errorRate > 5) {
      console.log("❌ CRÍTICO: Taxa de erro acima de 5%!");
    } else if (errorRate > 1) {
      console.log("⚠️  ATENÇÃO: Taxa de erro acima de 1%");
    } else {
      console.log("✅ Taxa de erro aceitável");
    }

    if (stats.p95 > 1000) {
      console.log("❌ CRÍTICO: P95 acima de 1 segundo!");
    } else if (stats.p95 > 500) {
      console.log("⚠️  ATENÇÃO: P95 acima de 500ms");
    } else if (stats.p95 > 200) {
      console.log("✅ P95 aceitável (< 500ms)");
    } else {
      console.log("🎉 P95 excelente (< 200ms)");
    }

    if (throughput < 100) {
      console.log("⚠️  Throughput baixo (< 100 req/s)");
    } else if (throughput < 500) {
      console.log("✅ Throughput bom (100-500 req/s)");
    } else {
      console.log("🎉 Throughput excelente (> 500 req/s)");
    }

    console.log("\n");

    // Exit code baseado em critérios de sucesso
    const hasHighErrorRate = errorRate > 5;
    const hasSlowP95 = stats.p95 > 1000;
    const exitCode = hasHighErrorRate || hasSlowP95 ? 1 : 0;

    process.exit(exitCode);
  } else {
    // Nenhuma requisição bem-sucedida
    console.log("❌ ERRO: Nenhuma requisição foi bem-sucedida!\n");
    console.log("💡 Possíveis causas:");
    console.log("   1. O servidor não está rodando");
    console.log("   2. A URL está incorreta: " + TARGET_URL);
    console.log("   3. Firewall bloqueando conexões");
    console.log("   4. Porta ocupada ou inacessível\n");
    console.log("🔧 Solução:");
    console.log("   Execute 'npm run dev' em outro terminal antes de rodar o teste.\n");
    
    process.exit(1);
  }
}

// ==================== EXECUÇÃO ====================
main().catch((error) => {
  console.error("\n❌ Erro fatal no teste de carga:", error);
  process.exit(1);
});
