import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { performance } from "perf_hooks";

// Import models
import Vacancy from "../models/Vacancy";
import Application from "../models/Application";
import User from "../models/User";
import Company from "../models/Company";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Erro: MONGODB_URI não definida no .env.local");
  process.exit(1);
}

// ==================== CONFIGURAÇÃO ====================
const CONCURRENT_QUERIES = Number(process.env.DB_STRESS_CONCURRENCY || 50);
const TOTAL_ITERATIONS = Number(process.env.DB_STRESS_ITERATIONS || 1000);
const QUERY_TYPES = ["simple", "complex", "aggregation", "populate"];

// ==================== TIPOS ====================
interface StressResult {
  queryType: string;
  iteration: number;
  duration: number;
  success: boolean;
  error?: string;
}

// ==================== FUNÇÕES ====================

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Conectado ao MongoDB\n");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

/**
 * Query simples - buscar vagas publicadas
 */
async function simpleQuery(): Promise<number> {
  const start = performance.now();
  await Vacancy.find({ status: "published" }).limit(20).lean();
  return performance.now() - start;
}

/**
 * Query complexa - buscar vagas com múltiplos filtros
 */
async function complexQuery(): Promise<number> {
  const start = performance.now();
  await Vacancy.find({
    status: "published",
    level: { $in: ["senior", "mid"] },
    remote: true,
    $or: [
      { type: "full-time" },
      { type: "contract" }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return performance.now() - start;
}

/**
 * Query com agregação - estatísticas de vagas
 */
async function aggregationQuery(): Promise<number> {
  const start = performance.now();
  await Vacancy.aggregate([
    { $match: { status: "published" } },
    {
      $group: {
        _id: {
          level: "$level",
          type: "$type",
        },
        count: { $sum: 1 },
        avgApplications: { $avg: "$applicationsCount" },
        avgViews: { $avg: "$viewsCount" },
      },
    },
    { $sort: { count: -1 } },
  ]);
  return performance.now() - start;
}

/**
 * Query com populate - buscar vagas com dados da empresa
 */
async function populateQuery(): Promise<number> {
  const start = performance.now();
  await Vacancy.find({ status: "published" })
    .populate("companyId")
    .limit(20)
    .lean();
  return performance.now() - start;
}

/**
 * Executa uma query aleatória
 */
async function executeRandomQuery(
  iteration: number
): Promise<StressResult> {
  const queryType = QUERY_TYPES[Math.floor(Math.random() * QUERY_TYPES.length)];
  
  try {
    let duration: number;
    
    switch (queryType) {
      case "simple":
        duration = await simpleQuery();
        break;
      case "complex":
        duration = await complexQuery();
        break;
      case "aggregation":
        duration = await aggregationQuery();
        break;
      case "populate":
        duration = await populateQuery();
        break;
      default:
        duration = await simpleQuery();
    }
    
    return {
      queryType,
      iteration,
      duration,
      success: true,
    };
  } catch (error) {
    return {
      queryType,
      iteration,
      duration: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Executa um lote de queries concorrentes
 */
async function runBatch(
  startIteration: number,
  batchSize: number
): Promise<StressResult[]> {
  const promises = Array.from({ length: batchSize }, (_, i) =>
    executeRandomQuery(startIteration + i)
  );
  
  return Promise.all(promises);
}

/**
 * Mostra progresso
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
    `\r[${bar}] ${percentage.toFixed(1)}% | ${current}/${total} | ` +
      `${rate.toFixed(0)} q/s | ETA: ${eta.toFixed(0)}s`
  );
}

/**
 * Calcula estatísticas
 */
function calculateStats(durations: number[]) {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = sorted.reduce((sum, val) => sum + val, 0);
  
  return {
    count: sorted.length,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: total / sorted.length || 0,
    median: sorted[Math.floor(sorted.length * 0.5)] || 0,
    p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
    p90: sorted[Math.floor(sorted.length * 0.90)] || 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
  };
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         JobBoard - Teste de Stress do Banco               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log("📋 Configuração:");
  console.log(`   Iterações totais: ${TOTAL_ITERATIONS.toLocaleString()}`);
  console.log(`   Queries concorrentes: ${CONCURRENT_QUERIES}`);
  console.log(`   Tipos de query: ${QUERY_TYPES.join(", ")}\n`);
  
  await connectDB();
  
  console.log("🚀 Iniciando teste de stress...\n");
  
  const allResults: StressResult[] = [];
  const startTime = performance.now();
  
  // Executar testes em lotes
  for (let i = 0; i < TOTAL_ITERATIONS; i += CONCURRENT_QUERIES) {
    const batchSize = Math.min(CONCURRENT_QUERIES, TOTAL_ITERATIONS - i);
    const batchResults = await runBatch(i, batchSize);
    allResults.push(...batchResults);
    
    showProgress(i + batchSize, TOTAL_ITERATIONS, startTime);
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  console.log("\n\n");
  
  // ==================== RESULTADOS ====================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                      RESULTADOS                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const successful = allResults.filter((r) => r.success);
  const failed = allResults.filter((r) => !r.success);
  
  console.log("📊 Resumo Geral:");
  console.log(`   Total de queries: ${allResults.length.toLocaleString()}`);
  console.log(`   Queries bem-sucedidas: ${successful.length.toLocaleString()} ✅`);
  console.log(`   Queries com erro: ${failed.length.toLocaleString()} ❌`);
  console.log(`   Taxa de erro: ${((failed.length / allResults.length) * 100).toFixed(2)}%`);
  console.log(`   Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Throughput: ${(successful.length / (totalTime / 1000)).toFixed(2)} queries/s\n`);
  
  // Estatísticas por tipo de query
  console.log("📈 Estatísticas por Tipo de Query:\n");
  
  QUERY_TYPES.forEach((type) => {
    const typeResults = successful.filter((r) => r.queryType === type);
    if (typeResults.length === 0) return;
    
    const durations = typeResults.map((r) => r.duration);
    const stats = calculateStats(durations);
    
    console.log(`   ${type.toUpperCase()}:`);
    console.log(`      Execuções: ${stats.count}`);
    console.log(`      Mínima: ${stats.min.toFixed(2)}ms`);
    console.log(`      Média: ${stats.avg.toFixed(2)}ms`);
    console.log(`      Mediana: ${stats.median.toFixed(2)}ms`);
    console.log(`      Máxima: ${stats.max.toFixed(2)}ms`);
    console.log(`      P75: ${stats.p75.toFixed(2)}ms`);
    console.log(`      P90: ${stats.p90.toFixed(2)}ms`);
    console.log(`      P95: ${stats.p95.toFixed(2)}ms`);
    console.log(`      P99: ${stats.p99.toFixed(2)}ms`);
    console.log();
  });
  
  // Estatísticas gerais de latência
  const allDurations = successful.map((r) => r.duration);
  const generalStats = calculateStats(allDurations);
  
  console.log("⏱️  Latência Geral:");
  console.log(`   Mínima: ${generalStats.min.toFixed(2)}ms`);
  console.log(`   Média: ${generalStats.avg.toFixed(2)}ms`);
  console.log(`   Mediana: ${generalStats.median.toFixed(2)}ms`);
  console.log(`   Máxima: ${generalStats.max.toFixed(2)}ms`);
  console.log(`   P75: ${generalStats.p75.toFixed(2)}ms`);
  console.log(`   P90: ${generalStats.p90.toFixed(2)}ms`);
  console.log(`   P95: ${generalStats.p95.toFixed(2)}ms`);
  console.log(`   P99: ${generalStats.p99.toFixed(2)}ms\n`);
  
  // Análise de performance
  console.log("🎯 Análise de Performance:");
  
  const errorRate = (failed.length / allResults.length) * 100;
  if (errorRate > 5) {
    console.log(`   ❌ CRÍTICO: Taxa de erro muito alta (${errorRate.toFixed(2)}%)!`);
  } else if (errorRate > 1) {
    console.log(`   ⚠️  ATENÇÃO: Taxa de erro elevada (${errorRate.toFixed(2)}%)`);
  } else {
    console.log(`   ✅ Taxa de erro aceitável (${errorRate.toFixed(2)}%)`);
  }
  
  if (generalStats.p95 > 1000) {
    console.log(`   ❌ CRÍTICO: P95 muito alto (${generalStats.p95.toFixed(2)}ms)!`);
  } else if (generalStats.p95 > 500) {
    console.log(`   ⚠️  ATENÇÃO: P95 elevado (${generalStats.p95.toFixed(2)}ms)`);
  } else if (generalStats.p95 > 200) {
    console.log(`   ✅ P95 aceitável (${generalStats.p95.toFixed(2)}ms)`);
  } else {
    console.log(`   🎉 P95 excelente (${generalStats.p95.toFixed(2)}ms)`);
  }
  
  const throughput = successful.length / (totalTime / 1000);
  if (throughput < 100) {
    console.log(`   ⚠️  Throughput baixo (${throughput.toFixed(2)} q/s)`);
  } else if (throughput < 500) {
    console.log(`   ✅ Throughput bom (${throughput.toFixed(2)} q/s)`);
  } else {
    console.log(`   🎉 Throughput excelente (${throughput.toFixed(2)} q/s)`);
  }
  
  console.log();
  
  // Mostrar erros se houver
  if (failed.length > 0) {
    console.log("\n❌ Erros Encontrados:");
    const errorsByType = failed.reduce((acc, result) => {
      const error = result.error || "Unknown error";
      acc[error] = (acc[error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(errorsByType).forEach(([error, count]) => {
      console.log(`   - ${error}: ${count} ocorrências`);
    });
    console.log();
  }
  
  await mongoose.disconnect();
  console.log("✅ Desconectado do MongoDB\n");
  
  // Exit code
  const hasCriticalIssues = errorRate > 5 || generalStats.p95 > 1000;
  process.exit(hasCriticalIssues ? 1 : 0);
}

// ==================== EXECUÇÃO ====================
main().catch((error) => {
  console.error("\n❌ Erro fatal no teste de stress:", error);
  process.exit(1);
});
