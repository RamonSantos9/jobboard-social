import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import Invite from "@/models/Invite";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    await connectDB();

    // Buscar empresa com dados relacionados
    const company = await Company.findById(params.id)
      .populate("admins", "name email")
      .populate("recruiters", "name email");

    if (!company) {
      return NextResponse.json(
        { error: "Empresa não encontrada" },
        { status: 404 }
      );
    }

    // Se usuário está logado, verificar se é admin para mostrar convites
    let invites = [];
    if (session?.user) {
      const isAdmin = company.admins.some(
        (admin: any) => admin._id.toString() === session.user.id
      );

      if (isAdmin) {
        // Buscar convites pendentes da empresa
        invites = await Invite.find({
          companyId: company._id,
          used: false,
        }).sort({ createdAt: -1 });
      }
    }

    return NextResponse.json({
      company: {
        _id: company._id,
        name: company.name,
        cnpj: company.cnpj,
        industry: company.industry,
        description: company.description,
        size: company.size,
        location: company.location,
        logoUrl: company.logoUrl,
        bannerUrl: company.bannerUrl,
        followersCount: company.followersCount,
        jobsCount: company.jobsCount,
        isVerified: company.isVerified,
        admins: company.admins,
        recruiters: company.recruiters,
        createdAt: company.createdAt,
      },
      invites,
    });
  } catch (error) {
    console.error("Erro ao buscar empresa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
