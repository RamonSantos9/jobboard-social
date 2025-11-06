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

async function fixMongoFlex() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI não encontrada!");
    console.log("Certifique-se de que o arquivo .env.local existe e contém:");
    console.log("MONGODB_URI=sua-string-de-conexao");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Conectado ao MongoDB Atlas Flex");

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

    console.log(
      "🔍 Testando inserção em coleções (Flex cria automaticamente)..."
    );

    let successCount = 0;
    let errorCount = 0;

    // Testar inserção em cada coleção
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);

        // Inserir documento de teste
        const testDoc = {
          _test: true,
          createdAt: new Date(),
          type: "initialization_test",
        };

        const result = await collection.insertOne(testDoc);
        console.log(
          `✅ ${collectionName}: Documento inserido (ID: ${result.insertedId})`
        );
        successCount++;

        // Limpar documento de teste
        await collection.deleteOne({ _test: true });
      } catch (error) {
        console.log(`❌ ${collectionName}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(
      `\n📊 Resultado: ${successCount} sucessos, ${errorCount} erros`
    );

    if (errorCount > 0) {
      console.log("\n🔧 SOLUÇÕES PARA MONGODB ATLAS FLEX:");
      console.log("1. Verifique se está usando a string de conexão correta");
      console.log("2. No Atlas, vá em 'Database Access'");
      console.log(
        "3. Certifique-se de que o usuário tem permissão 'Atlas admin'"
      );
      console.log("4. OU adicione permissão 'readWriteAnyDatabase'");
      console.log("5. Aguarde 2-3 minutos para propagação");

      console.log("\n🎯 ALTERNATIVA - Usar MongoDB Compass:");
      console.log("1. Baixe MongoDB Compass");
      console.log("2. Conecte com sua string");
      console.log(
        "3. As coleções serão criadas automaticamente quando você inserir dados"
      );
      console.log("4. Execute 'npm run dev' e teste o cadastro");
    } else {
      console.log("\n🎉 PERFEITO! Todas as coleções estão funcionando!");
      console.log("Execute 'npm run dev' para testar a aplicação.");
    }
  } catch (error) {
    console.error("❌ Erro ao conectar:", error.message);

    console.log("\n🔧 POSSÍVEIS SOLUÇÕES:");
    console.log("1. Verifique se a string de conexão está correta");
    console.log("2. Certifique-se de que o IP está liberado no Network Access");
    console.log("3. Verifique se o usuário tem permissões adequadas");

    process.exit(1);
  } finally {
    await client.close();
  }
}

fixMongoFlex();
