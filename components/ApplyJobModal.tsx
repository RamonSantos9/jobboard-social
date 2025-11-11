"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

interface ApplyJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  onApplySuccess?: () => void;
}

export default function ApplyJobModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  companyName,
  onApplySuccess,
}: ApplyJobModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido", {
        description: "Por favor, envie um arquivo PDF ou DOC/DOCX",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O arquivo deve ter no máximo 5MB",
      });
      return;
    }

    setResumeFile(file);
    setUploadingResume(true);

    try {
      // Upload para Cloudinary via API do backend
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "jobboard_resumes");

      const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!cloudinaryCloudName) {
        throw new Error("Cloudinary não configurado");
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao fazer upload do currículo");
      }

      const data = await response.json();
      setResumeUrl(data.secure_url);
      toast.success("Currículo enviado com sucesso");
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Erro ao fazer upload", {
        description: "Não foi possível fazer upload do currículo. Tente novamente.",
      });
      setResumeFile(null);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          coverLetter: coverLetter.trim() || undefined,
          resumeUrl: resumeUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Candidatura enviada!", {
          description: `Sua candidatura para ${jobTitle} foi enviada com sucesso.`,
        });
        onApplySuccess?.();
        onOpenChange(false);
        // Reset form
        setCoverLetter("");
        setResumeFile(null);
        setResumeUrl(null);
      } else {
        toast.error(data.error || "Erro ao enviar candidatura", {
          description: data.message || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      toast.error("Erro ao enviar candidatura", {
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Candidatar-se para a vaga
          </DialogTitle>
          <DialogDescription>
            <div className="mt-2">
              <p className="font-semibold text-gray-900">{jobTitle}</p>
              <p className="text-sm text-gray-600">{companyName}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Carta de Apresentação */}
          <div>
            <Label htmlFor="coverLetter" className="text-base font-medium">
              Carta de Apresentação
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Conte-nos por que você é a pessoa ideal para esta vaga (opcional)
            </p>
            <Textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Descreva suas qualificações, experiência e por que você está interessado nesta posição..."
              rows={8}
              className="mt-1"
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {coverLetter.length}/1000 caracteres
            </p>
          </div>

          {/* Upload de Currículo */}
          <div>
            <Label className="text-base font-medium">Currículo (PDF ou DOC)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Envie seu currículo atualizado (opcional, máximo 5MB)
            </p>

            {!resumeUrl && !resumeFile ? (
              <div className="mt-2">
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para fazer upload</span> ou
                      arraste e solte
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC ou DOCX (máx. 5MB)
                    </p>
                  </div>
                  <input
                    id="resume-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={uploadingResume}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {resumeFile?.name || "Currículo enviado"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {resumeFile
                        ? `${(resumeFile.size / 1024).toFixed(1)} KB`
                        : "Pronto para envio"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveResume}
                  disabled={uploadingResume}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {uploadingResume && (
              <p className="text-sm text-gray-500 mt-2">Fazendo upload...</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploadingResume}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingResume}>
              {loading ? "Enviando..." : "Enviar Candidatura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

