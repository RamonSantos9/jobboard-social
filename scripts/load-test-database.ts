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
  indexSizes: Record<string, number>;
}

interface TestSummary {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

// ==================== FUNÇÕES AUXILIARES ====================

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
 * Calcula percentis de um array de números
 */
function getPercentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * p);
  return sorted[index] || 0;
}

/**
 * Conecta ao MongoDB
 */
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
 * Executa uma query e mede performance
 */
async function measureQuery(
  name: string,
  collection: string,
  queryBuilder: any
): Promise<QueryResult> {
  const start = performance.now();
  
  try {
    // Executa a query com explain para obter estatísticas
    const explanation = await queryBuilder.explain("executionStats");
    const end = performance.now();
    
    const stats = explanation.executionStats;
    const plan = explanation.queryPlanner.winningPlan;
    
    // Determina o índice usado
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

/**
 * Obtém estatísticas de uma coleção
 */
async function getCollectionStats(
  model: any,
  collectionName: string
): Promise<CollectionStats> {
  const stats = await model.collection.stats();
  const indexes = await model.collection.indexes();
  
  const indexSizes: Record<string, number> = {};
  Object.entries(stats.indexSizes || {}).forEach(([key, value]) => {
    indexSizes[key] = value as number;
  });
  
  return {
    collection: collectionName,
    count: stats.count,
    size: stats.size,
    avgObjSize: stats.avgObjSize,
    storageSize: stats.storageSize,
    indexes: indexes.length,
    indexSizes,
  };
}

// ==================== TESTES DE PERFORMANCE ====================

/**
 * Testa queries da coleção Vacancy
 */
async function testVacancyQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("📋 Testando queries de Vagas...");
  
  // 1. Buscar todas as vagas publicadas
  results.push(
    await measureQuery(
      "Todas as vagas publicadas",
      "Vacancy",
      Vacancy.find({ status: "published" })
    )
  );
  
  // 2. Buscar vagas recentes (ordenadas por data)
  results.push(
    await measureQuery(
      "Vagas recentes (ordenadas)",
      "Vacancy",
      Vacancy.find({ status: "published" }).sort({ createdAt: -1 }).limit(50)
    )
  );
  
  // 3. Buscar vagas por nível
  results.push(
    await measureQuery(
      "Vagas por nível (senior)",
      "Vacancy",
      Vacancy.find({ status: "published", level: "senior" })
    )
  );
  
  // 4. Buscar vagas remotas
  results.push(
    await measureQuery(
      "Vagas remotas",
      "Vacancy",
      Vacancy.find({ status: "published", remote: true })
    )
  );
  
  // 5. Buscar vagas por empresa (primeira empresa)
  const company = await Company.findOne();
  if (company) {
    results.push(
      await measureQuery(
        "Vagas por empresa",
        "Vacancy",
        Vacancy.find({ companyId: company._id, status: "published" })
      )
    );
  }
  
  // 6. Buscar vagas com agregação (contagem por nível)
  results.push(
    await measureQuery(
      "Agregação: Contagem por nível",
      "Vacancy",
      Vacancy.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ])
    )
  );
  
  // 7. Buscar vagas com populate (company)
  results.push(
    await measureQuery(
      "Vagas com populate (company)",
      "Vacancy",
      Vacancy.find({ status: "published" }).populate("companyId").limit(20)
    )
  );
  
  return results;
}

/**
 * Testa queries da coleção Application
 */
async function testApplicationQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("📝 Testando queries de Candidaturas...");
  
  // 1. Todas as candidaturas
  results.push(
    await measureQuery(
      "Todas as candidaturas",
      "Application",
      Application.find({})
    )
  );
  
  // 2. Candidaturas por status
  results.push(
    await measureQuery(
      "Candidaturas pendentes",
      "Application",
      Application.find({ status: "pending" })
    )
  );
  
  // 3. Candidaturas por candidato (primeiro usuário)
  const user = await User.findOne();
  if (user) {
    results.push(
      await measureQuery(
        "Candidaturas por candidato",
        "Application",
        Application.find({ candidateId: user._id })
      )
    );
  }
  
  // 4. Candidaturas recentes
  results.push(
    await measureQuery(
      "Candidaturas recentes",
      "Application",
      Application.find({}).sort({ appliedAt: -1 }).limit(50)
    )
  );
  
  return results;
}

