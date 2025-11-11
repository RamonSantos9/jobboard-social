"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  companyId?: string;
  fallback?: React.ReactNode;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  companyId,
  fallback,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (status === "loading") return;

      // Se não requer autenticação, permitir acesso
      if (!requireAuth) {
        setIsAuthorized(true);
        setLoading(false);
        return;
      }

      // Se requer autenticação mas não está logado
      if (!session) {
        router.push("/feed/auth/login");
        return;
      }

      // Se requer admin, verificar se é admin da empresa
      if (requireAdmin && companyId) {
        try {
          const response = await fetch(`/api/company/${companyId}`);
          const data = await response.json();

          if (response.ok) {
            const isAdmin = data.company.admins.some(
              (admin: any) => admin._id === session.user?.id
            );

            if (!isAdmin) {
              router.push(`/company/${companyId}`);
              return;
            }
          } else {
            router.push("/");
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar autorização:", error);
          router.push("/");
          return;
        }
      }

      setIsAuthorized(true);
      setLoading(false);
    };

    checkAuthorization();
  }, [session, status, requireAuth, requireAdmin, companyId, router]);

  if (status === "loading" || loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando autorização...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
