"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AuthGuard from "@/components/AuthGuard";
import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  ArrowLeft,
  UserPlus,
  Mail,
} from "lucide-react";

interface Company {
  _id: string;
  name: string;
}

interface Invite {
  _id: string;
  email: string;
  role: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
}

export default function CompanyInvitePage({
  params,
}: {
  params: { id: string };
}) {
  const [company, setCompany] = useState<Company | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "recruiter",
  });

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, params.id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/company/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setCompany(data.company);
        setInvites(data.invites || []);
      } else {
        toast.error(data.error || "Erro ao carregar dados");
        router.push(`/company/${params.id}`);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
      router.push(`/company/${params.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch("/api/company/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.type === "notification") {
          toast.success(
            `Notificação enviada para ${data.message.split(" ").pop()}`
          );
        } else {
          toast.success(`Email enviado para ${formData.email}`);
        }

        // Limpar formulário e recarregar dados
        setFormData({ email: "", role: "recruiter" });
        fetchData();
      } else {
        toast.error(data.error || "Erro ao enviar convite");
      }
    } catch (error) {
      toast.error("Erro ao enviar convite");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isInviteExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getStatusBadge = (invite: Invite) => {
    if (invite.used) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Aceito
        </Badge>
      );
    } else if (isInviteExpired(invite.expiresAt)) {
      return (
        <Badge className="bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      );
    }
  };

  if (loading) {
    return <div></div>;
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Empresa não encontrada
          </h1>
          <Button asChild>
            <Link href="/">Voltar para página inicial</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} requireAdmin={true} companyId={params.id}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/company/${params.id}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para {company.name}
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Convidar Membros
                </h1>
                <p className="text-gray-600">
                  Adicione novos recrutadores à {company.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Enviar Convite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do convidado</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="exemplo@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recruiter">Recrutador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={sending} className="w-full">
                    {sending ? "Enviando..." : "Enviar Convite"}
                  </Button>
                </form>

                {/* Info */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Como funciona?
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Se o email já tem conta: notificação interna</li>
                    <li>• Se o email é novo: email com link de cadastro</li>
                    <li>• Convites expiram em 7 dias</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Invites List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Convites Enviados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum convite enviado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invites.map((invite) => (
                      <div
                        key={invite._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{invite.email}</p>
                          <p className="text-xs text-gray-500">
                            {invite.role === "admin"
                              ? "Administrador"
                              : "Recrutador"}{" "}
                            • Enviado em {formatDate(invite.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(invite)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
