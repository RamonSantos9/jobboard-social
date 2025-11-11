import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const myCompanies = searchParams.get("myCompanies") === "true";

    const session = await auth();

    // Se for buscar empresas do usuário
    if (myCompanies && session) {
      const companies = await Company.find({
        $or: [
          { admins: session.user.id },
          { recruiters: session.user.id },
        ],
      })
        .select("_id name")
        .limit(50);

      return NextResponse.json({
        companies,
        total: companies.length,
      });
    }

    // Busca normal
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Buscar empresas por nome ou CNPJ
    const companies = await Company.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { cnpj: { $regex: query.replace(/\D/g, ""), $options: "i" } },
      ],
    })
      .select(
        "name industry location size description logoUrl isVerified followersCount jobsCount"
      )
      .limit(10)
      .sort({ followersCount: -1, jobsCount: -1 });

    return NextResponse.json({
      companies,
      total: companies.length,
    });
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}



