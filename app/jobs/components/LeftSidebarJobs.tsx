"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Bookmark, BarChart3, Edit } from "lucide-react";
import LinkedInIcon from "@/components/LinkedInIcon";
import Link from "next/link";

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  current: boolean;
}

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  bannerUrl?: string;
  headline?: string;
  location?: string;
  education?: Education[];
  currentCompany?: string;
  currentTitle?: string;
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

  // Encontrar educação atual
  const currentEducation = profile?.education?.find((edu) => edu.current);

  if (loading)
    return (
      <aside className="w-full h-full bg-white p-4">
        <div className="animate-pulse space-y-3">
          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto" />
          <div className="h-3 w-24 bg-gray-200 mx-auto rounded" />
          <div className="h-2 w-20 bg-gray-200 mx-auto rounded" />
        </div>
      </aside>
    );

  return (
    <aside className="w-full bg-[#f3f2ef]">
      {/* Card de Perfil */}
      <Card className="rounded-lg overflow-hidden mb-3 border">
        <div
          className="h-12 w-full bg-cover bg-center"
          style={{
            backgroundImage: profile?.bannerUrl
              ? `url(${profile.bannerUrl})`
              : `url(/placeholder/personbanner.svg)`,
          }}
        />
        <CardContent className="pt-0 flex flex-col items-start -mt-8 pb-4 px-4">
          <Link
            href={profile?.slug ? `/jobboard/${profile.slug}` : "#"}
            className="flex flex-col items-start w-full"
          >
            <Avatar className="w-16 h-16 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity">
              <AvatarImage
                src={profile?.photoUrl || "/placeholder/userplaceholder.svg"}
                alt="Profile"
              />
              <AvatarFallback>
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <h3 className="mt-3 text-sm font-semibold text-black cursor-pointer hover:underline">
              {profile?.firstName} {profile?.lastName}
            </h3>
          </Link>

          <p className="text-xs text-black mt-1">
            {profile?.headline ||
              "Análise e Desenvolvimento de Sistemas | React | Next.js"}
          </p>

          <p className="text-xs text-black mt-1 font-light">
            {profile?.location || "Cunha, São Paulo"}
          </p>

          {profile?.currentCompany && profile.currentCompany.trim() !== "" && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-black">
              <LinkedInIcon
                id="company-accent-4"
                size={16}
                className="shrink-0"
              />
              <span>{profile.currentCompany}</span>
            </div>
          )}

          {(!profile?.currentCompany || profile.currentCompany.trim() === "") &&
            currentEducation &&
            currentEducation.institution && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-black">
                <LinkedInIcon
                  id="company-accent-4"
                  size={16}
                  className="shrink-0"
                />
                <span>{currentEducation.institution}</span>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Card de Ações - Oculto no mobile */}
      <Card className="hidden lg:block rounded-lg overflow-hidden mb-3 border">
        <CardContent className="p-0">
          <ul className="flex flex-col">
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-black"
              >
                <Briefcase className="w-4 h-4 mr-2 text-black" />
                Preferências
              </Link>
            </li>
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-black"
              >
                <Bookmark className="w-4 h-4 mr-2 text-black" />
                Minhas vagas
              </Link>
            </li>
            <li className="hover:bg-gray-100 transition-colors cursor-pointer">
              <Link
                href="#"
                className="flex items-center px-4 py-3 text-sm text-black"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-black" />
                Minhas estatísticas
              </Link>
            </li>
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

      {/* Rodapé - Oculto no mobile */}
      <div className="hidden lg:block text-[11px] text-black/60 leading-relaxed mt-6 space-y-1">
        <p>Sobre • Acessibilidade • Central de Ajuda</p>
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
