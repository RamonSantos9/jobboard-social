"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Building2,
  Users,
  MapPin,
  Calendar,
  UserPlus,
  Settings,
  Briefcase,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Company {
  _id: string;
  name: string;
  cnpj: string;
  industry: string;
  description: string;
  size: string;
  location: string;
  logoUrl?: string;
  bannerUrl?: string;
  followersCount: number;
  jobsCount: number;
  isVerified: boolean;
  admins: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  recruiters: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
}

interface Invite {
  _id: string;
  email: string;
  role: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function CompanyPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchCompanyData();
    }
  }, [session, params.id]);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch(`/api/company/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setCompany(data.company);
        setInvites(data.invites || []);

        // Verificar se usuário é admin
        const userIsAdmin = data.company.admins.some(
          (admin: any) => admin._id === session?.user?.id
        );
        setIsAdmin(userIsAdmin);
      } else {
        toast.error(data.error || "Erro ao carregar empresa");
      }
    } catch (error) {
      toast.error("Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  };

  const getSizeLabel = (size: string) => {
    const labels = {
      startup: "Startup (1-10 funcionários)",
      small: "Pequena (11-50 funcionários)",
      medium: "Média (51-200 funcionários)",
      large: "Grande (201-1000 funcionários)",
      enterprise: "Empresa (1000+ funcionários)",
    };
    return labels[size as keyof typeof labels] || size;
  };

  const getIndustryLabel = (industry: string) => {
    const labels = {
      technology: "Tecnologia",
      finance: "Finanças",
      healthcare: "Saúde",
      education: "Educação",
      retail: "Varejo",
      manufacturing: "Manufatura",
      consulting: "Consultoria",
      other: "Outro",
    };
    return labels[industry as keyof typeof labels] || industry;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const isInviteExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Carregando empresa...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Empresa não encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            A empresa que você está procurando não existe ou foi removida.
          </p>
          <Button asChild>
            <Link href="/">Voltar para página inicial</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800 relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-6">
          <div className="flex items-end gap-6">
            <div className="w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-blue-100 mt-1">
                {getIndustryLabel(company.industry)}
              </p>
              {company.isVerified && (
                <Badge className="mt-2 bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificada
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{company.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{getSizeLabel(company.size)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Criada em {formatDate(company.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    {company.jobsCount} vagas publicadas
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Team Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Equipe
                  </span>
                  {isAdmin && (
                    <Button size="sm" asChild>
                      <Link href={`/company/${params.id}/invite`}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Convidar
                      </Link>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Administradores
                  </h4>
                  <div className="space-y-2">
                    {company.admins.map((admin) => (
                      <div key={admin._id} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {admin.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{admin.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Recrutadores
                  </h4>
                  <div className="space-y-2">
                    {company.recruiters.map((recruiter) => (
                      <div
                        key={recruiter._id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {recruiter.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{recruiter.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invites Card (Admin only) */}
            {isAdmin && invites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Convites Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite._id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-gray-500">
                          {invite.role === "admin"
                            ? "Administrador"
                            : "Recrutador"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {invite.used ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : isInviteExpired(invite.expiresAt) ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre a Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {company.description}
                </p>
              </CardContent>
            </Card>

            {/* Actions (Admin only) */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Ações Administrativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild className="h-12">
                      <Link href={`/company/${params.id}/invite`}>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Convidar Recrutador
                      </Link>
                    </Button>

                    <Button variant="outline" className="h-12">
                      <Briefcase className="w-5 h-5 mr-2" />
                      Gerenciar Vagas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

