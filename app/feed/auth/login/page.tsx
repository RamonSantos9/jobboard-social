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
      const checkResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const checkData = await checkResponse.json();

      // Se houver erro na verificação, exibir mensagem detalhada e não prosseguir
      if (!checkResponse.ok || checkData.error) {
        toast.error(checkData.message || "Erro ao fazer login", {
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // Se as credenciais são válidas, prosseguir com o NextAuth para criar a sessão
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Se houver erro no NextAuth após verificação bem-sucedida, é um erro interno
        toast.error("Erro ao processar autenticação. Tente novamente.", {
          duration: 5000,
        });
      } else if (result?.ok) {
        toast.success("Login realizado com sucesso!", {
          duration: 3000,
        });
        // Redirecionar para callbackUrl se existir, senão para /feed
        const callbackUrl = searchParams.get("callbackUrl") || "/feed";
        router.push(callbackUrl);
      }
    } catch (error: any) {
      console.error("Login error:", error);
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
