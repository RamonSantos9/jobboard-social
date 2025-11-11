"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  currentTitle?: string;
  currentCompany?: string;
  sector?: string;
  location?: string;
  preferredLocation?: string;
  bio?: string;
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
  skills?: string[];
}

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export default function EditProfileModal({
  open,
  onOpenChange,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    experience: [],
    education: [],
    skills: [],
    contactInfo: {},
  });
  const [newSkill, setNewSkill] = useState("");
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && session) {
      fetchProfile();
    }
  }, [open, session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      if (response.ok && data.profile) {
        const profile = data.profile;
        // Converter datas para strings se necessário
        const formatDate = (date: any) => {
          if (!date) return "";
          const d = new Date(date);
          return d.toISOString().split("T")[0];
        };

        setProfileData({
          currentTitle: profile.currentTitle || "",
          currentCompany: profile.currentCompany || "",
          sector: profile.sector || "",
          location: profile.location || "",
          preferredLocation: profile.preferredLocation || "",
          bio: profile.bio || "",
          contactInfo: profile.contactInfo || {},
          experience:
            profile.experience?.map((exp: any) => ({
              ...exp,
              startDate: formatDate(exp.startDate),
              endDate: formatDate(exp.endDate),
            })) || [],
          education:
            profile.education?.map((edu: any) => ({
              ...edu,
              startDate: formatDate(edu.startDate),
              endDate: formatDate(edu.endDate),
            })) || [],
          skills: profile.skills || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Perfil atualizado com sucesso!");
        onProfileUpdated?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills?.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...(profileData.skills || []), newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills?.filter((s) => s !== skill) || [],
    });
  };

  const addExperience = () => {
    setProfileData({
      ...profileData,
      experience: [
        ...(profileData.experience || []),
        {
          title: "",
          company: "",
          startDate: new Date().toISOString().split("T")[0],
          current: false,
          description: "",
        },
      ],
    });
    setEditingExpIndex((profileData.experience?.length || 0));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...(profileData.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, experience: updated });
  };

  const removeExperience = (index: number) => {
    setProfileData({
      ...profileData,
      experience: profileData.experience?.filter((_, i) => i !== index) || [],
    });
  };

  const addEducation = () => {
    setProfileData({
      ...profileData,
      education: [
        ...(profileData.education || []),
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: new Date().toISOString().split("T")[0],
          current: false,
          description: "",
        },
      ],
    });
    setEditingEduIndex((profileData.education?.length || 0));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...(profileData.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfileData({
      ...profileData,
      education: profileData.education?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações profissionais para melhorar suas
            recomendações de vagas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="experience">Experiência</TabsTrigger>
            <TabsTrigger value="education">Educação</TabsTrigger>
            <TabsTrigger value="skills">Competências</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentTitle">Cargo Atual</Label>
                <Input
                  id="currentTitle"
                  value={profileData.currentTitle || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      currentTitle: e.target.value,
                    })
                  }
                  placeholder="Ex: Desenvolvedor Full Stack"
                />
              </div>
              <div>
                <Label htmlFor="currentCompany">Empresa Atual</Label>
                <Input
                  id="currentCompany"
                  value={profileData.currentCompany || ""}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      currentCompany: e.target.value,
                    })
                  }
                  placeholder="Ex: Tech Corp"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector">Setor</Label>
                <Input
                  id="sector"
                  value={profileData.sector || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, sector: e.target.value })
                  }
                  placeholder="Ex: Tecnologia"
                />
              </div>
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={profileData.location || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, location: e.target.value })
                  }
                  placeholder="Ex: São Paulo, SP"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="preferredLocation">
                Localização Preferida (para recomendações)
              </Label>
              <Input
                id="preferredLocation"
                value={profileData.preferredLocation || ""}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    preferredLocation: e.target.value,
                  })
                }
                placeholder="Ex: São Paulo, SP ou Remoto"
              />
            </div>

            <div>
              <Label htmlFor="bio">Sobre</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ""}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                placeholder="Descreva sua experiência e objetivos profissionais..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Informações de Contato</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.contactInfo?.phone || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        contactInfo: {
                          ...profileData.contactInfo,
                          phone: e.target.value,
                        },
                      })
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">E-mail</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileData.contactInfo?.email || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        contactInfo: {
                          ...profileData.contactInfo,
                          email: e.target.value,
                        },
                      })
                    }
                    placeholder="contato@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileData.contactInfo?.website || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        contactInfo: {
                          ...profileData.contactInfo,
                          website: e.target.value,
                        },
                      })
                    }
                    placeholder="https://meusite.com"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Experiência Profissional</h3>
              <Button onClick={addExperience} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Experiência
              </Button>
            </div>

            <div className="space-y-4">
              {profileData.experience?.map((exp, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
                        placeholder="Ex: Desenvolvedor Full Stack"
                      />
                    </div>
                    <div>
                      <Label>Empresa</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(index, "company", e.target.value)
                        }
                        placeholder="Ex: Tech Corp"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="flex items-center space-x-2">
                        <Input
                          type="date"
                          value={exp.endDate || ""}
                          onChange={(e) =>
                            updateExperience(index, "endDate", e.target.value)
                          }
                          disabled={exp.current}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`current-${index}`}
                            checked={exp.current}
                            onChange={(e) =>
                              updateExperience(
                                index,
                                "current",
                                e.target.checked
                              )
                            }
                          />
                          <Label htmlFor={`current-${index}`}>Atual</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={exp.description || ""}
                      onChange={(e) =>
                        updateExperience(index, "description", e.target.value)
                      }
                      placeholder="Descreva suas responsabilidades e conquistas..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Formação Acadêmica</h3>
              <Button onClick={addEducation} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Formação
              </Button>
            </div>

            <div className="space-y-4">
              {profileData.education?.map((edu, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
                        placeholder="Ex: Universidade de São Paulo"
                      />
                    </div>
                    <div>
                      <Label>Grau</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(index, "degree", e.target.value)
                        }
                        placeholder="Ex: Bacharelado"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Área de Estudo</Label>
                    <Input
                      value={edu.fieldOfStudy}
                      onChange={(e) =>
                        updateEducation(index, "fieldOfStudy", e.target.value)
                      }
                      placeholder="Ex: Ciência da Computação"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label>Data de Conclusão</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="date"
                          value={edu.endDate || ""}
                          onChange={(e) =>
                            updateEducation(index, "endDate", e.target.value)
                          }
                          disabled={edu.current}
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edu-current-${index}`}
                            checked={edu.current}
                            onChange={(e) =>
                              updateEducation(index, "current", e.target.checked)
                            }
                          />
                          <Label htmlFor={`edu-current-${index}`}>Cursando</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={edu.description || ""}
                      onChange={(e) =>
                        updateEducation(index, "description", e.target.value)
                      }
                      placeholder="Descrição adicional..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Competências</h3>
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
                  placeholder="Adicionar competência"
                />
                <Button onClick={addSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profileData.skills?.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
