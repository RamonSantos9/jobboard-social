import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem acessar." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Construir query de busca
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { cnpj: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
      ];
    }

    const [companies, total] = await Promise.all([
      Company.find(query)
        .select("name cnpj industry isVerified jobsCount followersCount createdAt admins recruiters")
        .populate("admins", "name email")
        .populate("recruiters", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Company.countDocuments(query),
    ]);

    return NextResponse.json({
      companies,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin companies fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    // Verificar se o usuário é admin
    const user = await User.findById(session.user.id).select("role").lean() as { role?: string } | null;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar empresas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      cnpj,
      industry,
      description,
      size,
      location,
      website,
      foundedYear,
      isVerified,
      benefits,
      culture,
      socialLinks,
    } = body;

    // Validar campos obrigatórios
    if (!name || !cnpj || !industry || !description || !size || !location) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, CNPJ, indústria, descrição, tamanho e localização" },
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
      website: website || undefined,
      foundedYear: foundedYear || undefined,
      isVerified: isVerified || false,
      benefits: benefits || [],
      culture: culture || undefined,
      socialLinks: socialLinks || {},
      admins: [session.user.id],
      recruiters: [session.user.id],
      followersCount: 0,
      jobsCount: 0,
      isActive: true,
    });

    await company.save();

    // Buscar empresa criada com dados populados
    const createdCompany = await Company.findById(company._id)
      .populate("admins", "name email")
      .populate("recruiters", "name email")
      .lean();

    return NextResponse.json(
      {
        company: createdCompany,
        credentials: {
          email: email,
          password: initialPassword, // Retornar senha em texto claro apenas na criação
          message: "Guarde estas credenciais com segurança. A senha deve ser alterada no primeiro login.",
        },
        message: "Empresa criada com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create company error:", error);
    return NextResponse.json(
      { error: "Erro ao criar empresa" },
      { status: 500 }
    );
  }
}