/**
 * Testa queries da coleção User
 */
async function testUserQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("👥 Testando queries de Usuários...");
  
  // 1. Todos os usuários
  results.push(
    await measureQuery(
      "Todos os usuários",
      "User",
      User.find({})
    )
  );
  
  // 2. Usuários por tipo
  results.push(
    await measureQuery(
      "Usuários candidatos",
      "User",
      User.find({ userType: "candidate" })
    )
  );
  
  // 3. Usuários recrutadores
  results.push(
    await measureQuery(
      "Usuários recrutadores",
      "User",
      User.find({ userType: "recruiter" })
    )
  );
  
  // 4. Usuários verificados
  results.push(
    await measureQuery(
      "Usuários verificados",
      "User",
      User.find({ emailVerified: true })
    )
  );
  
  return results;
}

/**
 * Testa queries da coleção Company
 */
async function testCompanyQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("🏢 Testando queries de Empresas...");
  
  // 1. Todas as empresas
  results.push(
    await measureQuery(
      "Todas as empresas",
      "Company",
      Company.find({})
    )
  );
  
  // 2. Empresas verificadas
  results.push(
    await measureQuery(
      "Empresas verificadas",
      "Company",
      Company.find({ verified: true })
    )
  );
  
  // 3. Empresas por setor
  results.push(
    await measureQuery(
      "Empresas por setor (Technology)",
      "Company",
      Company.find({ industry: "Technology" })
    )
  );
  
  return results;
}

/**
 * Testa queries da coleção Post
 */
async function testPostQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("📰 Testando queries de Posts...");
  
  // 1. Todos os posts
  results.push(
    await measureQuery(
      "Todos os posts",
      "Post",
      Post.find({})
    )
  );
  
  // 2. Posts recentes
  results.push(
    await measureQuery(
      "Posts recentes",
      "Post",
      Post.find({}).sort({ createdAt: -1 }).limit(50)
    )
  );
  
  // 3. Posts por autor (primeiro usuário)
  const user = await User.findOne();
  if (user) {
    results.push(
      await measureQuery(
        "Posts por autor",
        "Post",
        Post.find({ authorId: user._id })
      )
    );
  }
  
  return results;
}

/**
 * Testa queries de outras coleções
 */
async function testOtherQueries(): Promise<QueryResult[]> {
  const results: QueryResult[] = [];
  
  console.log("🔍 Testando outras coleções...");
  
  // Comments
  results.push(
    await measureQuery(
      "Todos os comentários",
      "Comment",
      Comment.find({})
    )
  );
  
  // Connections
  results.push(
    await measureQuery(
      "Todas as conexões",
      "Connection",
      Connection.find({})
    )
  );
  
  // Notifications
  results.push(
    await measureQuery(
      "Todas as notificações",
      "Notification",
      Notification.find({})
    )
  );
  
  // Messages
  results.push(
    await measureQuery(
      "Todas as mensagens",
      "Message",
      Message.find({})
    )
  );
  
  // Profiles
  results.push(
    await measureQuery(
      "Todos os perfis",
      "Profile",
      Profile.find({})
    )
  );
  
  // SavedJobs
  results.push(
    await measureQuery(
      "Todos os jobs salvos",
      "SavedJob",
      SavedJob.find({})
    )
  );
  
  // UserInteractions
  results.push(
    await measureQuery(
      "Todas as interações",
      "UserInteraction",
      UserInteraction.find({})
    )
  );
  
  return results;
}

// ==================== RELATÓRIOS ====================

/**
 * Exibe estatísticas das coleções
 */
