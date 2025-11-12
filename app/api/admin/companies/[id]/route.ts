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
      .select("name cnpj industry description size location website foundedYear isVerified benefits culture socialLinks admins recruiters _id createdAt")
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

    // Construir objeto de atualização apenas com campos que foram fornecidos
    const updateData: any = {};
    
    // Atualizar campos simples apenas se foram fornecidos
    if (body.name !== undefined) updateData.name = body.name;
    if (body.cnpj !== undefined) updateData.cnpj = body.cnpj;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.size !== undefined) updateData.size = body.size;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.website !== undefined) updateData.website = body.website || null;
    if (body.foundedYear !== undefined) updateData.foundedYear = body.foundedYear || null;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
    if (body.benefits !== undefined) updateData.benefits = Array.isArray(body.benefits) ? body.benefits : [];
    if (body.culture !== undefined) updateData.culture = body.culture || null;

    // Atualizar socialLinks (mesclar com existente)
    if (body.socialLinks !== undefined) {
      const existingSocialLinks = company.socialLinks || {};
      const newSocialLinks: any = {};
      
      // Mesclar apenas campos definidos (não undefined)
      if (body.socialLinks.linkedin !== undefined) {
        newSocialLinks.linkedin = body.socialLinks.linkedin || null;
      } else if (existingSocialLinks.linkedin !== undefined) {
        newSocialLinks.linkedin = existingSocialLinks.linkedin;
      }
      
      if (body.socialLinks.twitter !== undefined) {
        newSocialLinks.twitter = body.socialLinks.twitter || null;
      } else if (existingSocialLinks.twitter !== undefined) {
        newSocialLinks.twitter = existingSocialLinks.twitter;
      }
      
      if (body.socialLinks.facebook !== undefined) {
        newSocialLinks.facebook = body.socialLinks.facebook || null;
      } else if (existingSocialLinks.facebook !== undefined) {
        newSocialLinks.facebook = existingSocialLinks.facebook;
      }
      
      if (body.socialLinks.instagram !== undefined) {
        newSocialLinks.instagram = body.socialLinks.instagram || null;
      } else if (existingSocialLinks.instagram !== undefined) {
        newSocialLinks.instagram = existingSocialLinks.instagram;
      }
      
      updateData.socialLinks = newSocialLinks;
    }

    // Validar campos obrigatórios que estão sendo atualizados
    if (updateData.name !== undefined && !updateData.name?.trim()) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }
    if (updateData.description !== undefined && !updateData.description?.trim()) {
      return NextResponse.json(
        { error: "Descrição é obrigatória" },
        { status: 400 }
      );
    }
    if (updateData.description !== undefined && updateData.description.length > 1000) {
      return NextResponse.json(
        { error: "Descrição deve ter no máximo 1000 caracteres" },
        { status: 400 }
      );
    }
    if (updateData.location !== undefined && !updateData.location?.trim()) {
      return NextResponse.json(
        { error: "Localização é obrigatória" },
        { status: 400 }
      );
    }
    if (updateData.industry !== undefined && !updateData.industry?.trim()) {
      return NextResponse.json(
        { error: "Indústria é obrigatória" },
        { status: 400 }
      );
    }

    // Verificar se o CNPJ está sendo alterado e se já existe
    if (updateData.cnpj && updateData.cnpj !== company.cnpj) {
      const existingCompany = await Company.findOne({ cnpj: updateData.cnpj });
      if (existingCompany && existingCompany._id.toString() !== companyId) {
        return NextResponse.json(
          { error: "CNPJ já está em uso por outra empresa" },
          { status: 400 }
        );
      }
    }

    try {
      const updatedCompany = await Company.findByIdAndUpdate(
        companyId,
        { $set: updateData },
        { 
          new: true, 
          runValidators: false // Não validar campos obrigatórios não modificados
        }
      )
        .populate("admins", "name email")
        .populate("recruiters", "name email")
        .lean();

      if (!updatedCompany) {
        return NextResponse.json(
          { error: "Empresa não encontrada após atualização" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        company: updatedCompany,
        message: "Empresa atualizada com sucesso",
      });
    } catch (updateError: any) {
      console.error("Update error:", updateError);
      
      // Se for um erro de validação do Mongoose, retornar detalhes
      if (updateError.name === "ValidationError") {
        const errorMessages = updateError.errors 
          ? Object.values(updateError.errors).map((err: any) => err.message)
          : [updateError.message];
        return NextResponse.json(
          { 
            error: "Erro de validação",
            details: errorMessages 
          },
          { status: 400 }
        );
      }
      
      // Se for um erro de duplicação (CNPJ único)
      if (updateError.code === 11000) {
        return NextResponse.json(
          { error: "CNPJ já está em uso por outra empresa" },
          { status: 400 }
        );
      }
      
      throw updateError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error: any) {
    console.error("Update company error:", error);
    
    // Se for um erro de validação do Mongoose, retornar detalhes
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
    
    // Se for um erro de duplicação (CNPJ único)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "CNPJ já está em uso por outra empresa" },
        { status: 400 }
      );
    }
    
    // Erro genérico
    return NextResponse.json(
      { 
        error: "Erro ao atualizar empresa",
        message: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

