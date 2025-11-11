import { performance } from "perf_hooks";
import os from "os";

const TARGET_URL =
  process.env.JOBBOARD_PERF_URL || "http://localhost:3000/api/jobs?limit=20";
const TOTAL_REQUESTS = Number(process.env.JOBBOARD_PERF_TOTAL || 100_000);
const CONCURRENT_REQUESTS = Number(
  process.env.JOBBOARD_PERF_CONCURRENCY || 250
);

if (TOTAL_REQUESTS <= 0) {
  throw new Error("JOBBOARD_PERF_TOTAL deve ser maior que zero");
}

if (CONCURRENT_REQUESTS <= 0) {
  throw new Error("JOBBOARD_PERF_CONCURRENCY deve ser maior que zero");
}

interface BatchResult {
  durations: number[];
  errors: number;
}

async function measureRequest(): Promise<number> {
  const start = performance.now();

  const response = await fetch(TARGET_URL, {
    headers: {
      "user-agent": "jobboard-perf-test/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Consumir resposta para não manter conexões pendentes
  await response.arrayBuffer();

  return performance.now() - start;
}

async function runBatch(batchSize: number): Promise<BatchResult> {
  const durations: number[] = [];
  let errors = 0;

  await Promise.all(
    Array.from({ length: batchSize }).map(async () => {
      try {
        const duration = await measureRequest();
        durations.push(duration);
      } catch (error) {
        errors += 1;
      }
    })
  );

  return { durations, errors };
}

function summarizeDurations(durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const avg = total / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return {
    average: avg,
    min,
    max,
    median,
    p95,
    p99,
  };
}

async function main() {
  console.log("=== JobBoard Performance Test ===");
  console.log(`Endpoint: ${TARGET_URL}`);
  console.log(`Total de requisições: ${TOTAL_REQUESTS.toLocaleString()}`);
  console.log(`Concorrência por lote: ${CONCURRENT_REQUESTS}`);
  console.log(`Workers recomendados: ${os.cpus().length}`);

  const durations: number[] = [];
  let totalErrors = 0;

  const startedAt = performance.now();

  for (let sent = 0; sent < TOTAL_REQUESTS; sent += CONCURRENT_REQUESTS) {
    const remaining = TOTAL_REQUESTS - sent;
    const batchSize = Math.min(CONCURRENT_REQUESTS, remaining);

    const batchResult = await runBatch(batchSize);
    durations.push(...batchResult.durations);
    totalErrors += batchResult.errors;

    const progress = Math.min(sent + batchSize, TOTAL_REQUESTS);
    if (progress % 5000 === 0 || progress === TOTAL_REQUESTS) {
      console.log(
        ` progresso: ${progress.toLocaleString()} requisições concluídas`
      );
    }
  }

  const endedAt = performance.now();
  const totalTimeSeconds = (endedAt - startedAt) / 1000;
  const throughput = TOTAL_REQUESTS / totalTimeSeconds;

  const stats = summarizeDurations(durations);

  console.log("\n=== Resultados ===");
  console.log(`Tempo total: ${totalTimeSeconds.toFixed(2)}s`);
  console.log(`Throughput médio: ${throughput.toFixed(2)} req/s`);
  console.log(`Erros: ${totalErrors}`);
  console.log(`Tempo médio: ${stats.average.toFixed(2)} ms`);
  console.log(`Mediana: ${stats.median.toFixed(2)} ms`);
  console.log(`P95: ${stats.p95.toFixed(2)} ms`);
  console.log(`P99: ${stats.p99.toFixed(2)} ms`);
  console.log(`Mínimo: ${stats.min.toFixed(2)} ms`);
  console.log(`Máximo: ${stats.max.toFixed(2)} ms`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Erro no teste de performance:", error);
  process.exit(1);
});