async function showCollectionStats() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              ESTATÍSTICAS DAS COLEÇÕES                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const models = [
    { model: Vacancy, name: "Vacancy" },
    { model: Application, name: "Application" },
    { model: User, name: "User" },
    { model: Company, name: "Company" },
    { model: Post, name: "Post" },
    { model: Comment, name: "Comment" },
    { model: Connection, name: "Connection" },
    { model: Notification, name: "Notification" },
    { model: Message, name: "Message" },
    { model: Profile, name: "Profile" },
    { model: SavedJob, name: "SavedJob" },
    { model: UserInteraction, name: "UserInteraction" },
  ];
  
  for (const { model, name } of models) {
    try {
      const stats = await getCollectionStats(model, name);
      
      console.log(`📊 ${stats.collection}:`);
      console.log(`   Documentos: ${stats.count.toLocaleString()}`);
      console.log(`   Tamanho: ${formatBytes(stats.size)}`);
      console.log(`   Tamanho médio: ${formatBytes(stats.avgObjSize)}`);
      console.log(`   Storage: ${formatBytes(stats.storageSize)}`);
      console.log(`   Índices: ${stats.indexes}`);
      
      if (Object.keys(stats.indexSizes).length > 0) {
        console.log(`   Tamanho dos índices:`);
        Object.entries(stats.indexSizes).forEach(([name, size]) => {
          console.log(`      - ${name}: ${formatBytes(size)}`);
        });
      }
      console.log();
    } catch (error) {
      console.log(`❌ ${name}: Erro ao obter estatísticas`);
      console.log();
    }
  }
}

/**
 * Exibe resultados dos testes
 */
function showTestResults(results: QueryResult[]) {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              RESULTADOS DOS TESTES                         ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  // Agrupar por coleção
  const byCollection = results.reduce((acc, result) => {
    if (!acc[result.collection]) {
      acc[result.collection] = [];
    }
    acc[result.collection].push(result);
    return acc;
  }, {} as Record<string, QueryResult[]>);
  
  // Exibir resultados por coleção
  Object.entries(byCollection).forEach(([collection, queries]) => {
    console.log(`\n📦 ${collection}:`);
    console.log("─".repeat(60));
    
    queries.forEach((query) => {
      const status = query.success ? "✅" : "❌";
      const efficiency = query.docsExamined > 0 
        ? ((query.count / query.docsExamined) * 100).toFixed(1) 
        : "N/A";
      
      console.log(`\n${status} ${query.name}`);
      console.log(`   Duração: ${query.duration.toFixed(2)}ms (DB: ${query.executionTimeMs}ms)`);
      console.log(`   Documentos retornados: ${query.count.toLocaleString()}`);
      console.log(`   Documentos examinados: ${query.docsExamined.toLocaleString()}`);
      console.log(`   Chaves examinadas: ${query.keysExamined.toLocaleString()}`);
      console.log(`   Índice usado: ${query.indexUsed}`);
      console.log(`   Eficiência: ${efficiency}%`);
      
      if (!query.success && query.error) {
        console.log(`   ⚠️  Erro: ${query.error}`);
      }
      
      // Alertas de performance
      if (query.success) {
        if (query.indexUsed === "COLLSCAN" && query.count > 100) {
          console.log(`   ⚠️  ALERTA: Collection scan em coleção grande!`);
        }
        if (query.docsExamined > query.count * 10 && query.count > 0) {
          console.log(`   ⚠️  ALERTA: Muitos documentos examinados vs retornados!`);
        }
        if (query.executionTimeMs > 100) {
          console.log(`   ⚠️  ALERTA: Query lenta (>100ms)!`);
        }
      }
    });
  });
}

/**
 * Exibe resumo geral
 */
