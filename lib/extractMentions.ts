import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";
import Profile from "@/models/Profile";

/**
 * Extrai menções do formato @nome do conteúdo e retorna os IDs dos usuários/empresas encontrados
 */
export async function extractMentions(content: string): Promise<mongoose.Types.ObjectId[]> {
  if (!content) return [];

  // Garantir conexão com o banco
  await connectDB();

  // Regex para encontrar @nome (permite letras, números, underscore, hífen)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const matches = Array.from(content.matchAll(mentionRegex));
  const mentionedNames = Array.from(new Set(matches.map((match) => match[1].toLowerCase()))); // Remover duplicatas

  if (mentionedNames.length === 0) return [];

  const userIds: mongoose.Types.ObjectId[] = [];

  // Buscar por nomes de usuários (através do Profile)
  for (const name of mentionedNames) {
    try {
      // Buscar perfis que correspondem ao nome (busca exata ou parcial no nome completo)
      const profiles = (await Profile.find({
        $or: [
          { firstName: { $regex: new RegExp(`^${name}`, "i") } },
          { lastName: { $regex: new RegExp(`^${name}`, "i") } },
        ],
      })
        .select("userId")
        .limit(5) // Limitar resultados para performance
        .lean()) as unknown as Array<{ userId: mongoose.Types.ObjectId }>;

      for (const profile of profiles) {
        if (profile.userId && !userIds.some((id) => id.toString() === profile.userId.toString())) {
          userIds.push(new mongoose.Types.ObjectId(profile.userId));
        }
      }

      // Buscar empresas pelo nome e notificar admins
      const companies = (await Company.find({
        name: { $regex: new RegExp(`^${name}`, "i") },
      })
        .select("admins")
        .limit(5) // Limitar resultados
        .lean()) as unknown as Array<{ admins?: mongoose.Types.ObjectId[] }>;

      for (const company of companies) {
        if (company.admins && company.admins.length > 0) {
          // Notificar o primeiro admin da empresa
          const adminId = company.admins[0];
          if (adminId && !userIds.some((id) => id.toString() === adminId.toString())) {
            userIds.push(new mongoose.Types.ObjectId(adminId));
          }
        }
      }

      // Buscar usuários pelo nome direto (fallback)
      const users = (await User.find({
        name: { $regex: new RegExp(`^${name}`, "i") },
      })
        .select("_id")
        .limit(5) // Limitar resultados
        .lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId }>;

      for (const user of users) {
        if (!userIds.some((id) => id.toString() === user._id.toString())) {
          userIds.push(new mongoose.Types.ObjectId(user._id));
        }
      }
    } catch (error) {
      console.error(`Erro ao buscar menção "${name}":`, error);
      // Continuar com as próximas menções mesmo se houver erro
    }
  }

  return userIds;
}

/**
 * Obtém o nome completo de um usuário ou empresa para usar em notificações
 */
export async function getUserDisplayName(userId: mongoose.Types.ObjectId): Promise<string> {
  try {
    await connectDB();

    // Buscar perfil primeiro
    const profile = (await Profile.findOne({ userId })
      .select("firstName lastName")
      .lean()) as unknown as { firstName?: string; lastName?: string } | null;
    if (profile && profile.firstName) {
      return `${profile.firstName} ${profile.lastName || ""}`.trim();
    }

    // Tentar buscar como empresa (verificar se é admin de alguma empresa)
    const company = (await Company.findOne({ admins: userId }).select("name").lean()) as unknown as { name?: string } | null;
    if (company?.name) return company.name;

    // Fallback para nome do usuário
    const user = (await User.findById(userId).select("name").lean()) as unknown as { name?: string } | null;
    return user?.name || "Usuário";
  } catch (error) {
    console.error("Erro ao buscar nome do usuário:", error);
    return "Usuário";
  }
}

