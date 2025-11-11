import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  uploadImage,
  uploadVideo,
  validateImageFile,
  validateVideoFile,
} from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Upload API Called ===");
    
    const session = await auth();
    console.log("Session:", session ? "Authenticated" : "Not authenticated");

    if (!session || !session.user) {
      console.log("Authentication failed");
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "image" ou "video"

    console.log("File received:", {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      uploadType: type,
    });

    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }

    if (!type || (type !== "image" && type !== "video")) {
      console.log("Invalid type:", type);
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use 'image' ou 'video'" },
        { status: 400 }
      );
    }

    // Validar tipo e tamanho do arquivo
    if (type === "image") {
      const isValid = validateImageFile(file);
      console.log("Image validation:", isValid, {
        fileType: file.type,
        fileSize: file.size,
      });
      if (!isValid) {
        return NextResponse.json(
          {
            error:
              "Arquivo de imagem inválido. Use JPG, PNG, GIF ou WebP com no máximo 10MB",
          },
          { status: 400 }
        );
      }
    } else if (type === "video") {
      const isValid = validateVideoFile(file);
      console.log("Video validation:", isValid, {
        fileType: file.type,
        fileSize: file.size,
      });
      if (!isValid) {
        return NextResponse.json(
          {
            error:
              "Arquivo de vídeo inválido. Use MP4, WebM ou QuickTime com no máximo 100MB",
          },
          { status: 400 }
        );
      }
    }

    console.log("Starting upload to Cloudinary...");
    
    // Fazer upload
    if (type === "image") {
      const uploadResult = await uploadImage(file);
      console.log("Upload successful:", {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url.substring(0, 50) + "...",
        format: uploadResult.format,
      });
      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        type: "image",
      });
    } else {
      const uploadResult = await uploadVideo(file);
      console.log("Upload successful:", {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url.substring(0, 50) + "...",
        format: uploadResult.format,
      });
      return NextResponse.json({
        success: true,
        url: uploadResult.secure_url,
        type: "video",
      });
    }
  } catch (error) {
    console.error("=== Upload Error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao fazer upload do arquivo";
    
    // Verificar se é erro de configuração do Cloudinary (variável de ambiente)
    if (errorMessage.includes("Cloudinary não configurado")) {
      console.error("Cloudinary configuration error - check environment variables");
      return NextResponse.json(
        {
          error: "Cloudinary não configurado",
          message: "A variável de ambiente NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME não foi encontrada. " +
                   "Adicione esta variável no arquivo .env.local com o seu Cloud Name do Cloudinary.",
          type: "configuration_error",
        },
        { status: 500 }
      );
    }
    
    // Verificar se é erro de upload preset (401)
    if (errorMessage.includes("CONFIGURAÇÃO DO UPLOAD PRESET") || 
        errorMessage.includes("ERRO DE AUTENTICAÇÃO (401)") ||
        errorMessage.includes("ERRO 401")) {
      console.error("Upload preset configuration error");
      return NextResponse.json(
        {
          error: "Configuração do Upload Preset incorreta",
          message: "O upload preset 'jobboard_social' não foi encontrado ou não está configurado como 'Unsigned' no Cloudinary. " +
                   "Por favor, acesse o dashboard do Cloudinary (https://cloudinary.com/console), vá em Settings → Upload → Upload presets, " +
                   "crie um preset chamado 'jobboard_social' e configure como 'Unsigned'.",
          details: errorMessage,
          type: "preset_error",
          troubleshooting: {
            step1: "Acesse https://cloudinary.com/console",
            step2: "Vá em Settings → Upload → Upload presets",
            step3: "Clique em 'Add upload preset'",
            step4: "Nome: jobboard_social",
            step5: "Signing mode: Unsigned",
            step6: "Salve o preset",
            step7: "Reinicie o servidor Next.js",
          },
        },
        { status: 500 }
      );
    }
    
    // Outros erros do Cloudinary
    if (errorMessage.includes("Falha no upload") || errorMessage.includes("Cloudinary")) {
      return NextResponse.json(
        {
          error: "Erro ao fazer upload no Cloudinary",
          message: errorMessage,
          type: "upload_error",
        },
        { status: 500 }
      );
    }
    
    // Erros genéricos
    return NextResponse.json(
      {
        error: "Erro ao fazer upload do arquivo",
        message: errorMessage,
        type: "unknown_error",
      },
      { status: 500 }
    );
  }
}

