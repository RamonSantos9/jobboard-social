import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Job from "@/models/Job";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const jobs = await Job.find({ status: "active" })
      .populate("companyId", "name logoUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments({ status: "active" });

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vagas" },
      { status: 500 }
    );
  }
}
