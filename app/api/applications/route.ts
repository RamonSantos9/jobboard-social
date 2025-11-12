import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Application from "@/models/Application";
import Company from "@/models/Company";
import Vacancy from "@/models/Vacancy";
import Notification from "@/models/Notification";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { jobId, coverLetter, resumeUrl } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "ID da vaga é obrigatório" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: session.user.id,
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "Você já se candidatou a esta vaga" },
        { status: 400 }
      );
    }

    // Check if vacancy exists and is published
    const job = await Vacancy.findOne({ _id: jobId, status: "published" });
    if (!job) {
      return NextResponse.json(
        { error: "Vaga não encontrada ou não está mais ativa" },
        { status: 404 }
      );
    }

    const application = new Application({
      jobId,
      candidateId: session.user.id,
      coverLetter: coverLetter || undefined,
      resumeUrl: resumeUrl || undefined,
    });

    await application.save();

    // Update job applications count
    await Vacancy.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    // Notificar recrutadores da empresa
    if (job.companyId) {
      const company = (await Company.findById(job.companyId)
        .select("name recruiters admins")
        .lean()) as unknown as {
        _id: mongoose.Types.ObjectId;
        name?: string;
        recruiters?: mongoose.Types.ObjectId[];
        admins?: mongoose.Types.ObjectId[];
      } | null;

      if (company) {
        const recipients = new Set<string>();
        (company.recruiters || []).forEach((recruiter: mongoose.Types.ObjectId) =>
          recipients.add(recruiter.toString())
        );
        (company.admins || []).forEach((admin: mongoose.Types.ObjectId) =>
          recipients.add(admin.toString())
        );

        const candidateName = session.user.name || "Um candidato";

        await Promise.all(
          Array.from(recipients).map((userId) =>
            Notification.create({
              userId,
              type: "job",
              title: "Nova candidatura recebida",
              message: `${candidateName} se candidatou à vaga ${job.title}.`,
              link: `/jobs/${jobId}`,
              relatedUserId: session.user.id,
              metadata: {
                companyId: company._id.toString(),
              },
            })
          )
        );
      }
    }

    return NextResponse.json(
      { message: "Candidatura enviada com sucesso", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Application creation error:", error);
    return NextResponse.json(
      { error: "Erro ao enviar candidatura" },
      { status: 500 }
    );
  }
}

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

    const applications = await Application.find({
      candidateId: session.user.id,
    })
      .populate("jobId", "title companyId")
      .populate({
        path: "jobId",
        populate: {
          path: "companyId",
          select: "name logoUrl",
        },
      })
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Applications fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar candidaturas" },
      { status: 500 }
    );
  }
}
