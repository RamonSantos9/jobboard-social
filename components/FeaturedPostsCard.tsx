"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostDetailModal from "./PostDetailModal";
import type { ReactionType } from "@/models/Post";

interface FeaturedPost {
  _id: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  mediaUrls?: string[];
  createdAt: string;
  authorId?: {
    _id: string;
    email?: string;
    name: string;
    profile?: {
      firstName: string;
      lastName: string;
      photoUrl?: string;
      slug?: string;
      headline?: string;
    };
  };
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
  isHighlighted?: boolean;
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
      };
    };
    company?: {
      _id: string;
      name: string;
      logoUrl?: string;
    };
    isFollowing?: boolean;
  }>;
  sharesCount?: number;
  companyId?: {
    _id: string;
    name: string;
    logoUrl?: string;
    followers?: number;
  };
}

interface FeaturedPostsCardProps {
  userId: string;
}

export default function FeaturedPostsCard({ userId }: FeaturedPostsCardProps) {
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPost, setSelectedPost] = useState<FeaturedPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      try {
        const response = await fetch(`/api/posts/highlighted/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Erro ao buscar posts destacados:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFeaturedPosts();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Em destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return null; // Não mostrar o card se não houver posts destacados
  }

  // Calcular posts visíveis (até 3 por vez)
  const postsPerView = 3;
  const totalViews = Math.ceil(posts.length / postsPerView);
  const startIndex = currentIndex * postsPerView;
  const visiblePosts = posts.slice(startIndex, startIndex + postsPerView);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalViews - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalViews - 1 ? prev + 1 : 0));
  };

  const handlePostClick = (post: FeaturedPost) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Em destaque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Carrossel de Posts */}
            <div className="grid grid-cols-3 gap-4">
              {visiblePosts.map((post) => {
                const firstMediaUrl =
                  post.mediaUrls && post.mediaUrls.length > 0
                    ? post.mediaUrls[0]
                    : post.mediaUrl;
                const authorName = post.authorId?.profile
                  ? `${post.authorId.profile.firstName} ${post.authorId.profile.lastName}`
                  : post.authorId?.name || "Usuário";

                return (
                  <div
                    key={post._id}
                    className="cursor-pointer group"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group/image">
                      {firstMediaUrl ? (
                        <>
                          <img
                            src={firstMediaUrl}
                            alt={post.content || "Post destacado"}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover/image:scale-105"
                          />
                          {/* Overlay no hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors duration-200"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <p className="text-xs text-gray-500 text-center px-2 line-clamp-3">
                            {post.content || "Post destacado"}
                          </p>
                        </div>
                      )}
                    </div>
                    {post.content && (
                      <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {post.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navegação (setas) - apenas se houver mais de 3 posts */}
            {posts.length > postsPerView && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-md hover:bg-gray-50"
                  onClick={handlePrevious}
                  aria-label="Posts anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-md hover:bg-gray-50"
                  onClick={handleNext}
                  aria-label="Próximos posts"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Indicadores (dots) - apenas se houver mais de 3 posts */}
            {posts.length > postsPerView && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalViews }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex
                        ? "bg-blue-600"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Ver página ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes do post - carregado dinamicamente */}
      {selectedPost && showPostModal && (
        <PostDetailModal
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false);
            setSelectedPost(null);
          }}
          post={{
            ...selectedPost,
            authorId: selectedPost.authorId
              ? {
                  ...selectedPost.authorId,
                  email: selectedPost.authorId.email || "",
                }
              : undefined,
          }}
          initialMediaIndex={0}
        />
      )}
    </>
  );
}

