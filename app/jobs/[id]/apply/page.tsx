"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Upload, FileText, X, Loader2 } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  name?: string;
  email?: string;
  phone?: string;
}

interface VacancyData {
  _id: string;
  title: string;
  companyId: {
    name: string;
  };
}

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const vacancyId = params.id as string;
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vacancy, setVacancy] = useState<VacancyData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
  });

  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    resumeUrl: null as string | null,
    additionalInfo: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/feed/auth/login?redirect=/jobs/${vacancyId}/apply`);
      return;
    }

    if (status === "authenticated" && session) {
      fetchData();
    }
  }, [status, session, vacancyId, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar dados da vaga
      const vacancyResponse = await fetch(`/api/jobs/${vacancyId}`);
      if (!vacancyResponse.ok) {
        throw new Error("Vaga não encontrada");
      }
      const vacancyData = await vacancyResponse.json();
      setVacancy(vacancyData.job);

      // Buscar dados do perfil
      const profileResponse = await fetch("/api/profile");
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        const profile = profileResult.profile;
        const user = session?.user;

        const name = user?.name || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
        const email = user?.email || profile?.contactInfo?.email || "";
        const phone = profile?.contactInfo?.phone || "";

        setProfileData({ name, email, phone });
        setFormData({
          candidateName: name,
          candidateEmail: email,
          candidatePhone: phone,
          resumeUrl: null,
          additionalInfo: "",
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

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
      setFormData((prev) => ({ ...prev, resumeUrl: data.secure_url }));
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
    setFormData((prev) => ({ ...prev, resumeUrl: null }));
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Limita a 11 dígitos (com DDD e 9º dígito)
    const limitedNumbers = numbers.slice(0, 11);

    // Aplica a formatação
    if (limitedNumbers.length <= 2) {
      return limitedNumbers ? `(${limitedNumbers}` : "";
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData((prev) => ({ ...prev, candidatePhone: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.candidateName || !formData.candidateEmail) {
      toast.error("Campos obrigatórios", {
        description: "Nome e email são obrigatórios",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: vacancyId,
          candidateName: formData.candidateName,
          candidateEmail: formData.candidateEmail,
          candidatePhone: formData.candidatePhone || undefined,
          resumeUrl: formData.resumeUrl || undefined,
          additionalInfo: formData.additionalInfo || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Candidatura enviada!", {
          description: `Sua candidatura para ${vacancy?.title} foi enviada com sucesso.`,
        });
        router.push(`/jobs/${vacancyId}`);
      } else {
        toast.error(data.error || "Erro ao enviar candidatura", {
          description: data.message || "Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Erro ao enviar candidatura", {
        description: "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="bg-[#f3f2ef] min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-[#f3f2ef] min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">
        <Link
          href={`/jobs/${vacancyId}`}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a vaga
        </Link>

        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Candidatar-se para a vaga
            </CardTitle>
            <CardDescription className="text-base mt-2">
              <div>
                <p className="font-semibold text-gray-900">{vacancy?.title}</p>
                <p className="text-sm text-gray-600">{vacancy?.companyId?.name}</p>
              </div>
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Pessoais */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações Pessoais
                  </h3>
                  <Separator className="mb-4" />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="candidateName" className="text-sm font-medium">
                      Nome completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="candidateName"
                      type="text"
                      value={formData.candidateName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, candidateName: e.target.value }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="candidateEmail" className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="candidateEmail"
                      type="email"
                      value={formData.candidateEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, candidateEmail: e.target.value }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="candidatePhone" className="text-sm font-medium">
                      Telefone
                    </Label>
                    <Input
                      id="candidatePhone"
                      type="tel"
                      value={formData.candidatePhone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Currículo */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Currículo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Envie seu currículo em PDF (opcional, máximo 5MB)
                  </p>
                </div>

                {!formData.resumeUrl && !resumeFile ? (
                  <div>
                    <label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para fazer upload</span> ou arraste
                          e solte
                        </p>
                        <p className="text-xs text-gray-400">PDF, DOC ou DOCX (máx. 5MB)</p>
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
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
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
                  <p className="text-sm text-gray-500">Fazendo upload...</p>
                )}
              </div>

              <Separator />

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informações Adicionais
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Links, respostas curtas ou qualquer informação adicional que o recrutador
                    solicitou (opcional)
                  </p>
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-sm font-medium">
                    Informações adicionais
                  </Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, additionalInfo: e.target.value }))
                    }
                    placeholder="Ex: Links do GitHub, LinkedIn, portfólio, respostas a perguntas específicas..."
                    rows={6}
                    className="mt-1"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.additionalInfo.length}/2000 caracteres
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/jobs/${vacancyId}`)}
                  disabled={submitting || uploadingResume}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || uploadingResume}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Candidatura"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

