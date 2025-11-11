import connectDB from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/User";
import Company from "@/models/Company";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
  companyId?: string;
  isRecruiter?: boolean;
}

/**
 * Verifica se o usuário está autenticado
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error("Usuário não autenticado");
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .select("_id email name role companyId isRecruiter")
    .lean();

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId?.toString(),
    isRecruiter: user.isRecruiter,
  };
}

/**
 * Verifica se o usuário é admin do sistema
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Acesso negado. Apenas administradores podem acessar esta rota.");
  }

  return user;
}

/**
 * Verifica se o usuário é admin ou recrutador de uma empresa
 */
export async function requireCompanyAdmin(
  companyId: string
): Promise<AuthUser> {
  const user = await requireAuth();

  // Se é admin do sistema, pode acessar qualquer empresa
  if (user.role === "admin") {
    return user;
  }

  await connectDB();

  const company = await Company.findById(companyId)
    .select("admins recruiters")
    .lean();

  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  const isAdmin = company.admins?.some(
    (admin: any) => admin.toString() === user.id
  );
  const isRecruiter = company.recruiters?.some(
    (recruiter: any) => recruiter.toString() === user.id
  );

  if (!isAdmin && !isRecruiter) {
    throw new Error(
      "Acesso negado. Você precisa ser admin ou recrutador desta empresa."
    );
  }

  return user;
}

/**
 * Verifica se o usuário tem acesso a uma empresa (admin, recrutador ou dono)
 */
export async function requireCompanyAccess(
  companyId: string
): Promise<AuthUser> {
  const user = await requireAuth();

  // Se é admin do sistema, pode acessar qualquer empresa
  if (user.role === "admin") {
    return user;
  }

  // Se a empresa pertence ao usuário
  if (user.companyId === companyId) {
    return user;
  }

  await connectDB();

  const company = await Company.findById(companyId)
    .select("admins recruiters")
    .lean();

  if (!company) {
    throw new Error("Empresa não encontrada");
  }

  const isAdmin = company.admins?.some(
    (admin: any) => admin.toString() === user.id
  );
  const isRecruiter = company.recruiters?.some(
    (recruiter: any) => recruiter.toString() === user.id
  );

  if (!isAdmin && !isRecruiter) {
    throw new Error(
      "Acesso negado. Você precisa ter acesso a esta empresa."
    );
  }

  return user;
}

