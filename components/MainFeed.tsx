"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import JobCard from "@/components/JobCard";
import PostCard from "@/components/PostCard";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import CreatePostBox from "./CreatePostBox";
import type { ReactionType } from "@/models/Post";

interface Post {
  _id: string;
  type?: "post" | "job";
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaUrls?: string[];
  likes?: string[];
  reactions?: Array<{
    userId?: string;
    companyId?: string;
    type: ReactionType;
    user?: {
      _id: string;
      name: string;
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
        photoUrl?: string;
        followersCount?: number;
      };
    };
    company?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
    isFollowing?: boolean;
    followersCount?: number;
  }>;
  reactionsCount?: {
    like: number;
    celebrate: number;
    support: number;
    interesting: number;
    funny: number;
    love: number;
  };
  currentReaction?: ReactionType | null;
  commentsCount?: number;
  sharesCount?: number;
  createdAt: string;
  isSuggestion?: boolean;
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
    location?: string;
  };
  matchScore?: number;
  skills?: string[];
  benefits?: string[];
}

export default function MainFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    fetchPosts(true); // Carregamento inicial
  }, []);

  // Polling para atualizar posts periodicamente (a cada 10 segundos)
  // Apenas quando a página está visível
  useEffect(() => {
    if (!session?.user) return;

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => {
        fetchPosts(false); // Polling, não é carregamento inicial
      }, 10000); // 10 segundos
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Quando a página fica visível, começar polling
        startPolling();
      } else {
        // Quando a página fica oculta, parar polling
        stopPolling();
      }
    };

    // Iniciar polling se a página estiver visível
    if (document.visibilityState === "visible") {
      startPolling();
    }

    // Escutar mudanças de visibilidade
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  const fetchPosts = async (isInitialLoad = false) => {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
      } else {
        // Só mostrar erro no carregamento inicial
        if (isInitialLoad) {
          toast.error("Erro ao carregar posts");
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Só mostrar toast de erro no carregamento inicial
      if (isInitialLoad) {
        toast.error("Erro ao carregar posts");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Buscar dados atualizados de um post específico
  const fetchPostData = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      const data = await response.json();

      if (response.ok && data.post) {
        const updatedPost = data.post;
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, ...updatedPost } : post
          )
        );
      }
    } catch (error) {
      console.error("Error fetching post data:", error);
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
        toast.success("Post deletado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao deletar post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao deletar post");
    }
  };

  const handleReaction = async (
    postId: string,
    reactionType: ReactionType | null
  ) => {
    // Buscar dados atualizados do post após a reação
    // Usar um pequeno delay para garantir que o backend processou
    setTimeout(() => {
      fetchPostData(postId);
    }, 300);

    // Também atualizar após mais tempo para pegar reações de outros usuários
    setTimeout(() => {
      fetchPostData(postId);
    }, 2000);
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
        // Buscar dados atualizados do post
        setTimeout(() => {
          fetchPostData(postId);
        }, 500);
      } else {
        toast.error(data.error || "Erro ao curtir post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Erro ao curtir post");
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Post Modal */}
      <CreatePostBox onPostCreated={handlePostCreated} />
      {/* Linha divisória + filtro */}
      <div className="border-t mt-3 pt-1 flex justify-end text-xs text-black">
        <span>
          Classificar por:{" "}
          <span className="font-semibold text-black">Populares</span> ▼
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
                    skills: item.skills || [],
                    benefits: item.benefits || [],
                    matchScore: item.matchScore,
                    createdAt: item.createdAt,
                  }}
                />
              );
            }

            // Renderizar post normal usando PostCard
            const post = item;
            return (
              <PostCard
                key={post._id}
                post={{
                  _id: post._id,
                  content: post.content,
                  mediaUrl: post.mediaUrl,
                  mediaType: post.mediaType,
                  mediaUrls: post.mediaUrls,
                  likes: post.likes,
                  reactions: post.reactions,
                  reactionsCount: post.reactionsCount,
                  currentReaction: post.currentReaction,
                  commentsCount: post.commentsCount,
                  sharesCount: post.sharesCount,
                  createdAt: post.createdAt,
                  authorId: post.authorId,
                  companyId: post.companyId,
                  isSuggestion: post.isSuggestion,
                }}
                onReaction={handleReaction}
                onLike={handleLike}
                onDelete={handleDeletePost}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