function showSummary(results: QueryResult[], totalTime: number) {
  console.log("\n\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    RESUMO GERAL                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const durations = successful.map((r) => r.duration);
  
  const summary: TestSummary = {
    totalQueries: results.length,
    successfulQueries: successful.length,
    failedQueries: failed.length,
    totalDuration: totalTime,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
    minDuration: Math.min(...durations) || 0,
    maxDuration: Math.max(...durations) || 0,
    p50: getPercentile(durations, 0.5),
    p95: getPercentile(durations, 0.95),
    p99: getPercentile(durations, 0.99),
  };
  
  console.log("📊 Estatísticas Gerais:");
  console.log(`   Total de queries: ${summary.totalQueries}`);
  console.log(`   Queries bem-sucedidas: ${summary.successfulQueries} ✅`);
  console.log(`   Queries com erro: ${summary.failedQueries} ❌`);
  console.log(`   Tempo total: ${(summary.totalDuration / 1000).toFixed(2)}s`);
  console.log();
  
  console.log("⏱️  Latência das Queries:");
  console.log(`   Mínima: ${summary.minDuration.toFixed(2)}ms`);
  console.log(`   Média: ${summary.avgDuration.toFixed(2)}ms`);
  console.log(`   Máxima: ${summary.maxDuration.toFixed(2)}ms`);
  console.log(`   P50: ${summary.p50.toFixed(2)}ms`);
  console.log(`   P95: ${summary.p95.toFixed(2)}ms`);
  console.log(`   P99: ${summary.p99.toFixed(2)}ms`);
  console.log();
  
  // Análise de performance
  console.log("🎯 Análise de Performance:");
  
  if (summary.failedQueries > 0) {
    console.log(`   ❌ ${summary.failedQueries} queries falharam!`);
  } else {
    console.log(`   ✅ Todas as queries executadas com sucesso`);
  }
  
  if (summary.p95 > 1000) {
    console.log(`   ❌ P95 muito alto (>1s) - Performance crítica!`);
  } else if (summary.p95 > 500) {
    console.log(`   ⚠️  P95 alto (>500ms) - Considere otimizações`);
  } else if (summary.p95 > 100) {
    console.log(`   ✅ P95 aceitável (<500ms)`);
  } else {
    console.log(`   🎉 P95 excelente (<100ms)`);
  }
  
  // Queries com COLLSCAN
  const collscans = successful.filter((r) => r.indexUsed === "COLLSCAN");
  if (collscans.length > 0) {
    console.log(`   ⚠️  ${collscans.length} queries usando COLLSCAN - Considere criar índices`);
  } else {
    console.log(`   ✅ Todas as queries usando índices`);
  }
  
  console.log();
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         JobBoard - Teste de Performance do Banco          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  console.log("💻 Informações do Sistema:");
  console.log(`   CPUs: ${os.cpus().length}`);
  console.log(`   Memória total: ${formatBytes(os.totalmem())}`);
  console.log(`   Memória livre: ${formatBytes(os.freemem())}`);
  console.log(`   Plataforma: ${os.platform()}`);
  console.log(`   Node.js: ${process.version}\n`);
  
  // Conectar ao banco
  await connectDB();
  
  // Mostrar estatísticas das coleções
  await showCollectionStats();
  
  // Executar testes
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              EXECUTANDO TESTES DE QUERIES                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const startTime = performance.now();
  
  const allResults: QueryResult[] = [];
  
  // Executar todos os testes
  allResults.push(...(await testVacancyQueries()));
  allResults.push(...(await testApplicationQueries()));
  allResults.push(...(await testUserQueries()));
  allResults.push(...(await testCompanyQueries()));
  allResults.push(...(await testPostQueries()));
  allResults.push(...(await testOtherQueries()));
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // Exibir resultados
  showTestResults(allResults);
  showSummary(allResults, totalTime);
  
  // Desconectar
  await mongoose.disconnect();
  console.log("✅ Desconectado do MongoDB\n");
  
  // Exit code baseado em falhas
  const hasFailures = allResults.some((r) => !r.success);
  const hasCriticalPerformance = allResults.some(
    (r) => r.success && r.executionTimeMs > 1000
  );
  
  if (hasFailures || hasCriticalPerformance) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// ==================== EXECUÇÃO ====================
main().catch((error) => {
  console.error("\n❌ Erro fatal no teste de performance:", error);
  process.exit(1);
});
