import { Model } from "mongoose";
import { IProfile } from "@/models/Profile";

// Função simples para criar slug sem dependências externas
function createSlug(text: string): string {
  if (!text || typeof text !== "string") {
    return "usuario";
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .replace(/^-|-$/g, ""); // Remove hífens do início e fim
}

export async function generateUniqueSlugForProfile(
  firstName: string,
  lastName: string,
  ProfileModel: Model<IProfile>,
  isCustom: boolean = false
): Promise<string> {
  let baseSlug = createSlug(`${firstName} ${lastName}`);
  if (!isCustom) {
    baseSlug = createSlug(firstName);
  }

  // Garantir que o slug não esteja vazio
  if (!baseSlug) {
    baseSlug = "usuario";
  }

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    try {
      const existingProfile = await ProfileModel.findOne({ slug: uniqueSlug });
      if (!existingProfile) {
        return uniqueSlug;
      }

      // Gerar slug único com timestamp e número aleatório
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      uniqueSlug = `${baseSlug}-${timestamp}-${random}`;

      counter++;

      // Evitar loop infinito
      if (counter > 100) {
        return `${baseSlug}-${Date.now()}`;
      }
    } catch (error) {
      console.error("Error checking slug uniqueness:", error);
      return `${baseSlug}-${Date.now()}`;
    }
  }
}
