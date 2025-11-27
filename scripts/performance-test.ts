import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { performance } from "perf_hooks";
import os from "os";

// Import all models
import Vacancy from "../models/Vacancy";
import Company from "../models/Company";
import Application from "../models/Application";
import User from "../models/User";
import Post from "../models/Post";
import Comment from "../models/Comment";
import Connection from "../models/Connection";
import Notification from "../models/Notification";
import Message from "../models/Message";
import Profile from "../models/Profile";
import SavedJob from "../models/SavedJob";
import UserInteraction from "../models/UserInteraction";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Erro: MONGODB_URI não definida no .env.local");
  process.exit(1);
}

// ==================== TIPOS ====================
interface QueryResult {
  name: string;
  collection: string;
  duration: number;
  count: number;
  docsExamined: number;
  keysExamined: number;
  indexUsed: string;
  executionTimeMs: number;
  success: boolean;
  error?: string;
}

interface CollectionStats {
  collection: string;
  count: number;
  size: number;
  avgObjSize: number;
  storageSize: number;
  indexes: number;
  indexNames: string[];
}

// ==================== FUNÇÕES AUXILIARES ====================

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getPercentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * p);
  return sorted[index] || 0;
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Conectado ao MongoDB com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

// ==================== TESTES ====================

/**
 * Obtém estatísticas de uma coleção
 */
