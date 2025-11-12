"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  IconDashboard,
  IconHelp,
  IconReport,
  IconSearch,
  IconCheck,
  IconBriefcase,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/dashboard/nav-documents";
import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import LogoIcon from "../LogoIcon";

const getNavData = (
  user: { name?: string; email?: string; photoUrl?: string } | null,
  pathname: string
) => ({
  user: {
    name: user?.name || user?.email?.split("@")[0] || "Usuário",
    email: user?.email || "usuario@exemplo.com",
    avatar: user?.photoUrl,
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      isActive: pathname === "/dashboard",
    },
  ],
  navSecondary: [
    {
      title: "Obter Ajuda",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Pesquisar",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Minhas Candidaturas",
      url: "/applications",
      icon: IconCheck,
    },
    {
      name: "Gerenciar Vagas",
      url: "/jobs",
      icon: IconBriefcase,
    },
    {
      name: "Relatórios",
      url: "/reports",
      icon: IconReport,
    },
  ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = React.useState<{
    name?: string;
    email?: string;
    photoUrl?: string;
  } | null>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!session) return;
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setUserProfile({
              name:
                `${data.profile.firstName} ${data.profile.lastName}`.trim() ||
                session.user?.name,
              email: session.user?.email,
              photoUrl: data.profile.photoUrl,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [session]);

  const userData = userProfile || {
    name: session?.user?.name,
    email: session?.user?.email,
    photoUrl: undefined,
  };

  const data = getNavData(userData, pathname);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <LogoIcon className="!size-5" />
                <span className="text-base font-semibold">JobBoard Social</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

        <SidebarSeparator />

        <NavDocuments items={data.documents} />

        <SidebarSeparator />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
