"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  MoreHorizontal,
  Building2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

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

interface NotificationsDropdownProps {
  unreadCount: number;
}

export default function NotificationsDropdown({
  unreadCount,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toasts, toast, removeToast } = useToast();

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
          // Redirecionar para página da empresa
          setTimeout(() => {
            window.location.href = `/company/${data.companyId}`;
          }, 1500);
        } else {
          toast.info("Convite recusado");
        }

        // Atualizar notificação localmente
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
        return <Building2 className="w-4 h-4 text-blue-600" />;
      default:
        return "🔔";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg flex items-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>

                      {/* Botões para convites de empresa */}
                      {notification.type === "company_invite" &&
                        !notification.read &&
                        notification.metadata?.inviteId && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleInviteResponse(
                                  notification._id,
                                  notification.metadata!.inviteId!,
                                  true
                                )
                              }
                              className="h-7 px-3 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
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
                              className="h-7 px-3 text-xs"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        )}

                      {/* Status de convite já respondido */}
                      {notification.type === "company_invite" &&
                        notification.read &&
                        notification.accepted !== undefined && (
                          <div className="mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                notification.accepted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {notification.accepted
                                ? "Convite aceito"
                                : "Convite recusado"}
                            </span>
                          </div>
                        )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm">
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </DropdownMenu>
  );
}
