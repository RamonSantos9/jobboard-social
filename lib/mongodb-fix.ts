// Arquivo para resolver problemas de permissão do MongoDB Atlas
// Este arquivo deve ser executado uma vez para configurar as permissões

import { MongoClient } from "mongodb";

export async function fixMongoPermissions() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log("Conectado ao MongoDB");

    const db = client.db("test");

    // Criar coleções se não existirem
    const collections = [
      "users",
      "profiles",
      "posts",
      "notifications",
      "companies",
      "candidates",
      "recruiters",
    ];

    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`Coleção ${collectionName} criada com sucesso`);
      } catch (error: any) {
        if (error.code === 48) {
          console.log(`Coleção ${collectionName} já existe`);
        } else {
          console.error(`Erro ao criar coleção ${collectionName}:`, error);
        }
      }
    }

    console.log("Configuração do MongoDB concluída");
  } catch (error) {
    console.error("Erro ao configurar MongoDB:", error);
  } finally {
    await client.close();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  fixMongoPermissions();
}
