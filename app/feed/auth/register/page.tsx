"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AlertCircle } from "lucide-react";
import LogoIcon from "@/components/LogoIcon";

function RegisterPageContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    companyName: string;
    role: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  // Verificar token de convite se presente
  useEffect(() => {
    if (token) {
      verifyInviteToken(token);
    }
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [token, emailParam]);

  const verifyInviteToken = async (inviteToken: string) => {
    try {
      const response = await fetch(`/api/invite/verify?token=${inviteToken}`);
      const data = await response.json();

      if (data.valid && !data.expired) {
        setInviteInfo({
          companyName: data.companyName,
          role: data.role,
        });
        setEmail(data.email);
      } else if (data.expired) {
        toast.error("Este convite expirou");
      }
    } catch (error) {
      console.error("Erro ao verificar convite:", error);
      toast.error("Erro ao verificar convite");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          token: token || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Cadastro realizado com sucesso!");

        // Fazer login automaticamente
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          // Se tinha convite, redirecionar para a empresa
          if (data.companyId) {
            router.push(`/company/${data.companyId}`);
          } else {
            router.push("/");
          }
        } else {
          router.push("/feed/auth/login");
        }
      } else {
        toast.error(data.error || "Erro ao criar conta");
      }
    } catch (error) {
      toast.error("Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen px-4 py-16 md:py-32">
      <form
        onSubmit={handleSubmit}
        className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md"
      >
        <div className="p-8 pb-6">
          <div>
            <Link href="/" aria-label="ir para home">
              <LogoIcon size="default" color="black" strokeWidth={300} />
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              {inviteInfo
                ? `Junte-se a ${inviteInfo.companyName}`
                : "Criar Conta"}
            </h1>
            <p className="text-sm">
              {inviteInfo
                ? `Você foi convidado como ${
                    inviteInfo.role === "admin" ? "administrador" : "recrutador"
                  }`
                : "Crie sua conta e encontre oportunidades incríveis"}
            </p>
          </div>

          {inviteInfo && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  Convite para {inviteInfo.companyName}
                </p>
                <p className="text-xs mt-1">
                  Complete seu cadastro para aceitar o convite
                </p>
              </div>
            </div>
          )}

          <hr className="my-4 border-dashed" />

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="block text-sm">
                Nome Completo
              </Label>
              <Input
                type="text"
                required
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu Nome"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                readOnly={!!inviteInfo}
                className={inviteInfo ? "bg-gray-100 cursor-not-allowed" : ""}
                autoComplete="email"
              />
              {inviteInfo && (
                <p className="text-xs text-gray-500">
                  Email do convite (não pode ser alterado)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Senha
              </Label>
              <PasswordInput
                required
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input sz-md variant-mixed"
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Criando conta..."
                : inviteInfo
                ? "Aceitar Convite e Criar Conta"
                : "Criar conta"}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-(--radius) border p-3">
          <p className="text-black text-center text-sm">
            Já tem uma conta?{" "}
            <Button asChild variant="link" className="px-2">
              <Link href="/feed/auth/login">Fazer login</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-screen px-4 py-16 md:py-32">
          <div className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-8 shadow-md">
            <div className="flex items-center justify-center">
              <p>Carregando...</p>
            </div>
          </div>
        </section>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
