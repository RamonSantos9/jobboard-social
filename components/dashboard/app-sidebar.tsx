"use client";

import * as React from "react";
import { usePathname, useParams } from "next/navigation";
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
  navMain: [],
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
  documents: [],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const params = useParams();
  const [userProfile, setUserProfile] = React.useState<{
    name?: string;
    email?: string;
    photoUrl?: string;
  } | null>(null);
  const [companyData, setCompanyData] = React.useState<{
    name?: string;
    logoUrl?: string;
    sidebarTitle?: string;
  } | null>(null);

  const isCompanyDashboard =
    pathname?.startsWith("/company/") && pathname?.includes("/admin");
  const companyId = isCompanyDashboard ? (params?.id as string) : null;

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

  React.useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) return;
      try {
        const response = await fetch(`/api/company/${companyId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.company) {
            setCompanyData({
              name: data.company.name,
              logoUrl: data.company.logoUrl,
              sidebarTitle: data.company.sidebarTitle,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      }
    };
    fetchCompanyData();
  }, [companyId]);

  const userData = userProfile || {
    name: session?.user?.name,
    email: session?.user?.email,
    photoUrl: undefined,
  };

  const data = getNavData(userData, pathname);

  // Determinar título do sidebar
  const sidebarTitle =
    companyData?.sidebarTitle || companyData?.name || "JobBoard Social";
  const displayTitle =
    sidebarTitle.length > 20
      ? `${sidebarTitle.substring(0, 20)}...`
      : sidebarTitle;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href={isCompanyDashboard ? `/company/${companyId}` : "/"}>
                {companyData?.logoUrl ? (
                  <img
                    src={companyData.logoUrl}
                    alt={companyData.name || "Company"}
                    className="!size-10 rounded object-cover"
                  />
                ) : (
                  <LogoIcon className="!size-10" />
                )}
                <span className="text-base font-semibold truncate">
                  {displayTitle}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

        <SidebarSeparator />

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
