import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Import models
import Vacancy from "../models/Vacancy";
import Application from "../models/Application";

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
    console.log("Conectado ao MongoDB para otimização.");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    process.exit(1);
  }
}

async function createIndexes() {
  await connectDB();

  console.log("\n=== Criando Índices de Performance ===");

  try {
    // 1. Vacancy: Índice de Texto para busca por título/descrição
    console.log("Criando índice de texto em Vacancy (title)...");
    try {
      await Vacancy.collection.createIndex({ title: "text" });
      console.log("✅ Índice de texto criado.");
    } catch (e: any) {
      if (e.code === 85 || e.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Índice de texto já existe.");
      } else {
        throw e;
      }
    }

    // 2. Remover índice simples 'status_1' que é redundante
    try {
      const indexes = await Vacancy.collection.indexes();
      if (indexes.find((i: any) => i.name === "status_1")) {
        console.log("Removendo índice redundante 'status_1'...");
        await Vacancy.collection.dropIndex("status_1");
        console.log("✅ Índice 'status_1' removido.");
      }
    } catch (e) {
      console.log("ℹ️  Índice 'status_1' não existe ou não pôde ser removido.");
    }

    // 3. Vacancy: Índice Composto para Filtros Comuns
    // Para queries com igualdade em status e level
    console.log("Criando índice composto em Vacancy (status, level)...");
    try {
      await Vacancy.collection.createIndex({ status: 1, level: 1 });
      console.log("✅ Índice composto (status, level) criado.");
    } catch (e: any) {
      if (e.code === 85 || e.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Índice composto já existe.");
      } else {
        throw e;
      }
    }

    // 4. Vacancy: Índice de Texto em location para buscas mais eficientes
    // Nota: Só podemos ter um índice de texto por coleção, então vamos criar um composto
    console.log("Criando índice composto de texto (title, location)...");
    try {
      // Primeiro remover o índice de texto simples se existir
      const indexes = await Vacancy.collection.indexes();
      const textIndex = indexes.find((i: any) => i.name === "title_text");
      if (textIndex) {
        await Vacancy.collection.dropIndex("title_text");
      }
      
      // Criar índice de texto composto
      await Vacancy.collection.createIndex(
        { title: "text", location: "text" },
        { name: "title_location_text" }
      );
      console.log("✅ Índice de texto composto criado.");
    } catch (e: any) {
      if (e.code === 85 || e.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Índice de texto composto já existe.");
      } else {
        console.log("⚠️  Mantendo índice de texto simples em title.");
      }
    }

    // 5. Application: Índice para listar aplicações de um candidato
    console.log("Criando índice em Application (candidateId, appliedAt)...");
    try {
      await Application.collection.createIndex({ candidateId: 1, appliedAt: -1 });
      console.log("✅ Índice de candidato criado.");
    } catch (e: any) {
      if (e.code === 85 || e.codeName === "IndexOptionsConflict") {
        console.log("ℹ️  Índice de candidato já existe.");
      } else {
        throw e;
      }
    }

    console.log("\n📊 Listando índices finais:");
    const vacancyIndexes = await Vacancy.collection.indexes();
    console.log("\nVacancy:");
    vacancyIndexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    const applicationIndexes = await Application.collection.indexes();
    console.log("\nApplication:");
    applicationIndexes.forEach((idx: any) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

  } catch (error) {
    console.error("Erro ao criar índices:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n=== Otimização Concluída ===");
  }
}

createIndexes();
