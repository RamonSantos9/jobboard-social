"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AuthGuard from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MessageCircle, Heart, Share2 } from "lucide-react";
import Link from "next/link";

interface UserPost {
  _id: string;
  content: string;
  type: string;
  media?: string[];
  createdAt: string;
  likes: number;
  comments: number;
  sharesCount: number;
  reactions: Array<{
    type: string;
    userId?: string;
    companyId?: string;
  }>;
}

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (session) {
      fetchPosts();
    }
  }, [session, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/user?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Erro ao buscar posts");
      }

      const data = await response.json();
      setPosts((prev) => (page === 1 ? data.posts : [...prev, ...data.posts]));
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`;
    } else {
      return "Agora";
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Publicações e atividades
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie suas publicações e visualize suas atividades
            </p>
          </div>

          {/* Posts List */}
          {loading && page === 1 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">
                  Você ainda não publicou nada
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/feed")}
                >
                  Criar primeira publicação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize">
                        {post.type}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {truncateContent(post.content)}
                    </p>

                    {post.media && post.media.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {post.media.slice(0, 4).map((media, index) => (
                          <div
                            key={index}
                            className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                          >
                            <img
                              src={media}
                              alt={`Media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">{post.sharesCount || 0}</span>
                      </div>
                      <div className="flex-1" />
                      <Link href={`/feed/post/${post._id}`}>
                        <Button variant="ghost" size="sm">
                          Ver post
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                  >
                    {loading ? "Carregando..." : "Carregar mais"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

