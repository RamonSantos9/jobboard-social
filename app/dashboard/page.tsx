"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingWrapper from "@/components/LoadingWrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <LoadingWrapper duration={2000}>
        <div></div>
      </LoadingWrapper>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                JobBoard Social
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {session.user?.email}</span>
              <Button
                variant="outline"
                onClick={() => router.push("/api/auth/signout")}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Feed</CardTitle>
                <CardDescription>
                  Veja as últimas atualizações da sua rede
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-600">
                      Nenhum post ainda. Seja o primeiro a compartilhar algo!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/jobs/create">Postar Vaga</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile/edit">Editar Perfil</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/jobs">Ver Vagas</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Suas Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conexões:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vagas Visualizadas:</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Candidaturas:</span>
                    <span className="font-semibold">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
