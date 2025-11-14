"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { ScrollWrapper } from "@/components/dashboard/scroll-wrapper";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, MapPin, Briefcase, MessageSquare } from "lucide-react";
import Link from "next/link";

function CompanyUsersContent() {
  const params = useParams();
  const companyId = params.id as string;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/company/${companyId}/admin/users`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchUsers();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Candidatos" />
        <ScrollWrapper className="flex-1" variant="dashboard">
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Candidatos ({users.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhum candidato encontrado
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {users.map((user: any) => (
                            <Card key={user._id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.profile?.photoUrl} />
                                    <AvatarFallback>
                                      {user.name?.[0]?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                          {user.profile?.firstName && user.profile?.lastName
                                            ? `${user.profile.firstName} ${user.profile.lastName}`
                                            : user.name}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                          <span className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {user.email}
                                          </span>
                                          {user.profile?.location && (
                                            <span className="flex items-center gap-1">
                                              <MapPin className="h-4 w-4" />
                                              {user.profile.location}
                                            </span>
                                          )}
                                        </div>
                                        {user.profile?.headline && (
                                          <p className="text-sm text-gray-700 mt-2">
                                            {user.profile.headline}
                                          </p>
                                        )}
                                      </div>
                                      <Badge variant="secondary">
                                        {user.applicationsCount} candidatura{user.applicationsCount !== 1 ? "s" : ""}
                                      </Badge>
                                    </div>
                                    
                                    {user.profile?.bio && (
                                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                                        {user.profile.bio}
                                      </p>
                                    )}

                                    {user.profile?.experience && user.profile.experience.length > 0 && (
                                      <div className="mt-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Experiência:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {user.profile.experience.slice(0, 3).map((exp: any, idx: number) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                              <Briefcase className="h-3 w-3 mr-1" />
                                              {exp.title} {exp.company ? `@ ${exp.company}` : ""}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-4">
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/jobboard/${user.profile?.slug || user._id}`}>
                                          Ver Perfil
                                        </Link>
                                      </Button>
                                      <Button variant="outline" size="sm" asChild>
                                        <Link href={`/company/${companyId}/admin/applications?userId=${user._id}`}>
                                          Ver Candidaturas
                                        </Link>
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Enviar Mensagem
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollWrapper>
      </SidebarInset>
    </>
  );
}

export default function CompanyUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/feed/auth/login");
      return;
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `/api/companies/${params.id}/check-access`
        );
        if (!response.ok) {
          router.push(`/company/${params.id}`);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        router.push(`/company/${params.id}`);
      }
    };

    if (params.id) {
      checkAccess();
    }
  }, [session, status, router, params]);

  if (status === "loading") {
    return <div></div>;
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <CompanyUsersContent />
    </SidebarProvider>
  );
}

