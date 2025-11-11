"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Building2, User } from "lucide-react";

export default function AcceptInvitePage() {
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<{
    companyName: string;
    role: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de convite não fornecido");
      setLoading(false);
      return;
    }

    // Se não está logado, redirecionar para registro com token
    if (status === "unauthenticated") {
      router.push(`/auth/register?token=${token}`);
      return;
    }

    // Se está logado, verificar o convite
    if (status === "authenticated") {
      verifyInvite();
    }
  }, [token, status]);

  const verifyInvite = async () => {
    try {
      const response = await fetch(`/api/invite/verify?token=${token}`);
      const data = await response.json();

      if (data.valid) {
        setInviteData({
          companyName: data.companyName,
          role: data.role,
          email: data.email,
        });
      } else {
        setError(data.error || "Convite inválido");
      }
    } catch (error) {
      console.error("Erro ao verificar convite:", error);
      setError("Erro ao verificar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);

    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Convite aceito com sucesso!");

        // Redirecionar para página da empresa
        setTimeout(() => {
          router.push(`/company/${data.companyId}`);
        }, 1500);
      } else {
        toast.error(data.error || "Erro ao aceitar convite");
      }
    } catch (error) {
      toast.error("Erro ao aceitar convite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <section className="flex min-h-screen bg-zinc-50 items-center justify-center px-4 dark:bg-transparent">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Verificando convite...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-screen bg-zinc-50 items-center justify-center px-4 dark:bg-transparent">
        <div className="bg-card w-full max-w-md rounded-lg border p-8 shadow-md text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Convite Inválido</h1>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Voltar para página inicial</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen bg-zinc-50 items-center justify-center px-4 py-16 dark:bg-transparent">
      <div className="bg-card w-full max-w-md rounded-lg border p-8 shadow-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-semibold mb-2">Convite para Empresa</h1>
          <p className="text-sm text-gray-600 mb-6">
            Você foi convidado para fazer parte de uma empresa
          </p>
        </div>

        {inviteData && (
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p className="text-lg font-semibold">
                    {inviteData.companyName}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Função</p>
                  <p className="text-lg font-semibold">
                    {inviteData.role === "admin"
                      ? "Administrador"
                      : "Recrutador"}
                  </p>
                </div>
              </div>
            </div>

            {session?.user?.email && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Seu email
                    </p>
                    <p className="text-sm">{session.user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full"
          >
            {accepting ? "Aceitando..." : "Aceitar Convite"}
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">Recusar e voltar</Link>
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          Ao aceitar, você será adicionado à empresa e poderá começar a
          trabalhar imediatamente.
        </p>
      </div>

    </section>
  );
}

