"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Shield,
  Eye,
  Lock,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SettingsItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const settingsItems: SettingsItem[] = [
  {
    id: "account-preferences",
    label: "Preferências da conta",
    icon: <User className="h-4 w-4" />,
    href: "/settings/config/account-preferences",
  },
  {
    id: "access-security",
    label: "Acesso e segurança",
    icon: <Shield className="h-4 w-4" />,
    href: "/settings/config/access-security",
  },
  {
    id: "visibility",
    label: "Visibilidade",
    icon: <Eye className="h-4 w-4" />,
    href: "/settings/config/visibility",
  },
  {
    id: "data-privacy",
    label: "Privacidade dos dados",
    icon: <Lock className="h-4 w-4" />,
    href: "/settings/config/data-privacy",
  },
  {
    id: "advertising-data",
    label: "Dados de publicidade",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/settings/config/advertising-data",
  },
  {
    id: "notifications",
    label: "Notificações",
    icon: <Bell className="h-4 w-4" />,
    href: "/settings/config/notifications",
  },
];

export default function AccessSecurityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const activeSection = "access-security";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-64 shrink-0">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {settingsItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <Link key={item.id} href={item.href}>
                          <button
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-none",
                              isActive
                                ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            {/* Content Area */}
            <main className="flex-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Acesso e segurança
                  </CardTitle>
                  <CardDescription>
                    Gerencie o acesso e a segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="py-8 text-center text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p className="text-lg font-medium text-gray-900">
                        Verificação de conta
                      </p>
                      <p className="text-sm mt-2">
                        Complete a verificação da sua conta para aumentar a
                        segurança e confiabilidade.
                      </p>
                      <Button className="mt-4" variant="outline">
                        Iniciar verificação
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

