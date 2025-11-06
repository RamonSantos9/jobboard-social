"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
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

  const { toasts, toast, removeToast } = useToast();

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
          router.push("/auth/login");
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">in</span>
              </div>
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

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" disabled>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="0.98em"
                height="1em"
                viewBox="0 0 256 262"
              >
                <path
                  fill="#4285f4"
                  d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                ></path>
                <path
                  fill="#34a853"
                  d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                ></path>
                <path
                  fill="#fbbc05"
                  d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                ></path>
                <path
                  fill="#eb4335"
                  d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                ></path>
              </svg>
              <span>Google</span>
            </Button>
            <Button type="button" variant="outline" disabled>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 256 256"
              >
                <path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"></path>
                <path fill="#80cc28" d="M256 121.666H134.335V0H256z"></path>
                <path
                  fill="#00adef"
                  d="M121.663 256.002H0V134.336h121.663z"
                ></path>
                <path
                  fill="#fbbc09"
                  d="M256 256.002H134.335V134.336H256z"
                ></path>
              </svg>
              <span>Microsoft</span>
            </Button>
          </div>

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
                placeholder="João Silva"
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
              <Link href="/auth/login">Fazer login</Link>
            </Button>
          </p>
        </div>
      </form>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </section>
  );
}
