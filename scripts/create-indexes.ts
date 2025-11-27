import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Import all models to register indexes
import Vacancy from "../models/Vacancy";
import Application from "../models/Application";
import User from "../models/User";
import Company from "../models/Company";
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

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ Conectado ao MongoDB\n");
  } catch (error) {
    console.error("❌ Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

async function createIndexes() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║         🔧 CRIANDO ÍNDICES NO BANCO DE DADOS 🔧            ║");
  console.log("║                                                            ║");
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

  let totalIndexes = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const { model, name } of models) {
    try {
      console.log(`📦 ${name}...`);
      
      // Create indexes
      await model.createIndexes();
      
      // Get all indexes
      const indexes = await model.collection.indexes();
      const indexCount = indexes.length;
      totalIndexes += indexCount;
      successCount++;
      
      console.log(`   ✅ ${indexCount} índices criados/verificados`);
      
      // Show index names
      indexes.forEach((idx: any) => {
        const keys = Object.keys(idx.key).join(", ");
        console.log(`      • ${idx.name}: { ${keys} }`);
      });
      
      console.log();
    } catch (error) {
      errorCount++;
      console.log(`   ❌ Erro ao criar índices: ${error instanceof Error ? error.message : error}`);
      console.log();
    }
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                    📊 RESUMO                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log(`✅ Coleções processadas: ${successCount}/${models.length}`);
  console.log(`📊 Total de índices: ${totalIndexes}`);
  
  if (errorCount > 0) {
    console.log(`❌ Erros: ${errorCount}`);
  }

  console.log("\n💡 Próximos passos:");
  console.log("   1. Execute o teste de performance novamente:");
  console.log("      npm run test:performance");
  console.log("   2. Compare os resultados com o teste anterior");
  console.log("   3. Você deve ver:");
  console.log("      • Menos queries usando COLLSCAN");
  console.log("      • Queries mais rápidas");
  console.log("      • Melhor eficiência geral\n");
}

async function main() {
  await connectDB();
  await createIndexes();
  
  await mongoose.disconnect();
  console.log("✅ Desconectado do MongoDB\n");
}

main().catch((error) => {
  console.error("\n❌ Erro fatal:", error);
  process.exit(1);
});
