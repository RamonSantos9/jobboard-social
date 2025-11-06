const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Carregar variáveis de ambiente do .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const envFile = fs.readFileSync(envPath, "utf8");
    const envVars = {};

    envFile.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").trim();
        envVars[key.trim()] = value;
      }
    });

    return envVars;
  } catch (error) {
    console.log(
      "Arquivo .env.local não encontrado, usando variáveis do sistema"
    );
    return {};
  }
}

// Carregar variáveis de ambiente
const envVars = loadEnvFile();
Object.assign(process.env, envVars);

async function fixMongoPermissions() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI não encontrada!");
    console.log("Certifique-se de que o arquivo .env.local existe e contém:");
    console.log("MONGODB_URI=sua-string-de-conexao");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Conectado ao MongoDB");

    const db = client.db("test");

    // Lista de coleções necessárias
    const collections = [
      "users",
      "profiles",
      "posts",
      "notifications",
      "companies",
      "candidates",
      "recruiters",
      "applications",
      "connections",
      "jobs",
    ];

    console.log("Criando coleções...");

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Coleção ${collectionName} criada com sucesso`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Coleção ${collectionName} já existe`);
        } else {
          console.error(
            `❌ Erro ao criar coleção ${collectionName}:`,
            error.message
          );
        }
      }
    }

    // Criar índices para melhor performance
    console.log("Criando índices...");

    try {
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      console.log("✅ Índice único criado para email em users");
    } catch (error) {
      console.log("ℹ️  Índice para email já existe ou erro:", error.message);
    }

    try {
      await db
        .collection("companies")
        .createIndex({ cnpj: 1 }, { unique: true });
      console.log("✅ Índice único criado para CNPJ em companies");
    } catch (error) {
      console.log("ℹ️  Índice para CNPJ já existe ou erro:", error.message);
    }

    try {
      await db
        .collection("profiles")
        .createIndex({ userId: 1 }, { unique: true });
      console.log("✅ Índice único criado para userId em profiles");
    } catch (error) {
      console.log("ℹ️  Índice para userId já existe ou erro:", error.message);
    }

    console.log("🎉 Configuração do MongoDB concluída com sucesso!");
    console.log('Agora você pode executar "npm run dev" novamente.');
  } catch (error) {
    console.error("❌ Erro ao configurar MongoDB:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixMongoPermissions();
