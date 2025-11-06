"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreatePostModal from "@/components/CreatePostModal";
import PostActions from "@/components/PostActions";
import CommentSection from "@/components/CommentSection";
import LoadingWrapper from "@/components/LoadingWrapper";
import JobCard from "@/components/JobCard";
import { useToast } from "./ToastProvider";
import { useSession } from "next-auth/react";
import CreatePostBox from "./CreatePostBox";

import LikeIcon from "@/public/images/icons/LikeIcon.svg";
import { Separator } from "./ui/separator";

interface Post {
  _id: string;
  type?: "post" | "job";
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaUrls?: string[];
  likes?: string[];
  commentsCount?: number;
  sharesCount?: number;
  createdAt: string;
  authorId?: {
    _id: string;
    email: string;
    name: string;
    profile?: {
      firstName: string;
      lastName: string;
      photoUrl?: string;
      headline?: string;
    };
  };
  // Campos de vaga (se type === "job")
  title?: string;
  description?: string;
  location?: string;
  remote?: boolean;
  jobType?: string;
  level?: string;
  category?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  companyId?: {
    _id: string;
    name: string;
    logoUrl?: string;
  };
  matchScore?: number;
}

export default function MainFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
      } else {
        toast({
          type: "error",
          title: "Erro ao carregar posts",
        });
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Erro ao carregar posts",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost?: any) => {
    if (newPost) {
      // Adicionar o novo post à lista sem recarregar
      setPosts((prevPosts) => [newPost, ...prevPosts]);
    } else {
      // Fallback: recarregar posts se não receber o post
      fetchPosts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Remover o post da lista local sem recarregar a página
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
        toast({
          type: "success",
          title: "Post deletado com sucesso!",
        });
      } else {
        toast({
          type: "error",
          title: data.error || "Erro ao deletar post",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        type: "error",
        title: "Erro ao deletar post",
      });
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Atualizar o estado local dos posts
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: data.isLiked
                    ? [...post.likes, session?.user?.id || "current-user"] // Adicionar like
                    : post.likes.filter(
                        (like) => like !== (session?.user?.id || "current-user")
                      ), // Remover like
                }
              : post
          )
        );
      } else {
        toast({
          type: "error",
          title: data.error || "Erro ao curtir post",
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        type: "error",
        title: "Erro ao curtir post",
      });
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

  return (
    <LoadingWrapper duration={2000}>
      <div className="space-y-4">
        {/* Create Post Modal */}
        <CreatePostBox onPostCreated={handlePostCreated} />
        {/* Linha divisória + filtro */}
        <div className="border-t mt-3 pt-1 flex justify-end text-xs text-gray-500">
          <span>
            Classificar por:{" "}
            <span className="font-semibold text-gray-800">Populares</span> ▼
          </span>
        </div>

        {/* Posts e Vagas */}
        {!loading && (
          <div className="space-y-4">
            {posts.map((item) => {
              // Se for uma vaga, renderizar JobCard
              if (item.type === "job") {
                return (
                  <JobCard
                    key={item._id}
                    job={{
                      _id: item._id,
                      title: item.title || "",
                      description: item.description || "",
                      location: item.location || "",
                      remote: item.remote || false,
                      type: item.jobType || "full-time",
                      level: item.level || "mid",
                      category: item.category || "",
                      salaryRange: item.salaryRange,
                      companyId: item.companyId || {
                        _id: "",
                        name: "Empresa",
                      },
                      matchScore: item.matchScore,
                      createdAt: item.createdAt,
                    }}
                  />
                );
              }

              // Renderizar post normal
              const post = item;
              return (
              <Card key={post._id} className="rounded-lg">
                {/*  Cabeçalho  */}
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={
                            post.authorId?.profile?.photoUrl ||
                            "/placeholder-avatar.svg"
                          }
                        />
                        <AvatarFallback>
                          {post.authorId?.profile?.firstName?.[0]}
                          {post.authorId?.profile?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h4 className="font-semibold text-sm leading-tight">
                          {post.authorId?.profile?.firstName &&
                          post.authorId?.profile?.lastName
                            ? `${post.authorId.profile.firstName} ${post.authorId.profile.lastName}`
                            : post.authorId?.name || "Usuário"}
                        </h4>
                        <p className="text-xs text-gray-500 leading-tight">
                          {post.authorId?.profile?.headline || "Desenvolvedor"}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight">
                          {formatTimeAgo(post.createdAt)} • 🌐
                        </p>
                      </div>
                    </div>

                    {/* Menu de opções */}
                    <button className="text-gray-500 hover:text-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-more-horizontal"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>

                {/* Conteúdo  */}
                <CardContent className="px-4 pt-0 pb-2">
                  <p className="text-sm text-gray-800 mb-3 leading-relaxed whitespace-pre-line">
                    {post.content || ""}
                  </p>

                  {/* Mídia (imagem ou vídeo) */}
                  {post.mediaUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                      {post.mediaType === "image" ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="w-full object-cover max-h-[400px]"
                        />
                      ) : (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="w-full max-h-[400px] object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="flex justify-between items-center text-xs text-gray-500 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1">
                        <span className="text-white text-[10px] py-[2px] rounded-full flex items-center justify-center border border-white">
                          <img
                            src={LikeIcon.src}
                            alt="Like"
                            className="w-5 h-5 "
                          />
                        </span>
                      </div>
                      <span className="text-gray-600">{post.likes.length}</span>
                    </div>

                    <div className="text-gray-500">
                      <span className="hover:underline cursor-pointer">
                        {post.commentsCount} comentários
                      </span>{" "}
                      •{" "}
                      <span className="hover:underline cursor-pointer">
                        {post.sharesCount || 0} compartilhamentos
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Ações  */}
                  <div className="flex justify-between text-gray-600">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`md:flex-col flex justify-center items-center text-sm font-medium rounded-md transition-colors duration-150 hover:bg-black/10 px-2 py-2 mt-1 ${
                        post.likes?.includes(session?.user?.id || "")
                          ? "text-blue-600"
                          : "hover:text-gray-800"
                      }`}
                    >
                      <img src={LikeIcon.src} alt="Like" className="w-5 h-5" />{" "}
                      Gostei
                    </button>
                    <button className="md:flex-col flex justify-center items-center text-sm font-medium rounded-md transition-colors duration-150 hover:bg-black/10 px-2 py-2 mt-1">
                      💬 Comentar
                    </button>
                    <button className="md:flex-col flex justify-center items-center text-sm font-medium rounded-md transition-colors duration-150 hover:bg-black/10 px-2 py-2 mt-1">
                      🔁 Compartilhar
                    </button>
                    <button className="md:flex-col flex justify-center items-center text-sm font-medium rounded-md transition-colors duration-150 hover:bg-black/10 px-2 py-2 mt-1">
                      ✉️ Enviar
                    </button>
                  </div>

                  {/* Seção de comentários  */}
                  <CommentSection postId={post._id} />
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </LoadingWrapper>
  );
}
