export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jobboard_social");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Falha no upload da imagem");
  }

  const result = await response.json();
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function uploadVideo(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "jobboard_social");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Falha no upload do vídeo");
  }

  const result = await response.json();
  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export function validateImageFile(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

export function validateVideoFile(file: File): boolean {
  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
  const maxSize = 100 * 1024 * 1024; // 100MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
}
