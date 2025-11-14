import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

    // Verificar se o usuário é admin usando o role da sessão
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
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
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role isRecruiter companyId createdAt isActive config dashboardAccess")
        .populate("companyId", "name admins recruiters")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Determinar papel na empresa para cada usuário
    const usersWithCompanyRole = users.map((user: any) => {
      const userObj: any = { ...user };
      if (user.companyId && typeof user.companyId === 'object') {
        const company = user.companyId as any;
        userObj.company = {
          _id: company._id,
          name: company.name,
        };
        
        // Verificar se está em admins
        const isAdmin = company.admins?.some((adminId: any) => 
          adminId.toString() === user._id.toString()
        );
        
        // Verificar se está em recruiters
        const isRecruiter = company.recruiters?.some((recruiterId: any) => 
          recruiterId.toString() === user._id.toString()
        );
        
        if (isAdmin) {
          userObj.companyRole = "admin";
        } else if (isRecruiter) {
          userObj.companyRole = "recruiter";
        } else {
          userObj.companyRole = null;
        }
      } else {
        userObj.company = null;
        userObj.companyRole = null;
      }
      
      return userObj;
    });

    return NextResponse.json({
      users: usersWithCompanyRole,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
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

    // Verificar se o usuário é admin usando o role da sessão
    const userRole = (session.user as any)?.role || session.user?.role;
    if (!userRole || userRole !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar usuários." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, isRecruiter, status, isActive } = body;

    // Validar campos obrigatórios
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, email e senha" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
      isRecruiter: isRecruiter || false,
      status: status || "active",
      isActive: isActive !== undefined ? isActive : true,
      onboardingCompleted: false,
    });

    await newUser.save();

    // Buscar usuário criado sem senha
    const createdUser = await User.findById(newUser._id)
      .select("-password")
      .lean();

    return NextResponse.json(
      {
        user: createdUser,
        message: "Usuário criado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}


