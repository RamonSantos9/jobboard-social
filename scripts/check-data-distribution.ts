import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Vacancy from "../models/Vacancy";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Erro: MONGODB_URI não definida no .env.local");
  process.exit(1);
}

async function checkDistribution() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Conectado ao MongoDB.");

    const total = await Vacancy.countDocuments();
    console.log(`Total de Vagas: ${total}`);

    const published = await Vacancy.countDocuments({ status: "published" });
    console.log(`Vagas Publicadas: ${published}`);

    const senior = await Vacancy.countDocuments({ level: "senior" });
    console.log(`Vagas Senior: ${senior}`);

    const publishedSenior = await Vacancy.countDocuments({ status: "published", level: "senior" });
    console.log(`Vagas Publicadas e Senior: ${publishedSenior}`);

    const sp = await Vacancy.countDocuments({ location: /São Paulo/i });
    console.log(`Vagas em SP (Regex): ${sp}`);
    
    const publishedSeniorSP = await Vacancy.countDocuments({ status: "published", level: "senior", location: /São Paulo/i });
    console.log(`Vagas Publicadas, Senior e em SP: ${publishedSeniorSP}`);

  } catch (error) {
    console.error("Erro detalhado:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDistribution();
