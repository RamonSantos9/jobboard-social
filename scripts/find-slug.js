require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function findProfileSlug() {
  try {
    console.log("Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado ao MongoDB");

    const db = mongoose.connection.db;

    // Buscar o perfil do usuário Ramon Santos
    const profile = await db.collection("profiles").findOne({
      firstName: "Ramon",
      lastName: "Santos",
    });

    if (profile) {
      console.log(`\nPerfil encontrado:`);
      console.log(`- Nome: ${profile.firstName} ${profile.lastName}`);
      console.log(`- Slug: ${profile.slug}`);
      console.log(`- UserId: ${profile.userId}`);

      // Testar a API com o slug correto
      console.log(`\nTestando API com slug: ${profile.slug}`);
    } else {
      console.log("Perfil não encontrado");
    }
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDesconectado do MongoDB");
  }
}

findProfileSlug();