async function getCollectionStats(
  model: any,
  collectionName: string
): Promise<CollectionStats | null> {
  try {
    const stats = await model.collection.stats();
    const indexes = await model.collection.indexes();
    const indexNames = indexes.map((idx: any) => idx.name);
    
    return {
      collection: collectionName,
      count: stats.count,
      size: stats.size,
      avgObjSize: stats.avgObjSize,
      storageSize: stats.storageSize,
      indexes: indexes.length,
      indexNames,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Executa uma query e mede performance
 */
async function measureQuery(
  name: string,
  collection: string,
  queryBuilder: any
): Promise<QueryResult> {
  const start = performance.now();
  
  try {
    const explanation = await queryBuilder.explain("executionStats");
    const end = performance.now();
    
    const stats = explanation.executionStats;
    const plan = explanation.queryPlanner.winningPlan;
    
    let indexUsed = "COLLSCAN";
    if (plan.inputStage?.indexName) {
      indexUsed = plan.inputStage.indexName;
    } else if (plan.indexName) {
      indexUsed = plan.indexName;
    } else if (plan.stage === "IXSCAN") {
      indexUsed = "INDEX";
    }
    
    return {
      name,
      collection,
      duration: end - start,
      count: stats.nReturned,
      docsExamined: stats.totalDocsExamined,
      keysExamined: stats.totalKeysExamined,
      indexUsed,
      executionTimeMs: stats.executionTimeMillis,
      success: true,
    };
  } catch (error) {
    const end = performance.now();
    return {
      name,
      collection,
      duration: end - start,
      count: 0,
      docsExamined: 0,
      keysExamined: 0,
      indexUsed: "ERROR",
      executionTimeMs: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║         🚀 TESTE DE PERFORMANCE DO BANCO DE DADOS 🚀       ║");
  console.log("║                    JobBoard Social                         ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log("💻 Informações do Sistema:");
  console.log(`   • CPUs: ${os.cpus().length} cores`);
  console.log(`   • Memória Total: ${formatBytes(os.totalmem())}`);
  console.log(`   • Memória Livre: ${formatBytes(os.freemem())}`);
  console.log(`   • Plataforma: ${os.platform()}`);
  console.log(`   • Node.js: ${process.version}\n`);
  
  const testStartTime = performance.now();
  
  // Conectar ao banco
  await connectDB();
  
  // ==================== PARTE 1: ESTATÍSTICAS DAS COLEÇÕES ====================
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              📊 ESTATÍSTICAS DAS COLEÇÕES                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const models = [
    { model: Vacancy, name: "Vacancy (Vagas)" },
    { model: Application, name: "Application (Candidaturas)" },
    { model: User, name: "User (Usuários)" },
    { model: Company, name: "Company (Empresas)" },
    { model: Post, name: "Post (Posts)" },
    { model: Comment, name: "Comment (Comentários)" },
    { model: Connection, name: "Connection (Conexões)" },
    { model: Notification, name: "Notification (Notificações)" },
    { model: Message, name: "Message (Mensagens)" },
    { model: Profile, name: "Profile (Perfis)" },
    { model: SavedJob, name: "SavedJob (Vagas Salvas)" },
    { model: UserInteraction, name: "UserInteraction (Interações)" },
  ];
  
  const collectionStats: CollectionStats[] = [];
  let totalDocs = 0;
  let totalSize = 0;
  
  for (const { model, name } of models) {
    const stats = await getCollectionStats(model, name);
    if (stats) {
      collectionStats.push(stats);
      totalDocs += stats.count;
      totalSize += stats.size;
      
      console.log(`📦 ${stats.collection}`);
      console.log(`   • Documentos: ${stats.count.toLocaleString()}`);
      console.log(`   • Tamanho: ${formatBytes(stats.size)}`);
      console.log(`   • Tamanho Médio: ${formatBytes(stats.avgObjSize)}`);
      console.log(`   • Índices: ${stats.indexes} (${stats.indexNames.join(", ")})`);
      console.log();
    }
  }
  
  console.log("📈 RESUMO GERAL:");
  console.log(`   • Total de Documentos: ${totalDocs.toLocaleString()}`);
  console.log(`   • Tamanho Total: ${formatBytes(totalSize)}`);
  console.log(`   • Coleções: ${collectionStats.length}\n`);
  
  // ==================== PARTE 2: TESTES DE QUERIES ====================
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              🔍 TESTANDO PERFORMANCE DAS QUERIES           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const allResults: QueryResult[] = [];
  
  // VAGAS
  console.log("📋 Testando Queries de Vagas...");
  allResults.push(
    await measureQuery(
      "Buscar todas as vagas publicadas",
      "Vacancy",
      Vacancy.find({ status: "published" })
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar vagas recentes (ordenadas)",
      "Vacancy",
      Vacancy.find({ status: "published" }).sort({ createdAt: -1 }).limit(50)
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar vagas por nível (senior)",
      "Vacancy",
      Vacancy.find({ status: "published", level: "senior" })
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar vagas remotas",
      "Vacancy",
      Vacancy.find({ status: "published", remote: true })
    )
  );
  
  const company = await Company.findOne();
  if (company) {
    allResults.push(
      await measureQuery(
        "Buscar vagas por empresa",
        "Vacancy",
        Vacancy.find({ companyId: company._id, status: "published" })
      )
    );
  }
  
  allResults.push(
    await measureQuery(
      "Agregação: Contagem por nível",
      "Vacancy",
      Vacancy.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ])
    )
  );
  
  console.log("   ✅ 6 queries de vagas testadas\n");
  
  // CANDIDATURAS
  console.log("📝 Testando Queries de Candidaturas...");
  allResults.push(
    await measureQuery(
      "Buscar todas as candidaturas",
      "Application",
      Application.find({})
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar candidaturas pendentes",
      "Application",
      Application.find({ status: "pending" })
    )
  );
  
  const user = await User.findOne();
  if (user) {
    allResults.push(
      await measureQuery(
        "Buscar candidaturas por candidato",
        "Application",
        Application.find({ candidateId: user._id })
      )
    );
  }
  
  allResults.push(
    await measureQuery(
      "Buscar candidaturas recentes",
      "Application",
      Application.find({}).sort({ appliedAt: -1 }).limit(50)
    )
  );
  
  console.log("   ✅ 4 queries de candidaturas testadas\n");
  
  // USUÁRIOS
  console.log("👥 Testando Queries de Usuários...");
  allResults.push(
    await measureQuery(
      "Buscar todos os usuários",
      "User",
      User.find({})
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar usuários candidatos",
      "User",
      User.find({ userType: "candidate" })
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar usuários recrutadores",
      "User",
      User.find({ userType: "recruiter" })
    )
  );
  
  console.log("   ✅ 3 queries de usuários testadas\n");
  
  // EMPRESAS
  console.log("🏢 Testando Queries de Empresas...");
  allResults.push(
    await measureQuery(
      "Buscar todas as empresas",
      "Company",
      Company.find({})
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar empresas verificadas",
      "Company",
      Company.find({ verified: true })
    )
  );
  
  console.log("   ✅ 2 queries de empresas testadas\n");
  
  // POSTS
  console.log("📰 Testando Queries de Posts...");
  allResults.push(
    await measureQuery(
      "Buscar todos os posts",
      "Post",
      Post.find({})
    )
  );
  
  allResults.push(
    await measureQuery(
      "Buscar posts recentes",
      "Post",
      Post.find({}).sort({ createdAt: -1 }).limit(50)
    )
  );
  
  console.log("   ✅ 2 queries de posts testadas\n");
  
  // OUTRAS COLEÇÕES
  console.log("🔍 Testando Outras Coleções...");
  allResults.push(
    await measureQuery("Buscar comentários", "Comment", Comment.find({}))
  );
  allResults.push(
    await measureQuery("Buscar conexões", "Connection", Connection.find({}))
  );
  allResults.push(
    await measureQuery("Buscar notificações", "Notification", Notification.find({}))
  );
  allResults.push(
    await measureQuery("Buscar mensagens", "Message", Message.find({}))
  );
  allResults.push(
    await measureQuery("Buscar perfis", "Profile", Profile.find({}))
  );
  allResults.push(
    await measureQuery("Buscar vagas salvas", "SavedJob", SavedJob.find({}))
  );
  allResults.push(
    await measureQuery("Buscar interações", "UserInteraction", UserInteraction.find({}))
  );
  
  console.log("   ✅ 7 queries de outras coleções testadas\n");
  
  // ==================== PARTE 3: RESULTADOS DETALHADOS ====================
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              📊 RESULTADOS DETALHADOS                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const successful = allResults.filter((r) => r.success);
  const failed = allResults.filter((r) => !r.success);
  
  // Agrupar por coleção
  const byCollection = successful.reduce((acc, result) => {
    if (!acc[result.collection]) {
      acc[result.collection] = [];
    }
    acc[result.collection].push(result);
    return acc;
  }, {} as Record<string, QueryResult[]>);
  
  Object.entries(byCollection).forEach(([collection, queries]) => {
    console.log(`\n📦 ${collection}:`);
    console.log("─".repeat(60));
    
    queries.forEach((query) => {
      const efficiency = query.docsExamined > 0 
        ? ((query.count / query.docsExamined) * 100).toFixed(1) 
        : "100.0";
      
      const statusIcon = query.indexUsed === "COLLSCAN" ? "⚠️ " : "✅";
      
      console.log(`\n${statusIcon} ${query.name}`);
      console.log(`   ⏱️  Tempo: ${query.executionTimeMs}ms`);
      console.log(`   📄 Retornados: ${query.count.toLocaleString()} docs`);
      console.log(`   🔍 Examinados: ${query.docsExamined.toLocaleString()} docs`);
      console.log(`   🔑 Índice: ${query.indexUsed}`);
      console.log(`   💯 Eficiência: ${efficiency}%`);
      
      // Alertas
      if (query.indexUsed === "COLLSCAN" && query.count > 100) {
        console.log(`   ⚠️  ALERTA: Collection scan em coleção grande!`);
      }
      if (query.executionTimeMs > 100) {
        console.log(`   ⚠️  ALERTA: Query lenta (>100ms)!`);
      }
    });
  });
  
  // ==================== PARTE 4: ANÁLISE E RECOMENDAÇÕES ====================
  console.log("\n\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              🎯 ANÁLISE E RECOMENDAÇÕES                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const durations = successful.map((r) => r.executionTimeMs);
  const stats = {
    count: durations.length,
    min: Math.min(...durations) || 0,
    max: Math.max(...durations) || 0,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
    p50: getPercentile(durations, 0.5),
    p95: getPercentile(durations, 0.95),
    p99: getPercentile(durations, 0.99),
  };
  
  console.log("📊 Estatísticas Gerais:");
  console.log(`   • Total de queries testadas: ${allResults.length}`);
  console.log(`   • Queries bem-sucedidas: ${successful.length} ✅`);
  console.log(`   • Queries com erro: ${failed.length} ❌`);
  console.log();
  
  console.log("⏱️  Latência das Queries:");
  console.log(`   • Mínima: ${stats.min.toFixed(2)}ms`);
  console.log(`   • Média: ${stats.avg.toFixed(2)}ms`);
  console.log(`   • Máxima: ${stats.max.toFixed(2)}ms`);
  console.log(`   • P50 (Mediana): ${stats.p50.toFixed(2)}ms`);
  console.log(`   • P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`   • P99: ${stats.p99.toFixed(2)}ms`);
  console.log();
  
  // Análise de índices
  const collscans = successful.filter((r) => r.indexUsed === "COLLSCAN");
  const slowQueries = successful.filter((r) => r.executionTimeMs > 100);
  const inefficientQueries = successful.filter(
    (r) => r.docsExamined > r.count * 10 && r.count > 0
  );
  
  console.log("🔍 Análise de Performance:");
  console.log();
  
  // Performance geral
  if (stats.p95 < 100) {
    console.log("   🎉 EXCELENTE: P95 < 100ms - Performance ótima!");
  } else if (stats.p95 < 500) {
    console.log("   ✅ BOM: P95 < 500ms - Performance aceitável");
  } else if (stats.p95 < 1000) {
    console.log("   ⚠️  ATENÇÃO: P95 < 1000ms - Considere otimizações");
  } else {
    console.log("   ❌ CRÍTICO: P95 > 1000ms - Performance ruim!");
  }
  
  // Índices
  if (collscans.length === 0) {
    console.log("   ✅ ÓTIMO: Todas as queries usando índices!");
  } else {
    console.log(`   ⚠️  ATENÇÃO: ${collscans.length} queries usando COLLSCAN`);
  }
  
  // Queries lentas
  if (slowQueries.length === 0) {
    console.log("   ✅ ÓTIMO: Nenhuma query lenta detectada!");
  } else {
    console.log(`   ⚠️  ATENÇÃO: ${slowQueries.length} queries lentas (>100ms)`);
  }
  
  console.log();
  
  // Recomendações
  console.log("💡 Recomendações:");
  console.log();
  
  if (collscans.length > 0) {
    console.log("   📌 CRIAR ÍNDICES para as seguintes queries:");
    collscans.forEach((q) => {
      console.log(`      • ${q.collection}: ${q.name}`);
    });
    console.log();
  }
  
  if (slowQueries.length > 0) {
    console.log("   📌 OTIMIZAR as seguintes queries lentas:");
    slowQueries.forEach((q) => {
      console.log(`      • ${q.collection}: ${q.name} (${q.executionTimeMs}ms)`);
    });
    console.log();
  }
  
  if (inefficientQueries.length > 0) {
    console.log("   📌 REVISAR queries ineficientes (muitos docs examinados):");
    inefficientQueries.forEach((q) => {
      const ratio = (q.docsExamined / q.count).toFixed(1);
      console.log(`      • ${q.collection}: ${q.name} (ratio: ${ratio}:1)`);
    });
    console.log();
  }
  
  if (collscans.length === 0 && slowQueries.length === 0 && inefficientQueries.length === 0) {
    console.log("   🎉 Parabéns! Seu banco está bem otimizado!");
    console.log("   ✅ Todas as queries estão usando índices");
    console.log("   ✅ Todas as queries estão rápidas");
    console.log("   ✅ Todas as queries estão eficientes");
    console.log();
  }
  
  // Tempo total
  const testEndTime = performance.now();
  const totalTime = (testEndTime - testStartTime) / 1000;
  
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ TESTE CONCLUÍDO                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log(`⏱️  Tempo total de execução: ${totalTime.toFixed(2)}s`);
  console.log(`📊 Queries testadas: ${allResults.length}`);
  console.log(`✅ Taxa de sucesso: ${((successful.length / allResults.length) * 100).toFixed(1)}%\n`);
  
  // Desconectar
  await mongoose.disconnect();
  console.log("✅ Desconectado do MongoDB\n");
  
  // Exit code
  const hasCriticalIssues = stats.p95 > 1000 || failed.length > 0;
  process.exit(hasCriticalIssues ? 1 : 0);
}

// ==================== EXECUÇÃO ====================
main().catch((error) => {
  console.error("\n❌ Erro fatal no teste de performance:", error);
  process.exit(1);
});
