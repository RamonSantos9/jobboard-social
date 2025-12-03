"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import JobCard from "@/components/JobCard";
import PostCard from "@/components/PostCard";
import PostCardSkeleton from "@/components/PostCardSkeleton";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    fetchPosts(true, 1); // Carregamento inicial
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // Carregar mais quando estiver a 200px do fim
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, loadingMore, page]);

  const fetchPosts = async (isInitialLoad = false, pageNum = 1) => {
    try {
      // Usar feed recomendado se usuário estiver logado, senão usar feed padrão
      const endpoint = session?.user
        ? `/api/feed/recommended?page=${pageNum}&limit=10`
        : `/api/posts?page=${pageNum}&limit=10`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        if (session?.user && data.items) {
          // Feed recomendado retorna items
          if (isInitialLoad) {
            setPosts(data.items);
          } else {
            setPosts((prev) => [...prev, ...data.items]);
          }
          setHasMore(data.pagination?.hasMore ?? false);
        } else if (data.posts) {
          // Feed padrão retorna posts
          if (isInitialLoad) {
            setPosts(data.posts);
          } else {
            setPosts((prev) => [...prev, ...data.posts]);
          }
          setHasMore(
            data.pagination
              ? data.pagination.page < data.pagination.pages
              : data.posts.length === 10
          );
        }
      } else {
        // Só mostrar erro no carregamento inicial
        if (isInitialLoad) {
          toast.error("Erro ao carregar feed");
        }
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      // Só mostrar toast de erro no carregamento inicial
      if (isInitialLoad) {
        toast.error("Erro ao carregar feed");
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(false, nextPage);
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
      <div id="create-post-box">
        <CreatePostBox onPostCreated={handlePostCreated} />
      </div>
      {/* Linha divisória + filtro */}
      <div className="border-t mt-3 pt-1 flex justify-end text-xs text-black">
        <span>
          Classificar por:{" "}
          <span className="font-semibold text-black">Populares</span> ▼
        </span>
      </div>

      {/* Posts e Vagas */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4" id="feed-posts">
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
          {loadingMore && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
