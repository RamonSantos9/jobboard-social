const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI não definida");
  process.exit(1);
}

async function checkData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado ao MongoDB");

    // Verificar Jobs
    const jobsCount = await mongoose.connection.db
      .collection("jobs")
      .countDocuments();
    console.log(`Total de Vagas: ${jobsCount}`);

    if (jobsCount > 0) {
      const sampleJob = await mongoose.connection.db
        .collection("jobs")
        .findOne({});
      console.log("Exemplo de Vaga:", JSON.stringify(sampleJob, null, 2));
    }

    // Verificar Users (Profiles)
    const profilesCount = await mongoose.connection.db
      .collection("profiles")
      .countDocuments();
    console.log(`Total de Perfis: ${profilesCount}`);

    // Verificar Posts
    const postsCount = await mongoose.connection.db
      .collection("posts")
      .countDocuments();
    console.log(`Total de Posts: ${postsCount}`);
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
