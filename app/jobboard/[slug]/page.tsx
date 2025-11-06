"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CheckCircle,
  MapPin,
  ExternalLink,
  Plus,
  Edit3,
  Star,
  Users,
  Eye,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  Globe,
  Mail,
  Phone,
  Link2,
  Building2,
  BriefcaseIcon,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import EditProfileModal from "@/components/EditProfileModal";

interface PublicProfile {
  _id: string;
  userId: { _id: string; name: string; email: string };
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
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
}

export default function PublicProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const isOwnProfile = profile?.userId?._id === session?.user?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/public/${slug}`);
        const data = await response.json();

        if (response.ok) {
          setProfile(data.profile);
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

  const handleProfileUpdated = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Perfil não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "O perfil que você está procurando não existe."}
          </p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const skillsDisplay = profile.skills?.slice(0, 5).join(" | ") || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto">
        {/* Banner Azul Grande */}
        <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 h-64">
          {/* Ícone de câmera para editar banner (apenas para próprio perfil) */}
          {isOwnProfile && (
            <button className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition">
              <Camera className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Foto de Perfil Circular Sobrepondo */}
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="relative">
              <Avatar className="w-40 h-40 border-4 border-white shadow-lg">
                <AvatarImage
                  src={profile.photoUrl || "/placeholder-avatar.svg"}
                />
                <AvatarFallback className="text-4xl">
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Informações do Perfil */}
        <div className="bg-white border-b border-gray-200 pb-6">
          <div className="pl-8 pt-20 pr-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {fullName}
                  </h1>
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Adicionar selo de verificação
                    </Button>
                  )}
                </div>

                {/* Cargo Atual e Skills */}
                <div className="mb-4">
                  {profile.currentTitle && profile.currentCompany && (
                    <p className="text-gray-700 mb-1">
                      {profile.currentTitle} na {profile.currentCompany}
                    </p>
                  )}
                  {skillsDisplay && (
                    <p className="text-gray-600 text-sm">
                      {skillsDisplay}
                    </p>
                  )}
                </div>

                {/* Localização e Contato */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  {profile.location && (
                    <>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                      <span>•</span>
                    </>
                  )}
                  <span>Informações de contato</span>
                  {profile.contactInfo?.website && (
                    <>
                      <span>•</span>
                      <a
                        href={profile.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <span>{profile.contactInfo.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>

                {/* Conexões */}
                <div className="text-sm text-gray-600">
                  <span>{profile.connections || 0} conexões</span>
                </div>
              </div>

              {/* Ícone de Editar (apenas para próprio perfil) */}
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="p-2"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          {isOwnProfile && (
            <div className="px-8 mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                Tenho interesse em...
              </Button>
              <Button variant="outline" size="sm">
                Adicionar seção ao perfil
              </Button>
              <Button variant="outline" size="sm">
                Aprimorar perfil
              </Button>
              <Button variant="outline" size="sm">
                Recursos
              </Button>
            </div>
          )}
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Buscando Emprego (apenas para próprio perfil) */}
            {isOwnProfile && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Buscando emprego</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(true)}
                    className="p-1 h-auto"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">
                    Cargos de Desenvolvedor de front-end, Desenvolvedor web e Web
                    designer gráfico
                  </p>
                  <Button variant="link" className="p-0 h-auto">
                    Exibir detalhes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Sobre */}
            {profile.bio && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Sobre</CardTitle>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModalOpen(true)}
                      className="p-1 h-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Experiência */}
            {profile.experience && profile.experience.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Experiência
                  </CardTitle>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModalOpen(true)}
                      className="p-1 h-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {exp.title}
                      </h3>
                      <p className="text-gray-700">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString("pt-BR", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        -{" "}
                        {exp.current
                          ? "Presente"
                          : new Date(exp.endDate!).toLocaleDateString("pt-BR", {
                              month: "short",
                              year: "numeric",
                            })}
                      </p>
                      {exp.description && (
                        <p className="text-gray-700 mt-2 whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Educação */}
            {profile.education && profile.education.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Educação
                  </CardTitle>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModalOpen(true)}
                      className="p-1 h-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {edu.degree}
                      </h3>
                      <p className="text-gray-700">{edu.institution}</p>
                      <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(edu.startDate).toLocaleDateString("pt-BR", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        -{" "}
                        {edu.current
                          ? "Presente"
                          : new Date(edu.endDate!).toLocaleDateString("pt-BR", {
                              month: "short",
                              year: "numeric",
                            })}
                      </p>
                      {edu.description && (
                        <p className="text-gray-700 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Competências */}
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Competências
                  </CardTitle>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditModalOpen(true)}
                      className="p-1 h-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sugestões para você (apenas para próprio perfil) */}
            {isOwnProfile && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">Sugestões para você</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Exibido apenas a você
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded">
                      <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">
                        Adicione projetos Github que destaquem suas competências
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Adicione projetos ao seu perfil para demonstrar aos
                        recrutadores como você usa suas competências.
                      </p>
                      <Button size="sm">Adicionar projeto</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Direita */}
          <div className="space-y-4">
            {/* Idioma do Perfil */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Idioma do perfil</CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">Português</p>
              </CardContent>
            </Card>

            {/* Perfil Público e URL */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Perfil público e URL</CardTitle>
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 break-all">
                  www.jobboard.com/in/{profile.slug}
                </p>
              </CardContent>
            </Card>

            {/* Quem seus visitantes também viram */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Quem seus visitantes também viram
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Exibido apenas a você
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/placeholder-avatar.svg" />
                      <AvatarFallback>IF</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Íris F.</p>
                      <p className="text-xs text-gray-500">
                        3º e + conexão
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        Gestão de TI | Especialista em Segurança da
                        Informação
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    + Seguir
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pessoas que talvez você conheça */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Pessoas que talvez você conheça
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/placeholder-avatar.svg" />
                          <AvatarFallback>U{i}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Usuário {i}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            Desenvolvedor de soluções...
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        + Conectar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {isOwnProfile && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}