"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import LinkedInIcon from "@/components/LinkedInIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import ProfileSkeleton from "@/components/ProfileSkeleton";
import BannerModal from "@/components/BannerModal";
import ProfilePhotoModal from "@/components/ProfilePhotoModal";
import MediaExpansionModal from "@/components/MediaExpansionModal";
import { LocationCombobox } from "@/components/LocationCombobox";
import { InstitutionCombobox } from "@/components/InstitutionCombobox";
import { toast } from "sonner";
import { useTour } from "@/hooks/useTour";
import { DriveStep } from "driver.js";

interface PublicProfile {
  _id: string;
  userId: { _id: string; name: string; email: string };
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  bannerUrl?: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  currentTitle?: string;
  currentCompany?: string;
  sector?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    websiteLinkText?: string;
  };
  preferredLocation?: string;
  experience?: Array<{
    title: string;
    company: string;
    startDate: Date | string;
    endDate?: Date | string;
    current: boolean;
    description?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date | string;
    endDate?: Date | string;
    current: boolean;
    description?: string;
  }>;
  connections?: number;
  followersCount?: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerPreviewOpen, setBannerPreviewOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [savingContact, setSavingContact] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    nickname: "",
    headline: "",
    sector: "",
    institution: "",
    location: "",
    country: "",
    state: "",
    city: "",
    currentTitle: "",
    currentCompany: "",
    bio: "",
    website: "",
    websiteLinkText: "",
    education: [] as Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description?: string;
    }>,
    experience: [] as Array<{
      title: string;
      company: string;
      startDate: string;
      endDate?: string;
      current: boolean;
      description?: string;
    }>,
  });

  // Callbacks memoizados para LocationCombobox (devem estar logo após useState)
  const handleCountryChange = useCallback((country: string) => {
    setProfileForm((prev: typeof profileForm) => ({
      ...prev,
      country,
      state: "",
      city: "",
    }));
  }, []);

  const handleStateChange = useCallback((state: string) => {
    setProfileForm((prev: typeof profileForm) => ({
      ...prev,
      state,
      // Não limpar cidade quando estado é definido automaticamente pela seleção da cidade
    }));
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setProfileForm((prev: typeof profileForm) => ({ ...prev, city }));
    // Estado será atualizado automaticamente via handleStateChange quando cidade for selecionada
  }, []);

  const isOwnProfile = profile?.userId?._id === session?.user?.id;
  const { startTour } = useTour();

  const profileTourSteps: DriveStep[] = [
    {
      element: "#profile-banner",
      popover: {
        title: "Sua Capa",
        description:
          "Adicione uma imagem de capa profissional para personalizar seu perfil.",
        side: "bottom",
      },
    },
    {
      element: "#profile-photo",
      popover: {
        title: "Sua Foto",
        description:
          "Uma boa foto ajuda você a ser reconhecido. Clique para alterar.",
        side: "right",
      },
    },
    {
      element: "#profile-edit-btn",
      popover: {
        title: "Editar Perfil",
        description:
          "Mantenha suas informações atualizadas: cargo, localização e sobre você.",
        side: "left",
      },
    },
    {
      element: "#profile-actions",
      popover: {
        title: "Ações Rápidas",
        description:
          "Adicione seções, demonstre interesse e aprimore seu perfil aqui.",
        side: "top",
      },
    },
  ];

  useEffect(() => {
    if (isOwnProfile && !loading && profile) {
      const hasSeenProfileTour = localStorage.getItem("hasSeenProfileTour");
      if (!hasSeenProfileTour) {
        setTimeout(() => {
          startTour(profileTourSteps);
          localStorage.setItem("hasSeenProfileTour", "true");
        }, 1000);
      }

      // Listener para iniciar manualmente
      const handleStartTour = () => {
        startTour(profileTourSteps);
      };

      window.addEventListener("startProfileTour", handleStartTour);
      return () => {
        window.removeEventListener("startProfileTour", handleStartTour);
      };
    }
  }, [isOwnProfile, loading, profile]);

  // Função para parsear location existente
  const parseLocation = (locationString: string) => {
    if (!locationString) return { country: "", state: "", city: "" };

    // Tentar parsear formato "país, estado, cidade"
    const parts = locationString.split(",").map((p) => p.trim());

    if (parts.length >= 3) {
      return {
        country: parts[0] || "",
        state: parts[1] || "",
        city: parts[2] || "",
      };
    } else if (parts.length === 2) {
      // Formato antigo: "cidade, estado" - assumir Brasil
      return {
        country: "Brasil",
        state: parts[1] || "",
        city: parts[0] || "",
      };
    } else if (parts.length === 1) {
      // Apenas cidade - assumir Brasil e tentar identificar estado
      return {
        country: "Brasil",
        state: "",
        city: parts[0] || "",
      };
    }

    return { country: "", state: "", city: "" };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/public/${slug}`);
        const data = await response.json();

        if (response.ok) {
          setProfile(data.profile);
          // Preencher formulário do perfil
          const profileData = data.profile;
          const parsedLocation = parseLocation(profileData.location || "");
          setProfileForm({
            firstName: profileData.firstName || "",
            lastName: profileData.lastName || "",
            nickname: "",
            headline: profileData.headline || "",
            sector: profileData.sector || "",
            institution:
              profileData.education?.find((e: any) => e.current)?.institution ||
              "",
            location: profileData.location || "",
            country: parsedLocation.country,
            state: parsedLocation.state,
            city: parsedLocation.city,
            currentTitle: profileData.currentTitle || "",
            currentCompany: profileData.currentCompany || "",
            bio: profileData.bio || "",
            website: profileData.contactInfo?.website || "",
            websiteLinkText: profileData.contactInfo?.websiteLinkText || "",
            education: (profileData.education || []).map((edu: any) => ({
              ...edu,
              startDate: edu.startDate
                ? new Date(edu.startDate).toISOString().split("T")[0]
                : "",
              endDate: edu.endDate
                ? new Date(edu.endDate).toISOString().split("T")[0]
                : "",
            })),
            experience: (profileData.experience || []).map((exp: any) => ({
              ...exp,
              startDate: exp.startDate
                ? new Date(exp.startDate).toISOString().split("T")[0]
                : "",
              endDate: exp.endDate
                ? new Date(exp.endDate).toISOString().split("T")[0]
                : "",
            })),
          });
        } else {
          setError(data.error || "Erro ao carregar perfil");
        }
      } catch (error) {
        setError("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!session) return;
      try {
        const response = await fetch("/api/users?limit=3");
        const data = await response.json();
        if (response.ok && data.users) {
          setSuggestedUsers(data.users.slice(0, 3));
        }
      } catch (error) {
        // Ignorar erros ao buscar sugestões
      }
    };

    if (isOwnProfile) {
      fetchSuggestedUsers();
    }
  }, [session, isOwnProfile]);

  const handleProfileUpdated = () => {
    // Verificação de segurança: só atualizar se for o próprio perfil
    if (!isOwnProfile) {
      console.warn("Tentativa de atualizar perfil de outro usuário bloqueada");
      return;
    }

    // Recarregar o perfil após atualização
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/public/${slug}`);
        const data = await response.json();
        if (response.ok) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error("Error reloading profile:", error);
      }
    };
    fetchProfile();
  };

  // Verificar se profile existe antes de acessar suas propriedades
  if (loading || !profile) {
    return (
      <>
        <Header sticky={false} />
        <ProfileSkeleton />
      </>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Perfil não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "O perfil que você está procurando não existe."}
          </p>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsDisplay = profile.skills?.slice(0, 5).join(" | ") || "";

  // Obter faculdade atual ou emprego atual
  const currentEducation = profile.education?.find((edu) => edu.current);
  const currentJob = profile.experience?.find((exp) => exp.current);

  const handleSaveContactInfo = async () => {
    // Verificação de segurança: só salvar se for o próprio perfil
    if (!isOwnProfile) {
      toast.error("Você não tem permissão para editar este perfil");
      setContactModalOpen(false);
      return;
    }

    setSavingContact(true);
    try {
      // Concatenar país, estado e cidade no formato "país, estado, cidade"
      // Estado é extraído automaticamente quando cidade é selecionada
      const locationString =
        profileForm.country && profileForm.city
          ? profileForm.state
            ? `${profileForm.country}, ${profileForm.state}, ${profileForm.city}`
            : `${profileForm.country}, ${profileForm.city}`
          : profileForm.location;

      // Atualizar array de educação com a instituição selecionada (se houver)
      let updatedEducation = [...profileForm.education];

      // Se o InstitutionCombobox foi usado e há uma instituição selecionada,
      // atualizar ou criar educação atual
      if (profileForm.institution) {
        // Procurar se já existe uma educação atual
        const currentEducationIndex = updatedEducation.findIndex(
          (edu) => edu.current === true
        );

        if (currentEducationIndex >= 0) {
          // Atualizar a educação atual com a nova instituição
          updatedEducation[currentEducationIndex] = {
            ...updatedEducation[currentEducationIndex],
            institution: profileForm.institution,
            // Garantir que degree e fieldOfStudy existam (campos obrigatórios)
            degree:
              updatedEducation[currentEducationIndex].degree ||
              "Não especificado",
            fieldOfStudy:
              updatedEducation[currentEducationIndex].fieldOfStudy ||
              "Não especificado",
          };
        } else if (updatedEducation.length === 0) {
          // Se não há educação, criar uma nova entrada atual
          updatedEducation.push({
            institution: profileForm.institution,
            degree: "Não especificado",
            fieldOfStudy: "Não especificado",
            startDate: new Date().toISOString().split("T")[0],
            current: true,
            description: "",
          });
        }
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          headline: profileForm.headline,
          sector: profileForm.sector,
          location: locationString,
          currentTitle: profileForm.currentTitle,
          currentCompany: profileForm.currentCompany,
          bio: profileForm.bio,
          education: updatedEducation,
          experience: profileForm.experience,
          contactInfo: {
            website: profileForm.website || undefined,
            websiteLinkText: profileForm.websiteLinkText || undefined,
          },
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success("Perfil atualizado com sucesso!");
        setContactModalOpen(false);
        // Recarregar perfil usando o slug retornado pela API ou o slug atual
        const fetchProfile = async () => {
          // Usar o slug retornado pela API, ou o slug do perfil atual, ou o slug da URL
          const profileSlug =
            responseData.profile?.slug || profile?.slug || slug;
          const res = await fetch(`/api/profile/public/${profileSlug}`);
          const data = await res.json();
          if (res.ok) {
            setProfile(data.profile);
            // Atualizar formulário
            const profileData = data.profile;
            const parsedLocation = parseLocation(profileData.location || "");
            setProfileForm({
              firstName: profileData.firstName || "",
              lastName: profileData.lastName || "",
              nickname: "",
              headline: profileData.headline || "",
              sector: profileData.sector || "",
              institution:
                profileData.education?.find((e: any) => e.current)
                  ?.institution || "",
              location: profileData.location || "",
              country: parsedLocation.country,
              state: parsedLocation.state,
              city: parsedLocation.city,
              currentTitle: profileData.currentTitle || "",
              currentCompany: profileData.currentCompany || "",
              bio: profileData.bio || "",
              website: profileData.contactInfo?.website || "",
              websiteLinkText: profileData.contactInfo?.websiteLinkText || "",
              education: (profileData.education || []).map((edu: any) => ({
                ...edu,
                startDate: edu.startDate
                  ? new Date(edu.startDate).toISOString().split("T")[0]
                  : "",
                endDate: edu.endDate
                  ? new Date(edu.endDate).toISOString().split("T")[0]
                  : "",
              })),
              experience: (profileData.experience || []).map((exp: any) => ({
                ...exp,
                startDate: exp.startDate
                  ? new Date(exp.startDate).toISOString().split("T")[0]
                  : "",
                endDate: exp.endDate
                  ? new Date(exp.endDate).toISOString().split("T")[0]
                  : "",
              })),
            });
          }
        };
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSavingContact(false);
    }
  };

  const addCurrentJob = () => {
    // Se os campos já estão preenchidos, não fazer nada
    if (profileForm.currentTitle || profileForm.currentCompany) {
      return;
    }
    // Habilitar campos de cargo atual
    setProfileForm({
      ...profileForm,
      currentTitle: "",
      currentCompany: "",
    });
  };

  const addNewPosition = () => {
    setProfileForm({
      ...profileForm,
      experience: [
        ...profileForm.experience,
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
    const updated = [...profileForm.experience];
    updated[index] = { ...updated[index], [field]: value };
    setProfileForm({ ...profileForm, experience: updated });
  };

  const removeExperience = (index: number) => {
    setProfileForm({
      ...profileForm,
      experience: profileForm.experience.filter((_, i) => i !== index),
    });
  };

  const addEducation = () => {
    setProfileForm({
      ...profileForm,
      education: [
        ...profileForm.education,
        {
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          current: false,
          description: "",
        },
      ],
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...profileForm.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfileForm({ ...profileForm, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfileForm({
      ...profileForm,
      education: profileForm.education.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Grid 70/30 */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          {/* Coluna Esquerda - 70% (7 colunas) */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Card Principal */}
            <Card className="overflow-hidden bg-white py-0">
              {/* Banner */}
              <div
                id="profile-banner"
                className="relative h-[100px] sm:h-[150px] bg-cover bg-center cursor-pointer group"
                style={{
                  backgroundImage: profile.bannerUrl
                    ? `url(${profile.bannerUrl})`
                    : `url(/placeholder/personbanner.svg)`,
                }}
                onClick={() => {
                  const bannerUrl =
                    profile.bannerUrl || "/placeholder/personbanner.svg";
                  if (bannerUrl) {
                    setBannerPreviewOpen(true);
                  }
                }}
              >
                {isOwnProfile && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBannerModalOpen(true);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition z-10"
                    title="Adicionar imagem de capa"
                    type="button"
                  >
                    <LinkedInIcon
                      id="camera-medium"
                      size={20}
                      className="text-white"
                    />
                  </button>
                )}
              </div>

              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
                {/* Foto de Perfil com Placeholder e Ícone de Editar */}
                <div className="relative -mt-12 sm:-mt-16 mb-3 sm:mb-4">
                  <div
                    className="relative shrink-0 inline-block cursor-pointer"
                    onClick={() => {
                      if (isOwnProfile) {
                        setPhotoModalOpen(true);
                      } else {
                        const photoUrl =
                          profile.photoUrl ||
                          "/placeholder/userplaceholder.svg";
                        if (photoUrl) {
                          // Se não for o próprio perfil, apenas visualizar
                          // Você pode adicionar um modal de visualização aqui se quiser
                        }
                      }
                    }}
                  >
                    <Avatar
                      id="profile-photo"
                      className="w-[100px] h-[100px] sm:w-[152px] sm:h-[152px] border-2 sm:border-4 border-white"
                    >
                      <AvatarImage
                        src={
                          profile.photoUrl || "/placeholder/userplaceholder.svg"
                        }
                      />
                      <AvatarFallback className="text-2xl sm:text-4xl bg-blue-100 text-blue-600">
                        {profile.firstName[0]}
                        {profile.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {/* Ícone de pincel alinhado na foto */}
                  {isOwnProfile && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isOwnProfile) return;
                        setContactModalOpen(true);
                      }}
                      className="absolute top-16 sm:top-22 right-0 p-1 sm:p-1.5 text-black z-10"
                      id="profile-edit-btn"
                      title="Editar perfil"
                    >
                      <LinkedInIcon
                        id="edit-medium"
                        size={20}
                        className="sm:w-6 sm:h-6"
                      />
                    </button>
                  )}
                </div>

                {/* Grid de 2 colunas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Coluna 1: Título, Cidade, Link do Perfil e Informações de Contato */}
                  <div className="space-y-2 sm:space-y-2">
                    {/* Nome e Botão de Verificação */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-semibold text-black">
                        {fullName}
                      </h1>
                      {isOwnProfile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 self-start sm:self-auto whitespace-nowrap"
                        >
                          Adicionar selo de verificação
                        </Button>
                      )}
                    </div>

                    {/* Headline */}
                    {profile.headline && (
                      <p className="text-black text-xs sm:text-sm">
                        {profile.headline}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      {/* Localização */}
                      {profile.location && (
                        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-black/70 font-medium">
                          <span>
                            {(() => {
                              const parts = profile.location
                                .split(",")
                                .map((p: string) => p.trim());
                              if (parts.length >= 3) {
                                return `${parts[2]}, ${parts[1]}, ${parts[0]}`;
                              }
                              return profile.location;
                            })()}
                          </span>
                        </div>
                      )}

                      {/* Link Informações de Contato */}
                      {isOwnProfile && (
                        <button
                          onClick={() => {
                            if (!isOwnProfile) return;
                            setContactModalOpen(true);
                          }}
                          className="text-[11px] sm:text-xs text-blue-600 hover:underline font-medium self-start sm:self-auto"
                        >
                          Informações de contato
                        </button>
                      )}
                    </div>

                    {/* Link do Portfólio/Website */}
                    {profile.contactInfo?.website && (
                      <div>
                        <a
                          href={profile.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <strong>
                            {profile.contactInfo.websiteLinkText ||
                              profile.contactInfo.website.replace(
                                /^https?:\/\//,
                                ""
                              )}
                          </strong>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="w-4 h-4"
                            aria-hidden="true"
                          >
                            <path d="M15 1v6h-2V4.41L7.41 10 6 8.59 11.59 3H9V1zm-4 10a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h2V3H5a3 3 0 00-3 3v5a3 3 0 003 3h5a3 3 0 003-3V9h-2z"></path>
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Instituição de Ensino - no topo direito */}
                  <div className="flex justify-start sm:justify-end items-start">
                    {currentEducation && (
                      <div className="">
                        <div className="flex items-center gap-2">
                          {/* Logo da Instituição - usando SVG studyorvacancies */}
                          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src="/placeholder/studyorvacancies.svg"
                              alt="Instituição de Ensino"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Informações da Instituição */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-black">
                              {currentEducation.institution}
                            </h4>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Botões de Ação */}
                <div
                  id="profile-actions"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-4 sm:py-6"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-[10px] sm:text-xs px-2 sm:px-3 h-8 sm:h-9"
                  >
                    <span className="truncate">Tenho interesse em...</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-[10px] sm:text-xs px-2 sm:px-3 h-8 sm:h-9"
                  >
                    <span className="truncate">Adicionar seção ao perfil</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-[10px] sm:text-xs px-2 sm:px-3 h-8 sm:h-9"
                  >
                    <span className="truncate">Aprimorar perfil</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-[10px] sm:text-xs px-2 sm:px-3 h-8 sm:h-9"
                  >
                    Recursos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - 30% (3 colunas) */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            {/* Idioma do Perfil */}
            {isOwnProfile && (
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-black mb-1">
                        Idioma do perfil
                      </h3>
                      <p className="text-xs sm:text-sm text-black">Português</p>
                    </div>
                    <button className="text-black shrink-0">
                      <LinkedInIcon
                        id="edit-medium"
                        size={20}
                        className="sm:w-6 sm:h-6"
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Perfil Público e URL */}
            {isOwnProfile && (
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-black mb-1">
                        Perfil público e URL
                      </h3>
                      <a
                        href={`/jobboard/${profile.slug}`}
                        className="text-xs sm:text-sm text-blue-600 hover:underline break-all"
                      >
                        www.jobboard.com/in/{profile.slug}
                      </a>
                    </div>
                    <button className="text-black shrink-0">
                      <LinkedInIcon
                        id="edit-medium"
                        size={20}
                        className="sm:w-6 sm:h-6"
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pessoas que talvez você conheça */}
            {isOwnProfile && suggestedUsers.length > 0 && (
              <Card>
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-black">
                    Pessoas que talvez você conheça
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                  {suggestedUsers.map((user: any, index: number) => {
                    const userName =
                      user.name ||
                      user.profile?.firstName + " " + user.profile?.lastName ||
                      "Usuário";
                    const userPhoto =
                      user.profile?.photoUrl ||
                      user.photoUrl ||
                      "/placeholder/userplaceholder.svg";
                    const userHeadline =
                      user.headline ||
                      user.profile?.headline ||
                      "Sem descrição";

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-3"
                      >
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 shrink-0">
                          <AvatarImage src={userPhoto} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm">
                            {userName[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-black truncate">
                            {userName}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-black line-clamp-2 mt-0.5">
                            {userHeadline}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 text-[10px] sm:text-xs h-7 sm:h-8"
                          >
                            + Conectar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição de Perfil */}
      {isOwnProfile && (
        <Dialog
          open={contactModalOpen}
          onOpenChange={(open) => {
            if (!isOwnProfile && open) return; // Prevenir abertura se não for o próprio perfil
            setContactModalOpen(open);
          }}
        >
          <DialogContent
            className="sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            onInteractOutside={(e) => {
              // Prevenir que o Dialog feche quando clicar em um Popover
              const target = e.target as HTMLElement;
              const popover = target.closest("[data-radix-popover-content]");
              if (popover) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Atualize suas informações pessoais e profissionais
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Nome e Sobrenome */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Seu sobrenome"
                  />
                </div>
              </div>

              {/* Apelido (opcional) */}
              <div className="space-y-2">
                <Label htmlFor="nickname">Apelido (opcional)</Label>
                <Input
                  id="nickname"
                  value={profileForm.nickname}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, nickname: e.target.value })
                  }
                  placeholder="Como você gostaria de ser chamado"
                />
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="headline">Título</Label>
                <Textarea
                  id="headline"
                  value={profileForm.headline}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, headline: e.target.value })
                  }
                  placeholder="Descreva sua função ou cargo atual"
                  rows={2}
                />
              </div>

              {/* Setor */}
              <div className="space-y-2">
                <Label htmlFor="sector">Setor</Label>
                <Input
                  id="sector"
                  value={profileForm.sector}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, sector: e.target.value })
                  }
                  placeholder="Ex: Tecnologia da Informação"
                />
              </div>

              {/* Instituição de Ensino */}
              <InstitutionCombobox
                value={profileForm.institution}
                onChange={(value) =>
                  setProfileForm({ ...profileForm, institution: value })
                }
              />

              {/* Localização */}
              <div className="space-y-2">
                <LocationCombobox
                  country={profileForm.country}
                  city={profileForm.city}
                  state={profileForm.state}
                  onCountryChange={handleCountryChange}
                  onStateChange={handleStateChange}
                  onCityChange={handleCityChange}
                />
              </div>

              {/* Adicionar Cargo Atual */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="text-base font-semibold">Cargo Atual</Label>
                  <p className="text-sm text-gray-500">
                    Adicione seu cargo atual
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCurrentJob}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar cargo atual
                </Button>
              </div>

              {/* Cargo Atual */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentTitle">Função</Label>
                    <Input
                      id="currentTitle"
                      value={profileForm.currentTitle}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          currentTitle: e.target.value,
                        })
                      }
                      placeholder="Ex: Desenvolvedor Full Stack"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentCompany">Empresa</Label>
                    <Input
                      id="currentCompany"
                      value={profileForm.currentCompany}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          currentCompany: e.target.value,
                        })
                      }
                      placeholder="Nome da empresa"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="bio">Descrição</Label>
                <Textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, bio: e.target.value })
                  }
                  placeholder="Escreva sobre seu perfil profissional"
                  rows={4}
                />
              </div>

              {/* Adicionar Nova Posição */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="text-base font-semibold">
                    Experiências Profissionais
                  </Label>
                  <p className="text-sm text-gray-500">
                    Adicione suas experiências anteriores
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addNewPosition}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar nova posição
                </Button>
              </div>

              {/* Lista de Experiências */}
              {profileForm.experience.map((exp, index) => (
                <div
                  key={index}
                  className="space-y-4 p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Posição {index + 1}</h4>
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
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) =>
                          updateExperience(index, "title", e.target.value)
                        }
                        placeholder="Ex: Desenvolvedor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) =>
                          updateExperience(index, "company", e.target.value)
                        }
                        placeholder="Nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(index, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
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
                      id={`current-${index}`}
                      checked={exp.current}
                      onChange={(e) =>
                        updateExperience(index, "current", e.target.checked)
                      }
                      className="rounded"
                    />
                    <Label
                      htmlFor={`current-${index}`}
                      className="cursor-pointer"
                    >
                      Trabalho atual
                    </Label>
                  </div>
                  {exp.description !== undefined && (
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={exp.description || ""}
                        onChange={(e) =>
                          updateExperience(index, "description", e.target.value)
                        }
                        placeholder="Descreva suas responsabilidades"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Adicionar Nova Educação */}
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label className="text-base font-semibold">Educação</Label>
                  <p className="text-sm text-gray-500">
                    Adicione suas formações acadêmicas
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEducation}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar educação
                </Button>
              </div>

              {/* Lista de Educação */}
              {profileForm.education.map((edu, index) => (
                <div
                  key={index}
                  className="space-y-4 p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between">
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
                    <div className="space-y-2">
                      <Label>Instituição</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateEducation(index, "institution", e.target.value)
                        }
                        placeholder="Nome da instituição"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Grau</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(index, "degree", e.target.value)
                        }
                        placeholder="Ex: Bacharelado, Mestrado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Área de Estudo</Label>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          updateEducation(index, "fieldOfStudy", e.target.value)
                        }
                        placeholder="Ex: Ciência da Computação"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={edu.startDate}
                        onChange={(e) =>
                          updateEducation(index, "startDate", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
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
                    <Label
                      htmlFor={`edu-current-${index}`}
                      className="cursor-pointer"
                    >
                      Estou estudando aqui
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={edu.description || ""}
                      onChange={(e) =>
                        updateEducation(index, "description", e.target.value)
                      }
                      placeholder="Descreva sua formação"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Seção Site */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Site</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione um link que será exibido na parte superior do seu
                  perfil
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Link</Label>
                <Input
                  id="website"
                  type="url"
                  value={profileForm.website}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, website: e.target.value })
                  }
                  placeholder="https://ramonsantosportfolio.vercel.app"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteLinkText">Texto do link</Label>
                <Input
                  id="websiteLinkText"
                  type="text"
                  value={profileForm.websiteLinkText}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      websiteLinkText: e.target.value,
                    })
                  }
                  placeholder="RamonSantos-Portfólio"
                />
                <p className="text-xs text-gray-500">
                  Personalize como seu link será exibido (opcional).
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setContactModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveContactInfo} disabled={savingContact}>
                {savingContact ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Banner */}
      {isOwnProfile && (
        <BannerModal
          open={bannerModalOpen}
          onOpenChange={(open) => {
            if (!isOwnProfile && open) return;
            setBannerModalOpen(open);
          }}
          currentBannerUrl={profile?.bannerUrl}
          onBannerUpdate={(bannerUrl) => {
            setProfile((prev) => (prev ? { ...prev, bannerUrl } : null));
            // Recarregar perfil para garantir sincronização
            fetch(`/api/profile/public/${slug}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.profile) setProfile(data.profile);
              })
              .catch(console.error);
          }}
        />
      )}

      {/* Modal de Visualização do Banner */}
      <MediaExpansionModal
        isOpen={bannerPreviewOpen}
        onClose={() => setBannerPreviewOpen(false)}
        mediaUrl={profile?.bannerUrl || "/placeholder/personbanner.svg"}
        mediaType="image"
      />

      {/* Modal de Foto de Perfil */}
      {isOwnProfile && (
        <ProfilePhotoModal
          open={photoModalOpen}
          onOpenChange={(open) => {
            if (!isOwnProfile && open) return;
            setPhotoModalOpen(open);
          }}
          currentPhotoUrl={profile?.photoUrl}
          onPhotoUpdate={async (photoUrl) => {
            try {
              const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ photoUrl }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Erro ao atualizar foto");
              }

              setProfile((prev) => (prev ? { ...prev, photoUrl } : null));
              // Disparar evento customizado para atualizar foto em outros componentes
              window.dispatchEvent(new CustomEvent("profilePhotoUpdated"));
              // Recarregar perfil para garantir sincronização
              fetch(`/api/profile/public/${slug}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.profile) setProfile(data.profile);
                })
                .catch(console.error);
            } catch (error: any) {
              toast.error("Erro", {
                description: error.message || "Erro ao atualizar foto",
              });
            }
          }}
          onPhotoDelete={async () => {
            try {
              const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ photoUrl: "" }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Erro ao excluir foto");
              }

              setProfile((prev) => (prev ? { ...prev, photoUrl: "" } : null));
              // Disparar evento customizado para atualizar foto em outros componentes
              window.dispatchEvent(new CustomEvent("profilePhotoUpdated"));
              // Recarregar perfil para garantir sincronização
              fetch(`/api/profile/public/${slug}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.profile) setProfile(data.profile);
                })
                .catch(console.error);
            } catch (error: any) {
              toast.error("Erro", {
                description: error.message || "Erro ao excluir foto",
              });
            }
          }}
        />
      )}
    </div>
  );
}
