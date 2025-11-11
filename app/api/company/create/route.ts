import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const { name, cnpj, industry, description, size, location } =
      await request.json();

    // Validar dados obrigatórios
    if (!name || !cnpj || !industry || !description || !size || !location) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se usuário já tem empresa
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (user.companyId) {
      return NextResponse.json(
        { error: "Você já está vinculado a uma empresa" },
        { status: 400 }
      );
    }

    // Verificar se CNPJ já existe
    const existingCompany = await Company.findOne({ cnpj });
    if (existingCompany) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado" },
        { status: 400 }
      );
    }

    // Validar tamanho da empresa
    const validSizes = ["startup", "small", "medium", "large", "enterprise"];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: "Tamanho de empresa inválido" },
        { status: 400 }
      );
    }

    // Gerar email único baseado no CNPJ (sem caracteres especiais)
    const cleanCnpj = cnpj.replace(/\D/g, ""); // Remove caracteres não numéricos
    let email = `empresa-${cleanCnpj}@jobboard.local`;
    let emailCounter = 1;
    
    // Garantir que o email seja único
    while (await Company.findOne({ email })) {
      email = `empresa-${cleanCnpj}-${emailCounter}@jobboard.local`;
      emailCounter++;
    }

    // Gerar senha inicial (pode ser o CNPJ limpo ou uma senha padrão)
    // Por segurança, vamos usar o CNPJ limpo como senha inicial (o hash será feito automaticamente)
    const initialPassword = cleanCnpj;

    // Criar empresa
    const company = new Company({
      name,
      cnpj,
      email,
      password: initialPassword, // Será hasheado automaticamente pelo pre-save hook
      industry,
      description,
      size,
      location,
      admins: [userId],
      recruiters: [userId],
      followersCount: 0,
      jobsCount: 0,
      isVerified: false,
      benefits: [],
      isActive: true,
    });

    await company.save();

    // Atualizar usuário
    user.companyId = company._id;
    user.role = "admin";
    user.isRecruiter = true;
    await user.save();

    return NextResponse.json(
      {
        message: "Empresa criada com sucesso",
        companyId: company._id,
        company: {
          id: company._id,
          name: company.name,
          cnpj: company.cnpj,
          industry: company.industry,
        },
        credentials: {
          email: email,
          password: initialPassword, // Retornar senha em texto claro apenas na criação
          message: "Guarde estas credenciais com segurança. A senha deve ser alterada no primeiro login.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar empresa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
