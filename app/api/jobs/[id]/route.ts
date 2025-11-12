import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Vacancy from "@/models/Vacancy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const job = await Vacancy.findById(id)
      .populate("companyId", "name logoUrl description location industry size")
      .lean();

    if (!job) {
      return NextResponse.json(
        { error: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    // Incrementar contador de visualizações
    await Vacancy.findByIdAndUpdate(id, {
      $inc: { viewsCount: 1 },
    });

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Erro ao buscar vaga:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vaga", details: error.message },
      { status: 500 }
    );
  }
}
