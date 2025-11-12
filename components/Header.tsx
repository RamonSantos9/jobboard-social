"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ButtonGroupInput } from "./ButtonGroupInput";
import LinkedInIcon from "./LinkedInIcon";
import LogoIcon from "./LogoIcon";
import UserDropdownMenu from "./UserDropdownMenu";
import { cn } from "@/lib/utils";

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
  headline?: string;
}

interface HeaderProps {
  sticky?: boolean;
}

export default function Header({ sticky = true }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(4);

  // Buscar dados do perfil quando o componente montar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile({
            firstName: data.profile.firstName || "",
            lastName: data.profile.lastName || "",
            slug: data.profile.slug || "",
            photoUrl: data.profile.photoUrl || undefined,
            headline: data.profile.headline || undefined,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      }
    };

    fetchProfile();
  }, [session]);

  const navItems = [
    {
      href: "/feed",
      iconId: pathname === "/feed" ? "home-active" : "newspaper-small",
      label: "Início",
    },
    {
      href: "/network",
      iconId: "people",
      label: "Minha rede",
    },
    {
      href: "/jobs",
      iconId: "job",
      label: "Vagas",
    },
    {
      href: "/messages",
      iconId: "nav-small-messaging-icon",
      label: "Mensagens",
    },
    {
      href: "/notifications",
      iconId: "bell-fill",
      label: "Notificações",
    },
  ];

  return (
    <header className={cn("bg-white border-b", sticky && "sticky top-0 z-50")}>
      {/* DESKTOP HEADER */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 items-center justify-between h-14 relative">
        {/* LEFT: Logo + Search */}
        <div className="flex items-center gap-3">
          <Link href="/feed" className="flex items-center justify-center">
            <LogoIcon size="default" color="black" strokeWidth={300} />
          </Link>
          <div className="w-64">
            <ButtonGroupInput />
          </div>
        </div>

        {/* CENTER: Navigation */}
        <nav
          className="flex items-center gap-6 text-black"
          aria-label="Navegação principal"
        >
          <ul className="flex items-center list-none m-0 p-0">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <li
                  key={item.href}
                  className={cn("relative", index > 0 && "ml-6")}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition group whitespace-nowrap px-2 py-1.5 rounded",
                      isActive ? "text-black" : "text-black/80 hover:text-black"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="relative flex items-center justify-center">
                      <LinkedInIcon
                        id={item.iconId}
                        size={24}
                        className={cn(
                          "transition shrink-0",
                          isActive
                            ? "opacity-100"
                            : "opacity-80 group-hover:opacity-100"
                        )}
                      />
                      {item.label === "Notificações" &&
                        unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[12px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                            {unreadNotifications}
                          </span>
                        )}
                    </div>
                    <span className="text-xs leading-tight whitespace-nowrap text-center">
                      {item.label}
                    </span>
                    {/* Indicador ativo - linha preta na parte de baixo */}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-black rounded-full -mb-0.5" />
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Eu - Avatar */}
            <li className="relative ml-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition group whitespace-nowrap px-2 py-1.5 rounded",
                      pathname?.startsWith("/jobboard") ||
                        pathname?.startsWith("/settings")
                        ? "text-black"
                        : "text-black/80 hover:text-black"
                    )}
                  >
                    <div className="relative flex items-center justify-center">
                      <Avatar className="w-6 h-6 border border-gray-200 rounded-full shrink-0">
                        <AvatarImage
                          src={
                            profile?.photoUrl ||
                            "/placeholder/userplaceholder.svg"
                          }
                        />
                        <AvatarFallback className="text-[10px]">
                          {profile?.firstName?.[0]}
                          {profile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs leading-tight whitespace-nowrap text-center">
                      Eu
                    </span>
                    {/* Indicador ativo - linha preta na parte de baixo */}
                    {(pathname?.startsWith("/jobboard") ||
                      pathname?.startsWith("/settings")) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-black rounded-full -mb-0.5" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <UserDropdownMenu profile={profile} />
              </DropdownMenu>
            </li>

            {/* Separator Vertical */}
            <li
              className="h-8 w-px bg-gray-300 shrink-0 ml-6"
              aria-hidden="true"
            />

            {/* Para negócios */}
            <li className="relative ml-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-black/80 hover:text-black transition group whitespace-nowrap px-2 py-1.5 rounded"
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <LinkedInIcon
                        id="grid"
                        size={24}
                        className="opacity-80 group-hover:opacity-100 transition shrink-0 text-black/80"
                      />
                    </div>
                    <span className="text-xs leading-tight whitespace-nowrap text-center">
                      Para negócios
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>Serviços empresariais</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>

            {/* Anunciar vaga - Espaçamento reduzido */}
            <li className="relative ml-3">
              <Link
                href="/jobs/create"
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition group whitespace-nowrap px-2 py-1.5 rounded",
                  pathname === "/jobs/create"
                    ? "text-black"
                    : "text-black/80 hover:text-black"
                )}
              >
                <div className="relative flex items-center justify-center shrink-0">
                  <LinkedInIcon
                    id="nav-small-job-posting-icon"
                    size={24}
                    className={cn(
                      "transition shrink-0",
                      pathname === "/jobs/create"
                        ? "opacity-100"
                        : "opacity-80 group-hover:opacity-100"
                    )}
                  />
                </div>
                <span className="text-xs leading-tight whitespace-nowrap text-center">
                  Anunciar vaga
                </span>
                {/* Indicador ativo - linha preta na parte de baixo */}
                {pathname === "/jobs/create" && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-black rounded-full -mb-0.5" />
                )}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 h-12 border-t border-gray-200">
        {/* Left: Logo */}
        <Link href="/feed" className="flex items-center justify-center">
          <LogoIcon size="lg" color="black" strokeWidth={400} />
        </Link>

        {/* Center: Nav Icons */}
        <nav className="flex items-center justify-center gap-6 text-black">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="relative">
              <LinkedInIcon
                id={item.iconId}
                size={24}
                className="opacity-80 hover:opacity-100 transition"
              />
              {item.label === "Notificações" && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[13px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer">
              <Avatar className="w-6 h-6 border border-gray-200 rounded-full">
                <AvatarImage
                  src={profile?.photoUrl || "/placeholder/userplaceholder.svg"}
                />
                <AvatarFallback>
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <UserDropdownMenu profile={profile} />
        </DropdownMenu>
      </div>
    </header>
  );
}
