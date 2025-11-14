import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Profile from "@/models/Profile";
import Company from "@/models/Company";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const user = await User.findById(id)
      .select("-password")
      .populate("profile")
      .populate("companyId", "name admins recruiters")
      .lean() as any;

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Determinar papel na empresa
    const userObj: any = { ...user };
    // Verificar se user tem companyId populado
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

    return NextResponse.json({ user: userObj });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Acesso negado. Apenas administradores podem editar usuários." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = id;
    const body = await request.json();

    // Verificar se o usuário existe
    // Não usar select("-password") para poder modificar a senha
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar campos permitidos
    const allowedFields = [
      "name",
      "email",
      "role",
      "isRecruiter",
      "status",
      "isActive",
      "onboardingCompleted",
      "dashboardAccess",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (user as any)[field] = body[field];
      }
    });

    // Atualizar username se fornecido
    if (body.config?.username !== undefined) {
      const username = body.config.username?.trim().toLowerCase() || null;
      
      // Validar formato do username
      if (username && !/^[a-z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: "Username deve conter apenas letras, números, underscores e hífens, sem espaços" },
          { status: 400 }
        );
      }
      
      // Verificar unicidade se username não for vazio
      if (username) {
        const existingUser = await User.findOne({ 
          "config.username": username,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return NextResponse.json(
            { error: "Username já está em uso" },
            { status: 400 }
          );
        }
      }
      
      // Atualizar config.username
      if (!user.config) {
        user.config = {};
      }
      (user.config as any).username = username;
    }

    // Se houver senha, atualizar
    // Fazer hash manualmente e usar updateOne para evitar o pre-save hook
    let passwordChanged = false;
    if (body.password && body.password.trim()) {
      // Hash da senha com o mesmo salt rounds usado no pre-save hook (12)
      const hashedPassword = await bcrypt.hash(body.password.trim(), 12);
      passwordChanged = true;
      
      // Atualizar a senha diretamente no banco usando updateOne para evitar o pre-save hook
      // Isso bypassa completamente o pre-save hook e garante que a senha seja salva corretamente
      const updateResult = await User.updateOne(
        { _id: userId },
        { $set: { password: hashedPassword } }
      );
      
      // Verificar se a atualização foi bem-sucedida
      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }
    }

    // Não permitir alterar companyId via este endpoint - deve ser feito no painel de empresas
    if (body.companyId !== undefined) {
      return NextResponse.json(
        { error: "A empresa não pode ser alterada aqui. Use o painel de empresas para atribuir ou remover empresas." },
        { status: 400 }
      );
    }

    // Atualizar apenas o cargo na empresa se fornecido
    if (body.companyRole !== undefined && user.companyId) {
      const company = await Company.findById(user.companyId);
      if (!company) {
        return NextResponse.json(
          { error: "Empresa não encontrada" },
          { status: 404 }
        );
      }
      
      const userIdObj = new mongoose.Types.ObjectId(userId);
      
      if (body.companyRole === "admin") {
        // Adicionar aos admins se não estiver
        if (!company.admins.some((id: any) => id.toString() === userId)) {
          company.admins.push(userIdObj);
        }
        // Remover dos recruiters
        company.recruiters = company.recruiters.filter((id: any) => id.toString() !== userId);
      } else if (body.companyRole === "recruiter") {
        // Adicionar aos recruiters se não estiver
        if (!company.recruiters.some((id: any) => id.toString() === userId)) {
          company.recruiters.push(userIdObj);
        }
        // Remover dos admins (mas verificar se não é o último admin)
        if (company.admins.length === 1 && company.admins[0].toString() === userId) {
          return NextResponse.json(
            { error: "Não é possível remover o último administrador. Atribua outro administrador primeiro." },
            { status: 400 }
          );
        }
        company.admins = company.admins.filter((id: any) => id.toString() !== userId);
      }
      
      await company.save();
    }

    // Se a senha foi alterada, precisamos atualizar outros campos usando updateOne
    // para evitar que o pre-save hook interfira
    if (passwordChanged) {
      // Atualizar outros campos do usuário usando updateOne (bypassa o pre-save hook)
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.isRecruiter !== undefined) updateData.isRecruiter = body.isRecruiter;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.onboardingCompleted !== undefined) updateData.onboardingCompleted = body.onboardingCompleted;
      if (body.dashboardAccess !== undefined) updateData.dashboardAccess = body.dashboardAccess;
      if (body.config?.username !== undefined) {
        updateData["config.username"] = body.config.username?.trim().toLowerCase() || null;
      }
      
      if (Object.keys(updateData).length > 0) {
        await User.updateOne({ _id: userId }, { $set: updateData });
      }
    } else {
      // Se a senha não foi alterada, podemos usar save() normalmente
      await user.save();
    }

    // Atualizar Profile se campos foram fornecidos
    if (body.profile) {
      let profile = await Profile.findOne({ userId: userId });
      
      // Preparar dados do profile
      const firstName = body.profile.firstName?.trim() || user.name.split(' ')[0] || 'Usuário';
      const lastName = body.profile.lastName?.trim() || user.name.split(' ').slice(1).join(' ') || '';
      
      if (!profile) {
        // Criar profile se não existir
        profile = new Profile({
          userId: userId,
          firstName: firstName,
          lastName: lastName || 'Sem sobrenome',
          slug: user.email.split('@')[0],
        });
      } else {
        // Atualizar firstName e lastName se fornecidos
        if (body.profile.firstName !== undefined) {
          profile.firstName = firstName;
        }
        if (body.profile.lastName !== undefined) {
          profile.lastName = lastName || 'Sem sobrenome';
        }
      }
      
      // Atualizar outros campos do profile
      const profileFields = [
        "headline",
        "location",
        "bio",
        "sector",
      ];
      
      profileFields.forEach((field) => {
        if (body.profile[field] !== undefined) {
          (profile as any)[field] = body.profile[field] || '';
        }
      });
      
      await profile.save();
      
      // Atualizar referência do profile no user se necessário
      if (!user.profile) {
        user.profile = profile._id;
        await user.save();
      }
    }

    // Buscar usuário atualizado sem senha com profile
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("profile")
      .lean();

    return NextResponse.json({
      user: updatedUser,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    
    // Retornar mensagem de erro mais específica
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    // Se for erro de validação do Mongoose
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json(
        { 
          error: "Erro de validação",
          details: validationErrors 
        },
        { status: 400 }
      );
    }
    
    // Se for erro de duplicação (username único)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Username já está em uso" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Acesso negado. Apenas administradores podem deletar usuários." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = id;

    // Não permitir deletar a si mesmo
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Você não pode deletar seu próprio usuário" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}

