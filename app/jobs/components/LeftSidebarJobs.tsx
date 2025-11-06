"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Bookmark, BarChart3, Edit } from "lucide-react";
import Link from "next/link";

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  headline?: string;
  location?: string;
  university?: string;
}

export default function LeftSidebarJobs() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (response.ok) setProfile(data.profile);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [session]);

  if (loading)
    return (
      <aside className="top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto p-4">
        <div className="animate-pulse space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto" />
          <div className="h-3 w-24 bg-gray-200 mx-auto rounded" />
          <div className="h-2 w-20 bg-gray-200 mx-auto rounded" />
        </div>
      </aside>
    );

  return (
    <aside className="top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-[#f3f2ef] border-r border-gray-200 overflow-y-auto px-3 py-5">
      {/* Card de Perfil */}
      <Card className="rounded-lg overflow-hidden mb-3 shadow-sm border border-gray-200">
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-12 w-full" />
        <CardContent className="pt-0 flex flex-col items-center -mt-8 pb-4">
          <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
            <AvatarImage
              src={profile?.photoUrl || "/placeholder-avatar.svg"}
              alt="Profile"
            />
            <AvatarFallback>
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            {profile?.firstName} {profile?.lastName}
          </h3>

          <p className="text-xs text-gray-600 text-center px-2 mt-1 leading-tight">
            {profile?.headline ||
              "Análise e Desenvolvimento de Sistemas | React | Next.js"}
          </p>

          <p className="text-[11px] text-gray-500 mt-1">
            {profile?.location || "Cunha, São Paulo"}
          </p>

          {profile?.university && (
            <p className="text-[11px] text-blue-700 mt-1 text-center">
              {profile.university}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card de Ações */}
      <Card className="rounded-lg overflow-hidden mb-3 shadow-sm border border-gray-200">
        <CardContent className="p-0">
          <ul className="flex flex-col">
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-gray-700"
              >
                <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                Preferências
              </Link>
            </li>
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-gray-700"
              >
                <Bookmark className="w-4 h-4 mr-2 text-gray-500" />
                Minhas vagas
              </Link>
            </li>
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-gray-700"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                Minhas estatísticas
              </Link>
            </li>
            <Separator className="my-1" />
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-blue-600 font-medium"
              >
                <Edit className="w-4 h-4 mr-2 text-blue-600" />
                Anunciar vaga de graça
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Rodapé */}
      <div className="text-[11px] text-gray-500 leading-relaxed mt-6 space-y-1">
        <p>Sob re • Acessibilidade • Central de Ajuda</p>
        <p>Termos e Privacidade • Preferências de anúncios</p>
        <p>Publicidade • Serviços empresariais</p>
        <p>Baixe o aplicativo do JobBoard</p>
        <p className="mt-3 text-blue-700 font-medium">
          JobBoard © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
