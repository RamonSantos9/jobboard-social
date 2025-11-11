"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LinkedInIcon from "./LinkedInIcon";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { X, Send, Search } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
}

interface SendMessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  post?: {
    _id: string;
    content?: string;
    authorId?: {
      _id: string;
      name: string;
      profile?: {
        firstName: string;
        lastName: string;
        photoUrl?: string;
      };
    };
    companyId?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

export default function SendMessagePopup({
  isOpen,
  onClose,
  post,
}: SendMessagePopupProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      setMessage("");
      setSelectedRecipients([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/users?limit=20");
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectRecipient = (user: User) => {
    if (!selectedRecipients.find((u) => u._id === user._id)) {
      setSelectedRecipients([...selectedRecipients, user]);
    }
    setSearchQuery("");
  };

  const handleRemoveRecipient = (userId: string) => {
    setSelectedRecipients(selectedRecipients.filter((u) => u._id !== userId));
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0) {
      toast.error("Selecione pelo menos um destinatário");
      return;
    }

    if (!message.trim() && !post) {
      toast.error("Digite uma mensagem ou selecione um post");
      return;
    }

    setIsSending(true);

    try {
      const content = message.trim() || (post ? "Confira este post" : "");

      await Promise.all(
        selectedRecipients.map(async (recipient) => {
          const response = await fetch("/api/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recipientId: recipient._id,
              content,
              postId: post?._id,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erro ao enviar para ${recipient.name}`);
          }
        })
      );

      toast.success(
        `Mensagem enviada para ${selectedRecipients.length} ${
          selectedRecipients.length === 1 ? "contato" : "contatos"
        }!`
      );
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const getUserName = (user: User) => {
    if (user.profile) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    return user.name || "Usuário";
  };

  const getUserAvatar = (user: User) => {
    return user.profile?.photoUrl;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center"
      >
        <motion.div
          ref={popupRef}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-white rounded-t-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900">
              Enviar mensagem
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Preview do post (se houver) */}
          {post && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage
                    src={
                      post.companyId?.logoUrl ||
                      post.authorId?.profile?.photoUrl ||
                      "/placeholder/userplaceholder.svg"
                    }
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                    {post.companyId
                      ? post.companyId.name.substring(0, 2).toUpperCase()
                      : post.authorId?.profile
                        ? `${post.authorId.profile.firstName[0]}${post.authorId.profile.lastName[0]}`
                        : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {post.companyId
                      ? post.companyId.name
                      : post.authorId?.profile
                        ? `${post.authorId.profile.firstName} ${post.authorId.profile.lastName}`
                        : post.authorId?.name || "Usuário"}
                  </p>
                  {post.content && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {post.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Destinatários selecionados */}
          {selectedRecipients.length > 0 && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{getUserName(user)}</span>
                    <button
                      onClick={() => handleRemoveRecipient(user._id)}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo de busca de usuários */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de usuários */}
            {searchQuery && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                {loadingUsers ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Carregando...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectRecipient(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={getUserAvatar(user) || "/placeholder-avatar.svg"}
                        />
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                          {getUserName(user)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm text-gray-900">
                          {getUserName(user)}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campo de mensagem */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                post
                  ? "Adicione uma mensagem (opcional)..."
                  : "Digite sua mensagem..."
              }
              className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={4}
            />
          </div>

          {/* Botão enviar */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={handleSend}
              disabled={isSending || selectedRecipients.length === 0}
              className="w-full"
            >
              {isSending ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

