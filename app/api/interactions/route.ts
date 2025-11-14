import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import UserInteraction from "@/models/UserInteraction";
import Vacancy from "@/models/Vacancy";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemType, itemId, interactionType, duration } = body;

    if (!itemType || !itemId || !interactionType) {
      return NextResponse.json(
        { error: "itemType, itemId e interactionType são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["job", "post"].includes(itemType)) {
      return NextResponse.json(
        { error: "itemType deve ser 'job' ou 'post'" },
        { status: 400 }
      );
    }

    if (
      !["view", "click", "save", "apply", "like", "comment", "share", "dismiss"].includes(
        interactionType
      )
    ) {
      return NextResponse.json(
        { error: "interactionType inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const itemIdObj = new mongoose.Types.ObjectId(itemId);

    // Se for uma view de vaga, atualizar viewsCount
    if (itemType === "job" && interactionType === "view") {
      await Vacancy.findByIdAndUpdate(itemIdObj, {
        $inc: { viewsCount: 1 },
      });
    }

    // Criar ou atualizar interação
    // Para views, podemos atualizar a duração se já existir
    if (interactionType === "view" && duration) {
      const existingView = await UserInteraction.findOne({
        userId,
        itemId: itemIdObj,
        itemType,
        interactionType: "view",
        timestamp: {
          $gte: new Date(Date.now() - 60000), // Último minuto
        },
      });

      if (existingView) {
        // Atualizar duração da view existente
        existingView.duration = (existingView.duration || 0) + duration;
        await existingView.save();
        return NextResponse.json({ success: true, updated: true });
      }
    }

    // Criar nova interação
    const interaction = new UserInteraction({
      userId,
      itemType,
      itemId: itemIdObj,
      interactionType,
      duration: duration || 0,
      timestamp: new Date(),
    });

    await interaction.save();

    return NextResponse.json({ success: true, interaction: interaction.toObject() });
  } catch (error: any) {
    console.error("Erro ao registrar interação:", error);
    return NextResponse.json(
      { error: "Erro ao registrar interação", details: error.message },
      { status: 500 }
    );
  }
}

