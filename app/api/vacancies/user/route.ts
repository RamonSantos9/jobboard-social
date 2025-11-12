import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import Vacancy from "@/models/Vacancy";
import Company from "@/models/Company";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(session.user.id);

    // Buscar empresas onde o usuário é admin ou recrutador
    const companies = await Company.find({
      $or: [
        { admins: userId },
        { recruiters: userId },
      ],
    })
      .select("_id name")
      .lean();

    const companyIds = companies.map((company: any) => company._id);

    if (companyIds.length === 0) {
      return NextResponse.json({
        vacancies: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Buscar vagas das empresas do usuário
    const vacancies = await Vacancy.find({
      companyId: { $in: companyIds },
    })
      .populate("companyId", "name logoUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Vacancy.countDocuments({
      companyId: { $in: companyIds },
    });

    // Formatar dados das vagas
    const formattedVacancies = vacancies.map((vacancy: any) => ({
      _id: vacancy._id.toString(),
      title: vacancy.title || "",
      status: vacancy.status || "draft",
      companyId: {
        _id: vacancy.companyId?._id?.toString() || "",
        name: vacancy.companyId?.name || "",
        logoUrl: vacancy.companyId?.logoUrl || null,
      },
      createdAt: vacancy.createdAt,
      updatedAt: vacancy.updatedAt,
      publishedAt: vacancy.publishedAt || null,
      location: vacancy.location || "",
      type: vacancy.type || "",
      level: vacancy.level || "",
    }));

    return NextResponse.json({
      vacancies: formattedVacancies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar vagas do usuário:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao buscar vagas do usuário", details: errorMessage },
      { status: 500 }
    );
  }
}

