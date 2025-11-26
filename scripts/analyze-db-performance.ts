import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { performance } from "perf_hooks";

// Import models
import Vacancy from "../models/Vacancy";
import Company from "../models/Company";
import Application from "../models/Application";
import User from "../models/User";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Erro: MONGODB_URI não definida no .env.local");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Conectado ao MongoDB para análise de performance.");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

async function analyzeQuery(label: string, queryBuilder: any) {
  console.log(`\n--- Analisando: ${label} ---`);
  
  try {
    const start = performance.now();
    const explanation = await queryBuilder.explain("executionStats");
    const end = performance.now();

    const stats = explanation.executionStats;
    
    console.log(`Tempo de Execução (Client-side): ${(end - start).toFixed(2)}ms`);
    console.log(`Tempo de Execução (DB): ${stats.executionTimeMillis}ms`);
    console.log(`Documentos Retornados: ${stats.nReturned}`);
    console.log(`Documentos Examinados: ${stats.totalDocsExamined}`);
    console.log(`Chaves (Índices) Examinadas: ${stats.totalKeysExamined}`);
    
    const plan = explanation.queryPlanner.winningPlan;
    const inputStage = plan.inputStage || plan; // Sometimes the winning plan has an inputStage (e.g. FETCH -> IXSCAN)
    const indexName = inputStage.indexName || inputStage.stage;
    
    console.log(`Stage Vencedor: ${plan.stage}`);
    console.log(`Índice Utilizado: ${indexName}`);
    
    if (stats.totalDocsExamined > stats.nReturned * 10 && stats.nReturned > 0) {
      console.warn("⚠️  ALERTA: Muitos documentos examinados para poucos retornados. Considere criar um índice.");
    }
    
    if (stats.totalKeysExamined === 0 && stats.nReturned > 0) {
       console.warn("⚠️  ALERTA: Nenhum índice utilizado (COLLSCAN). Isso pode ser lento em grandes volumes.");
    }

  } catch (error) {
    console.error(`Erro ao analisar query '${label}':`, error);
  }
}

async function listIndexes(model: any, modelName: string) {
    console.log(`\n--- Índices em ${modelName} ---`);
    const indexes = await model.collection.indexes();
    indexes.forEach((idx: any) => {
        console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
}

async function main() {
  await connectDB();

  console.log("\n=== Análise de Performance de Consultas e Índices ===");

  // 1. Listar índices atuais
  await listIndexes(Vacancy, "Vacancy");
  await listIndexes(Company, "Company");
  await listIndexes(Application, "Application");

  // 2. Analisar Consultas Comuns

  // Cenário A: Listagem de Vagas Recentes (Home Page)
  // Query: Buscar vagas publicadas, ordenadas por data descrescente, limit 20
  await analyzeQuery(
    "Listagem de Vagas (Home)",
    Vacancy.find({ status: "published" }).sort({ createdAt: -1 }).limit(20)
  );

  // Cenário B: Busca por Título (Search)
  // Query: Buscar vagas usando índice de texto (mais performático que regex)
  // Nota: O índice de texto foi criado no script optimize-db.ts
  await analyzeQuery(
    "Busca por Título ('React' - Text Search)",
    Vacancy.find({ $text: { $search: "React" }, status: "published" })
  );

  // Cenário C: Filtro por Localização e Nível
  // Query: Vagas em "São Paulo" nível "senior"
  await analyzeQuery(
    "Filtro por Local e Nível",
    Vacancy.find({ location: /São Paulo/i, level: "senior", status: "published" })
  );

  // Cenário D: Aplicações por Candidato
  // Query: Buscar aplicações de um usuário específico (simulado)
  // Pegamos um usuário aleatório se existir, senão usamos um ID fictício
  const user = await User.findOne();
  const userId = user ? user._id : new mongoose.Types.ObjectId();
  
  await analyzeQuery(
    "Aplicações do Usuário",
    Application.find({ candidateId: userId }).sort({ appliedAt: -1 })
  );

  console.log("\n=== Fim da Análise ===");
  await mongoose.disconnect();
}

main();
