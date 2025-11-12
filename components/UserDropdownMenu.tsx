"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Diamond, HelpCircle, Globe, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  headline?: string;
}

interface UserDropdownMenuProps {
  profile: Profile | null;
}

export default function UserDropdownMenu({ profile }: UserDropdownMenuProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleViewProfile = () => {
    if (profile?.slug) {
      router.push(`/jobboard/${profile.slug}`);
    }
  };

  const handleVerification = () => {
    router.push("/settings/config/access-security");
  };

  const handleSettings = () => {
    router.push("/settings/config");
  };

  const handleActivities = () => {
    router.push("/settings/activities");
  };

  const handleJobAccount = () => {
    router.push("/settings/job-account");
  };

  const handleHelp = () => {
    router.push("/settings/config");
  };

  const handleLanguage = () => {
    router.push("/settings/config");
  };

  const handleSignOut = () => {
    signOut();
  };

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : session?.user?.name || "Usuário";

  return (
    <DropdownMenuContent align="end" className="w-80 p-0">
      {/* Header: Profile Info */}
      <div className="p-4 border-b">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 border rounded-full shrink-0">
            <AvatarImage
              src={profile?.photoUrl || "/placeholder/userplaceholder.svg"}
            />
            <AvatarFallback className="text-sm">
              {profile?.firstName?.[0]}
              {profile?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-black truncate">
              {fullName}
            </h3>
            {profile?.headline && (
              <p className="text-xs text-black/80 mt-1 line-clamp-2">
                {profile.headline}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProfile}
            className="flex-1 border-black text-black hover:bg-black/5 hover:text-black rounded-xl px-4 py-5"
          >
            Ver perfil
          </Button>
          <Button
            size="sm"
            onClick={handleVerification}
            className="flex-1 bg-black text-white hover:bg-black/90 rounded-xl px-4 py-5"
          >
            Fazer verificação
          </Button>
        </div>
      </div>

      {/* Seção: Conta */}
      <div className="py-2">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold text-black uppercase tracking-wide">
            Conta
          </h4>
        </div>
        <DropdownMenuItem
          className="flex items-center gap-3 px-4 cursor-pointer hover:underline"
          asChild
        ></DropdownMenuItem>
        <DropdownMenuItem
          className="px-4 cursor-pointer hover:underline"
          onClick={handleSettings}
        >
          <span className="text-sm text-black">
            Configurações e privacidade
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-4 cursor-pointer hover:underline"
          onClick={handleHelp}
        >
          <span className="text-sm text-black">Ajuda</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-4 cursor-pointer hover:underline"
          onClick={handleLanguage}
        >
          <span className="text-sm text-black">Idioma</span>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator />

      {/* Seção: Gerenciar */}
      <div className="py-2">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold text-black uppercase tracking-wide">
            Gerenciar
          </h4>
        </div>
        <DropdownMenuItem
          className="px-4 py-2.5 cursor-pointer hover:underline"
          onClick={handleActivities}
        >
          <span className="text-sm text-black">Publicações e atividades</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-4 py-2.5 cursor-pointer hover:underline"
          onClick={handleJobAccount}
        >
          <span className="text-sm text-black">Conta de anúncio de vaga</span>
        </DropdownMenuItem>
      </div>

      <DropdownMenuSeparator />

      <div className="py-2">
        <div className="px-4 py-2">
          <h4 className="text-xs font-semibold text-black uppercase tracking-wide">
            Logout
          </h4>
        </div>
        {/* Footer: Sair */}
        <DropdownMenuItem
          className="px-4 cursor-pointer text-black hover:underline"
          onClick={handleSignOut}
        >
          <span className="text-sm">Sair</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Admin Options (se for admin) */}
        <div className="py-2">
          <div className="px-4 py-2">
            <h4 className="text-xs font-semibold text-black uppercase tracking-wide">
              Admin
            </h4>
          </div>
          {session?.user?.role === "admin" && (
            <>
              <DropdownMenuItem
                className="px-4 cursor-pointer text-black hover:underline"
                asChild
              >
                <Link href="/dashboard" className="flex items-center">
                  <span className="text-sm text-black hover:underline">
                    Dashboard
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="px-4 cursor-pointer text-black hover:underline"
                asChild
              >
                <Link href="/admin" className="flex items-center">
                  <span className="text-sm text-black hover:underline">
                    Admin
                  </span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </div>
      </div>
    </DropdownMenuContent>
  );
}
