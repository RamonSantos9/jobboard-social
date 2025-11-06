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

    console.log("🔍 Verificando permissões...");

    // Testar inserção em cada coleção (isso cria a coleção automaticamente)
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);

        // Tentar inserir um documento temporário
        const testDoc = {
          _temp: true,
          createdAt: new Date(),
          _id: `temp_${Date.now()}_${Math.random()}`,
        };

        await collection.insertOne(testDoc);
        console.log(`✅ Coleção ${collectionName} criada/acessível`);

        // Remover o documento temporário
        await collection.deleteOne({ _temp: true });
      } catch (error) {
        console.log(`ℹ️  Coleção ${collectionName}: ${error.message}`);
      }
    }

    console.log("\n🔧 Soluções para problemas de permissão:");
    console.log("1. Acesse o MongoDB Atlas");
    console.log("2. Vá em 'Database Access'");
    console.log("3. Edite seu usuário");
    console.log("4. Em 'Database User Privileges', selecione:");
    console.log("   - 'Read and write to any database'");
    console.log("   - OU 'Built-in Role: readWriteAnyDatabase'");
    console.log("5. Salve as alterações");
    console.log("6. Aguarde alguns minutos para propagação");

    console.log("\n🎯 Alternativa: Usar MongoDB Compass");
    console.log("1. Baixe o MongoDB Compass");
    console.log("2. Conecte com sua string de conexão");
    console.log("3. Crie as coleções manualmente:");
    collections.forEach((name) => console.log(`   - ${name}`));

    console.log("\n✅ Verificação concluída!");
    console.log("Execute 'npm run dev' para testar a aplicação.");
  } catch (error) {
    console.error("❌ Erro ao configurar MongoDB:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixMongoPermissions();
