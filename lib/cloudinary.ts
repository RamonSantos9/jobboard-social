export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Obtém o nome do cloud do Cloudinary
 * Tenta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME primeiro (para uso no cliente)
 * Depois tenta CLOUDINARY_CLOUD_NAME (para uso no servidor)
 * 
 * IMPORTANTE: Para uploads unsigned, você precisa:
 * 1. Ter o cloud name configurado no .env.local
 * 2. Criar um upload preset no Cloudinary dashboard chamado 'jobboard_social'
 * 3. Configurar o preset como 'Unsigned' (não requer API key)
 * 
 * Como configurar:
 * - Acesse: https://cloudinary.com/console
 * - Vá em Settings → Upload → Upload presets
 * - Clique em "Add upload preset"
 * - Nome: jobboard_social
 * - Signing mode: Unsigned
 * - Salve o preset
 */
function getCloudinaryCloudName(): string {
  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error(
      "Cloudinary não configurado: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ou CLOUDINARY_CLOUD_NAME não encontrado. " +
      "Adicione a variável no arquivo .env.local"
    );
  }

  return cloudName;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    console.log("=== uploadImage called ===");
    console.log("File:", { name: file.name, type: file.type, size: file.size });
    
    const cloudName = getCloudinaryCloudName();
    console.log("Cloudinary cloud name:", cloudName ? "Found" : "Not found");
    
    if (!cloudName) {
      throw new Error("Cloudinary não configurado: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ou CLOUDINARY_CLOUD_NAME não encontrado");
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "jobboard_social");
    
    console.log("Upload preset: jobboard_social");
    console.log("Uploading to:", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Cloudinary response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload error response:", errorText);
      
      // Tratamento específico para erro 401 (Unauthorized)
      if (response.status === 401) {
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.error?.message || "";
          
          console.error("=== ERRO 401: Problema com Upload Preset ===");
          console.error("Cloudinary error:", errorJson);
          console.error("Upload preset usado: jobboard_social");
          console.error("Cloud name:", cloudName);
          
          // Verificar se é erro de API key (geralmente significa preset não encontrado ou não unsigned)
          if (errorMessage.includes("Unknown API key") || errorMessage.includes("Invalid API key")) {
            throw new Error(
              `CONFIGURAÇÃO DO UPLOAD PRESET: O upload preset 'jobboard_social' não foi encontrado ou não está configurado como 'Unsigned' no Cloudinary. ` +
              `Por favor, verifique no dashboard do Cloudinary (Settings → Upload → Upload presets) se o preset 'jobboard_social' existe e está configurado como 'Unsigned'. ` +
              `Erro detalhado: ${errorMessage}`
            );
          }
          
          // Outros erros 401
          throw new Error(
            `ERRO DE AUTENTICAÇÃO (401): Problema com a configuração do Cloudinary. ` +
            `Verifique se o upload preset 'jobboard_social' existe e está configurado como 'Unsigned'. ` +
            `Erro: ${errorMessage || response.statusText}`
          );
        } catch (parseError) {
          throw new Error(
            `ERRO 401: Problema de autenticação no Cloudinary. ` +
            `Verifique se o upload preset 'jobboard_social' está configurado corretamente no dashboard do Cloudinary. ` +
            `Resposta: ${errorText.substring(0, 200)}`
          );
        }
      }
      
      // Outros erros HTTP
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Cloudinary error JSON:", errorJson);
        throw new Error(
          `Falha no upload da imagem: ${errorJson.error?.message || response.statusText} (${response.status})`
        );
      } catch (parseError) {
        throw new Error(
          `Falha no upload da imagem: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`
        );
      }
    }

    const result = await response.json();
    console.log("Cloudinary response:", {
      public_id: result.public_id,
      secure_url: result.secure_url ? result.secure_url.substring(0, 50) + "..." : "not found",
      width: result.width,
      height: result.height,
      format: result.format,
    });
    
    if (!result.secure_url) {
      console.error("Invalid Cloudinary response - no secure_url:", result);
      throw new Error("Resposta do Cloudinary inválida: secure_url não encontrado");
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || "unknown",
    };
  } catch (error) {
    console.error("=== uploadImage error ===");
    console.error("Error:", error);
    if (error instanceof Error && error.message.includes("Cloudinary não configurado")) {
      throw error;
    }
    throw new Error(
      `Erro ao fazer upload da imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  try {
    console.log("=== uploadVideo called ===");
    console.log("File:", { name: file.name, type: file.type, size: file.size });
    
    const cloudName = getCloudinaryCloudName();
    console.log("Cloudinary cloud name:", cloudName ? "Found" : "Not found");
    
    if (!cloudName) {
      throw new Error("Cloudinary não configurado: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ou CLOUDINARY_CLOUD_NAME não encontrado");
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "jobboard_social");
    
    console.log("Upload preset: jobboard_social");
    console.log("Uploading to:", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Cloudinary response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudinary upload error response:", errorText);
      
      // Tratamento específico para erro 401 (Unauthorized)
      if (response.status === 401) {
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.error?.message || "";
          
          console.error("=== ERRO 401: Problema com Upload Preset ===");
          console.error("Cloudinary error:", errorJson);
          console.error("Upload preset usado: jobboard_social");
          console.error("Cloud name:", cloudName);
          
          // Verificar se é erro de API key (geralmente significa preset não encontrado ou não unsigned)
          if (errorMessage.includes("Unknown API key") || errorMessage.includes("Invalid API key")) {
            throw new Error(
              `CONFIGURAÇÃO DO UPLOAD PRESET: O upload preset 'jobboard_social' não foi encontrado ou não está configurado como 'Unsigned' no Cloudinary. ` +
              `Por favor, verifique no dashboard do Cloudinary (Settings → Upload → Upload presets) se o preset 'jobboard_social' existe e está configurado como 'Unsigned'. ` +
              `Erro detalhado: ${errorMessage}`
            );
          }
          
          // Outros erros 401
          throw new Error(
            `ERRO DE AUTENTICAÇÃO (401): Problema com a configuração do Cloudinary. ` +
            `Verifique se o upload preset 'jobboard_social' existe e está configurado como 'Unsigned'. ` +
            `Erro: ${errorMessage || response.statusText}`
          );
        } catch (parseError) {
          throw new Error(
            `ERRO 401: Problema de autenticação no Cloudinary. ` +
            `Verifique se o upload preset 'jobboard_social' está configurado corretamente no dashboard do Cloudinary. ` +
            `Resposta: ${errorText.substring(0, 200)}`
          );
        }
      }
      
      // Outros erros HTTP
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Cloudinary error JSON:", errorJson);
        throw new Error(
          `Falha no upload do vídeo: ${errorJson.error?.message || response.statusText} (${response.status})`
        );
      } catch (parseError) {
        throw new Error(
          `Falha no upload do vídeo: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`
        );
      }
    }

    const result = await response.json();
    console.log("Cloudinary response:", {
      public_id: result.public_id,
      secure_url: result.secure_url ? result.secure_url.substring(0, 50) + "..." : "not found",
      width: result.width,
      height: result.height,
      format: result.format,
    });
    
    if (!result.secure_url) {
      console.error("Invalid Cloudinary response - no secure_url:", result);
      throw new Error("Resposta do Cloudinary inválida: secure_url não encontrado");
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format || "unknown",
    };
  } catch (error) {
    console.error("=== uploadVideo error ===");
    console.error("Error:", error);
    if (error instanceof Error && error.message.includes("Cloudinary não configurado")) {
      throw error;
    }
    throw new Error(
      `Erro ao fazer upload do vídeo: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
  }
}

export function validateImageFile(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  // Verificar também pela extensão do arquivo caso o tipo MIME não esteja disponível
  const fileName = file.name.toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

  const isValidType = allowedTypes.includes(file.type) || hasValidExtension;
  const isValidSize = file.size <= maxSize && file.size > 0;

  console.log("Image validation details:", {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    isValidType,
    isValidSize,
    hasValidExtension,
  });

  return isValidType && isValidSize;
}

export function validateVideoFile(file: File): boolean {
  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
  const maxSize = 100 * 1024 * 1024; // 100MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
}
