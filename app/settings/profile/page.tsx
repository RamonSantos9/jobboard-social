"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Camera } from "lucide-react";
import ImageUpload from "@/components/auth/ImageUpload";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

interface ProfileData {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  bannerUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  currentTitle?: string;
  currentCompany?: string;
  skills?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
}

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    skills: [],
    contactInfo: {},
    experience: [],
    education: [],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile({
          firstName: data.profile.firstName || "",
          lastName: data.profile.lastName || "",
          photoUrl: data.profile.photoUrl || "",
          bannerUrl: data.profile.bannerUrl || "",
          headline: data.profile.headline || "",
          bio: data.profile.bio || "",
          location: data.profile.location || "",
          currentTitle: data.profile.currentTitle || "",
          currentCompany: data.profile.currentCompany || "",
          skills: data.profile.skills || [],
          contactInfo: data.profile.contactInfo || {},
          experience: data.profile.experience?.map((exp: any) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate).toISOString().split("T")[0] : "",
            endDate: exp.endDate ? new Date(exp.endDate).toISOString().split("T")[0] : "",
          })) || [],
          education: data.profile.education?.map((edu: any) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : "",
            endDate: edu.endDate ? new Date(edu.endDate).toISOString().split("T")[0] : "",
          })) || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erro", {
        description: "Não foi possível carregar o perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success("Sucesso", {
          description: "Perfil atualizado com sucesso!",
        });
        router.refresh();
      } else {
        const data = await response.json();
        toast.error("Erro", {
          description: data.error || "Não foi possível atualizar o perfil",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro", {
        description: "Erro ao salvar perfil",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: profile.skills?.filter((s) => s !== skill) || [],
    });
  };

  const addExperience = () => {
    setProfile({
      ...profile,
      experience: [
        ...(profile.experience || []),
        {
          title: "",
          company: "",
          startDate: "",
          current: false,
        },
      ],
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...(profile.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, experience: updated });
  };

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experience: profile.experience?.filter((_, i) => i !== index) || [],
    });
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      education: [
        ...(profile.education || []),
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          current: false,
        },
      ],
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...(profile.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfile({ ...profile, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education?.filter((_, i) => i !== index) || [],
    });
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#f3f2ef]">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">Carregando...</div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f2ef]">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Editar Perfil</h1>
            <p className="text-gray-600 mt-1">
              Atualize suas informações pessoais e profissionais
            </p>
          </div>

          <div className="space-y-6">
            {/* Banner e Foto */}
            <Card>
              <CardHeader>
                <CardTitle>Foto e Banner</CardTitle>
                <CardDescription>
                  Adicione uma foto de perfil e um banner personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Banner */}
                <div className="space-y-2">
                  <Label>Banner</Label>
                  <div className="relative w-full h-48 bg-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    {profile.bannerUrl ? (
                      <img
                        src={profile.bannerUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4">
                      <ImageUpload
                        onUploadComplete={(url) =>
                          setProfile({ ...profile, bannerUrl: url })
                        }
                        currentImage={profile.bannerUrl}
                        label=""
                        aspectRatio="banner"
                        maxSize={10}
                      />
                    </div>
                  </div>
                </div>

                {/* Foto de Perfil */}
                <ImageUpload
                  onUploadComplete={(url) =>
                    setProfile({ ...profile, photoUrl: url })
                  }
                  currentImage={profile.photoUrl}
                  label="Foto de Perfil"
                  aspectRatio="square"
                />
              </CardContent>
            </Card>

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile({ ...profile, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile({ ...profile, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={profile.headline || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, headline: e.target.value })
                    }
                    placeholder="Ex: Desenvolvedor Full Stack"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, location: e.target.value })
                    }
                    placeholder="Ex: São Paulo, Brasil"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentTitle">Cargo Atual</Label>
                  <Input
                    id="currentTitle"
                    value={profile.currentTitle || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, currentTitle: e.target.value })
                    }
                    placeholder="Ex: Desenvolvedor Full Stack"
                  />
                </div>

                <div>
                  <Label htmlFor="currentCompany">Empresa Atual</Label>
                  <Input
                    id="currentCompany"
                    value={profile.currentCompany || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, currentCompany: e.target.value })
                    }
                    placeholder="Ex: Tech Corp"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.contactInfo?.phone || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          phone: e.target.value,
                        },
                      })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (adicional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.contactInfo?.email || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          email: e.target.value,
                        },
                      })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.contactInfo?.website || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        contactInfo: {
                          ...profile.contactInfo,
                          website: e.target.value,
                        },
                      })
                    }
                    placeholder="https://meusite.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Adicionar habilidade"
                  />
                  <Button type="button" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experiência */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Experiência</CardTitle>
                    <CardDescription>
                      Adicione suas experiências profissionais
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience?.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Experiência {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Cargo</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) =>
                            updateExperience(index, "title", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Empresa</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(index, "company", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) =>
                            updateExperience(index, "endDate", e.target.value)
                          }
                          disabled={exp.current}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`exp-current-${index}`}
                        checked={exp.current}
                        onChange={(e) =>
                          updateExperience(index, "current", e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label htmlFor={`exp-current-${index}`}>Trabalho atual</Label>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={exp.description || ""}
                        onChange={(e) =>
                          updateExperience(index, "description", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                {(!profile.experience || profile.experience.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma experiência adicionada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Educação */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Educação</CardTitle>
                    <CardDescription>Adicione sua formação acadêmica</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.education?.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Educação {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Instituição</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(index, "institution", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Grau</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(index, "degree", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Área de Estudo</Label>
                        <Input
                          value={edu.fieldOfStudy}
                          onChange={(e) =>
                            updateEducation(index, "fieldOfStudy", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) =>
                            updateEducation(index, "startDate", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={edu.endDate || ""}
                          onChange={(e) =>
                            updateEducation(index, "endDate", e.target.value)
                          }
                          disabled={edu.current}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edu-current-${index}`}
                        checked={edu.current}
                        onChange={(e) =>
                          updateEducation(index, "current", e.target.checked)
                        }
                        className="rounded"
                      />
                      <Label htmlFor={`edu-current-${index}`}>Cursando atualmente</Label>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={edu.description || ""}
                        onChange={(e) =>
                          updateEducation(index, "description", e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                {(!profile.education || profile.education.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma educação adicionada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

