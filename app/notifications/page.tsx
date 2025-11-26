"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, CheckCircle, XCircle, Bell } from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  accepted?: boolean;
  createdAt: string;
  relatedUserId?: {
    name: string;
    email: string;
  };
  metadata?: {
    companyId?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
    inviteId?: string;
    role?: string;
    invitedBy?: {
      name: string;
    };
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications);
      } else {
        toast.error("Erro ao carregar notificações");
      }
    } catch (error) {
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notificationIds.includes(notif._id)
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notif) => !notif.read)
      .map((notif) => notif._id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
      toast.success("Todas as notificações marcadas como lidas");
    }
  };

  const handleInviteResponse = async (
    notificationId: string,
    inviteId: string,
    accept: boolean
  ) => {
    try {
      const response = await fetch("/api/invite/accept-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          inviteId,
          accept,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (accept) {
          toast.success("Convite aceito com sucesso!");
          setTimeout(() => {
            router.push(`/company/${data.companyId}`);
          }, 1500);
        } else {
          toast.info("Convite recusado");
        }

        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, read: true, accepted: accept }
              : notif
          )
        );
      } else {
        toast.error(data.error || "Erro ao processar convite");
      }
    } catch (error) {
      toast.error("Erro ao processar convite");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return "👍";
      case "comment":
        return "💬";
      case "connection":
        return "👥";
      case "job":
        return "💼";
      case "message":
        return "📩";
      case "company_invite":
        return <Building2 className="w-6 h-6 text-blue-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f2ef]">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Esquerda (Filtros - Placeholder) */}
            <div className="hidden md:block w-64 shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Gerenciar notificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-blue-600 cursor-pointer">
                      Ver configurações
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <CardTitle>Notificações</CardTitle>
                  {notifications.some((n) => !n.read) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      Carregando notificações...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Nenhuma notificação ainda
                      </h3>
                      <p className="text-gray-500 mt-2">
                        Nós avisaremos quando houver atualizações importantes para você.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="mt-1 shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>

                              {/* Ações para convite de empresa */}
                              {notification.type === "company_invite" &&
                                !notification.read &&
                                notification.metadata?.inviteId && (
                                  <div className="flex gap-3 mt-3">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleInviteResponse(
                                          notification._id,
                                          notification.metadata!.inviteId!,
                                          true
                                        )
                                      }
                                      className="h-8"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Aceitar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleInviteResponse(
                                          notification._id,
                                          notification.metadata!.inviteId!,
                                          false
                                        )
                                      }
                                      className="h-8"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Recusar
                                    </Button>
                                  </div>
                                )}

                              {/* Status de convite respondido */}
                              {notification.type === "company_invite" &&
                                notification.read &&
                                notification.accepted !== undefined && (
                                  <div className="mt-2">
                                    <Badge
                                      variant={notification.accepted ? "default" : "destructive"}
                                      className={notification.accepted ? "bg-green-600" : ""}
                                    >
                                      {notification.accepted
                                        ? "Convite aceito"
                                        : "Convite recusado"}
                                    </Badge>
                                  </div>
                                )}
                            </div>
                            {!notification.read && (
                              <div className="shrink-0 self-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
