import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import User from "@/models/User";
import Company from "@/models/Company";

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

    const { id } = await params;
    const company = await Company.findById(id)
      .populate("admins", "name email")
      .populate("recruiters", "name email")
      .lean();

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Get company error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar empresa" },
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

    const { id } = await params;
    const companyId = id;
    console.log("Updating company with ID:", companyId, "Type:", typeof companyId);
    const body = await request.json();
    console.log("Update data received:", Object.keys(body));

    // Verificar se o ID é válido (não vazio)
    if (!companyId) {
      console.error("Empty company ID");
      return NextResponse.json(
        { error: "ID da empresa não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se a empresa existe
    let company;
    try {
      company = await Company.findById(companyId);
      console.log("Company found:", company ? `Yes (${company.name})` : "No");
    } catch (error: any) {
      console.error("Error finding company:", error);
      return NextResponse.json(
        { error: "ID da empresa inválido", details: error.message },
        { status: 400 }
      );
    }

    if (!company) {
      // Tentar buscar todas as empresas para debug
      const allCompanies = (await Company.find().limit(5).select("_id name").lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; name: string }>;
      console.log("Sample company IDs in DB:", allCompanies.map(c => ({ id: c._id.toString(), name: c.name })));
      console.log("Looking for ID:", companyId);
      return NextResponse.json(
        { error: "Empresa não encontrada", receivedId: companyId },
        { status: 404 }
      );
    }

    // Verificar permissões
    const currentUser = await User.findById(session.user.id)
      .select("role")
      .lean() as { role?: string } | null;
    const isSystemAdmin = currentUser?.role === "admin";

    // Verificar se é admin da empresa
    const isCompanyAdmin = company.admins.some(
      (adminId: mongoose.Types.ObjectId) => adminId.toString() === session.user.id
    );

    if (!isSystemAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Você não tem permissão para editar esta empresa." },
        { status: 403 }
      );
    }

    // Atualizar campos permitidos
    const allowedFields = [
      "name",
      "cnpj",
      "industry",
      "description",
      "size",
      "location",
      "website",
      "foundedYear",
      "isVerified",
      "benefits",
      "culture",
      "socialLinks",
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (company as any)[field] = body[field];
      }
    });

    await company.save();

    // Buscar empresa atualizada com dados populados
    const updatedCompany = await Company.findById(companyId)
      .populate("admins", "name email")
      .populate("recruiters", "name email")
      .lean();

    return NextResponse.json({
      company: updatedCompany,
      message: "Empresa atualizada com sucesso",
    });
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa" },
      { status: 500 }
    );
  }
}

