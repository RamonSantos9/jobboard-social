"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Primeiro, verificar credenciais com nossa API route para obter mensagens de erro detalhadas
      let checkData;
      try {
        const checkResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        // Verificar se a resposta é JSON válido
        const contentType = checkResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          checkData = await checkResponse.json();
        } else {
          const textData = await checkResponse.text();
          console.error("Resposta não é JSON:", textData);
          throw new Error("Resposta inválida do servidor");
        }

        // Se houver erro na verificação, exibir mensagem detalhada e não prosseguir
        if (!checkResponse.ok || checkData.error) {
          const errorMessage = checkData.message || checkData.error || "Erro ao fazer login";
          console.error("Erro na verificação de credenciais:", checkData);
          toast.error(errorMessage, {
            duration: 5000,
          });
          setLoading(false);
          return;
        }
      } catch (fetchError: any) {
        console.error("Erro ao verificar credenciais:", fetchError);
        toast.error("Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.", {
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Se as credenciais são válidas, prosseguir com o NextAuth para criar a sessão
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (!result) {
          console.error("signIn retornou null/undefined");
          toast.error("Não foi possível fazer login. Tente novamente.", {
            duration: 5000,
          });
          setLoading(false);
          return;
        }

        if (result.error) {
          // Mapear erros do NextAuth para mensagens amigáveis
          let errorMessage = "Erro ao processar autenticação. Tente novamente.";
          
          switch (result.error) {
            case "EMAIL_PASSWORD_REQUIRED":
              errorMessage = "Por favor, preencha email e senha.";
              break;
            case "ACCOUNT_INACTIVE":
              errorMessage = "Sua conta está inativa. Entre em contato com o suporte.";
              break;
            case "ACCOUNT_SUSPENDED":
              errorMessage = "Sua conta foi suspensa. Entre em contato com o suporte.";
              break;
            case "ACCOUNT_PENDING":
              errorMessage = "Sua conta está pendente de aprovação.";
              break;
            case "INVALID_PASSWORD":
              errorMessage = "Senha incorreta. Tente novamente ou recupere sua senha.";
              break;
            case "EMAIL_NOT_FOUND":
              errorMessage = "Email não encontrado. Verifique se o email está correto ou crie uma conta.";
              break;
            case "DATABASE_CONNECTION_ERROR":
              errorMessage = "Erro de conexão com o servidor. Tente novamente mais tarde.";
              break;
            case "AUTH_ERROR":
              errorMessage = "Erro ao processar autenticação. Tente novamente mais tarde.";
              break;
            case "CredentialsSignin":
              errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
              break;
            default:
              console.error("Erro desconhecido do NextAuth:", result.error);
              errorMessage = `Não foi possível fazer login: ${result.error}`;
          }
          
          toast.error(errorMessage, {
            duration: 5000,
          });
        } else if (result.ok) {
          toast.success("Login realizado com sucesso!", {
            duration: 3000,
          });
          // Redirecionar para callbackUrl se existir, senão para /feed
          const callbackUrl = searchParams.get("callbackUrl") || "/feed";
          router.push(callbackUrl);
        } else {
          console.error("Resultado inesperado do signIn:", result);
          toast.error("Não foi possível fazer login. Tente novamente.", {
            duration: 5000,
          });
        }
      } catch (signInError: any) {
        console.error("Erro no signIn:", signInError);
        toast.error("Erro ao processar autenticação. Tente novamente mais tarde.", {
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Erro geral no login:", error);
      toast.error("Erro ao fazer login. Tente novamente mais tarde.", {
        duration: 5000,
      });
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
              Entrar no JobBoard
            </h1>
            <p className="text-sm">Bem-vindo de volta! Entre para continuar</p>
          </div>

          <hr className="my-4 border-dashed" />

          <div className="space-y-6">
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
                autoComplete="email"
              />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">
                  Senha
                </Label>
                <Button asChild variant="link" size="sm">
                  <Link
                    href="/feed/auth/forgot-password"
                    className="link intent-info variant-ghost text-sm"
                  >
                    Esqueceu a senha?
                  </Link>
                </Button>
              </div>
              <PasswordInput
                required
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input sz-md variant-mixed"
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-(--radius) border p-3">
          <p className="text-black text-center text-sm">
            Não tem uma conta?{" "}
            <Button asChild variant="link" className="px-2">
              <Link href="/feed/auth/register">Criar conta</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <section className="flex min-h-screen px-4 py-16 md:py-32">
        <div className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-8 shadow-md">
          <div className="flex items-center justify-center">
            <p>Carregando...</p>
          </div>
        </div>
      </section>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
