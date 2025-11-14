"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoIcon from "@/components/LogoIcon";

function ForgotPasswordPageContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast.error(data.message || "Erro ao solicitar redefinição de senha", {
          duration: 5000,
        });
      } else {
        toast.success(
          "Email de redefinição de senha enviado! Verifique sua caixa de entrada.",
          {
            duration: 5000,
          }
        );
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          router.push("/feed/auth/login");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(
        "Erro ao solicitar redefinição de senha. Tente novamente mais tarde.",
        {
          duration: 5000,
        }
      );
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
            <h1 className="mb-1 mt-4 text-xl font-semibold">Redefinir Senha</h1>
            <p className="text-sm">
              Digite seu email para receber instruções de redefinição de senha
            </p>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-(--radius) border p-3">
          <p className="text-black text-center text-sm">
            Lembrou sua senha?{" "}
            <Button asChild variant="link" className="px-2">
              <Link href="/feed/auth/login">Voltar ao login</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
