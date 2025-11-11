"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  HelpCircle,
  Globe,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroupInput } from "./ButtonGroupInput";
import LinkedInIcon from "./LinkedInIcon";
import { cn } from "@/lib/utils";

interface Profile {
  firstName: string;
  lastName: string;
  slug: string;
  photoUrl?: string;
}

interface HeaderProps {
  sticky?: boolean;
}

export default function Header({ sticky = true }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(4);

  const handleAvatarClick = () => {
    if (profile?.slug) router.push(`/jobboard/${profile.slug}`);
  };

  const navItems = [
    { href: "/feed", iconId: "newspaper-small", label: "Início" },
    { href: "/network", iconId: "group-small", label: "Minha rede" },
    { href: "/jobs", iconId: "connect-small", label: "Vagas" },
    { href: "/messages", iconId: "send-privately-small", label: "Mensagens" },
    { href: "/notifications", iconId: "signal-notice-small", label: "Notificações" },
  ];

  return (
    <header
      className={cn(
        "bg-white border-b border-gray-200",
        sticky && "sticky top-0 z-50"
      )}
    >
      {/* DESKTOP HEADER */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 items-center justify-between h-14">
        {/* LEFT: Logo + Search */}
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <div className="w-8 h-8 bg-[#0a66c2] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xl">in</span>
            </div>
          </Link>
          <div className="w-64">
            <ButtonGroupInput />
          </div>
        </div>

        {/* CENTER: Navigation */}
        <nav className="flex items-center gap-6 text-gray-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center text-xs font-medium hover:text-black transition group"
            >
              <div className="relative">
                <LinkedInIcon
                  id={item.iconId}
                  size={20}
                  className="opacity-80 group-hover:opacity-100 transition"
                />
                {item.label === "Notificações" && unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <span className="mt-1">{item.label}</span>
            </Link>
          ))}

          {/* Para negócios */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center text-xs font-medium hover:text-black">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                >
                  <path d="M3 3h4v4H3zm7 4h4V3h-4zm7-4v4h4V3zM3 14h4v-4H3zm7 0h4v-4h-4zm7 0h4v-4h-4zM3 21h4v-4H3zm7 0h4v-4h-4zm7 0h4v-4h-4z" />
                </svg>
                <div className="flex items-center gap-1">
                  <span>Para negócios</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Serviços empresariais</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* RIGHT: Avatar + Premium */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center text-xs font-medium hover:text-black">
                <Avatar className="w-7 h-7 border border-gray-200 rounded-full">
                  <AvatarImage
                    src={profile?.photoUrl || "/placeholder/userplaceholder.svg"}
                  />
                  <AvatarFallback>
                    {profile?.firstName?.[0]}
                    {profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1">
                  <span>Eu</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Ver perfil</DropdownMenuItem>
              <DropdownMenuSeparator />
              {session?.user?.role === "admin" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" /> Ajuda & Suporte
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Globe className="mr-2 h-4 w-4" /> Idioma & Região
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="link"
            className="text-yellow-700 text-xs font-medium hover:underline"
          >
            Volte a experimentar o Premium
          </Button>
        </div>
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 h-12 border-t border-gray-200">
        {/* Left: Logo */}
        <Link href="/feed">
          <div className="w-7 h-7 bg-[#0a66c2] rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">in</span>
          </div>
        </Link>

        {/* Center: Nav Icons */}
        <nav className="flex items-center justify-center gap-6 text-gray-600">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="relative">
              <LinkedInIcon
                id={item.iconId}
                size={20}
                className="opacity-80"
              />
              {item.label === "Notificações" && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
            <DropdownMenuSeparator />
            {session?.user?.role === "admin" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" /> Ajuda & Suporte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
