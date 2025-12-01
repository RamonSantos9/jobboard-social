"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LinkedInIcon from "./LinkedInIcon";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  posts: any[];
  users: any[];
  jobs: any[];
}

export default function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    posts: [],
    users: [],
    jobs: [],
  });

  // Debounce para pesquisa
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ posts: [], users: [], jobs: [] });
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      params.append("type", "all");

      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Erro ao pesquisar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    onOpenChange(false);
    if (type === "user") {
      router.push(`/jobboard/${id}`);
    } else if (type === "post") {
      router.push(`/feed#post-${id}`);
    } else if (type === "job") {
      router.push(`/jobs/${id}`);
    }
  };

  const hasResults =
    results.users.length > 0 ||
    results.jobs.length > 0 ||
    results.posts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Pesquisar</DialogTitle>
        </DialogHeader>
        <div className="p-4 border-b">
          <div className="relative">
            <LinkedInIcon
              id="search-medium"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <Input
              placeholder="Pesquisar por pessoas, vagas, habilidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-base border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2">
            {loading ? (
              <div className="p-4 space-y-4">
                <LoadingSkeleton count={3} />
              </div>
            ) : !searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                <LinkedInIcon
                  id="search-medium"
                  size={48}
                  className="text-gray-300 mb-4"
                />
                <p>Digite para pesquisar em toda a plataforma</p>
              </div>
            ) : !hasResults ? (
              <EmptyState message="Nenhum resultado encontrado" />
            ) : (
              <div className="space-y-6 pb-6">
                {/* PESSOAS */}
                {results.users.length > 0 && (
                  <div className="px-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-4">
                      Pessoas
                    </h3>
                    <div className="space-y-1">
                      {results.users.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => handleResultClick("user", user.slug)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                        >
                          <Avatar className="w-10 h-10 border border-gray-200">
                            <AvatarImage src={user.photoUrl} />
                            <AvatarFallback>
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.headline && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {user.headline}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VAGAS */}
                {results.jobs.length > 0 && (
                  <div className="px-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">
                      Vagas
                    </h3>
                    <div className="space-y-1">
                      {results.jobs.map((job) => (
                        <div
                          key={job._id}
                          onClick={() => handleResultClick("job", job._id)}
                          className="flex items-start gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                        >
                          <Avatar className="w-10 h-10 border border-gray-200 rounded-md">
                            <AvatarImage src={job.companyId?.logoUrl} />
                            <AvatarFallback className="rounded-md">
                              {job.companyId?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">
                              {job.title}
                            </p>
                            <p className="text-xs text-gray-600">
                              {job.companyId?.name}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {job.location && (
                                <span className="text-[10px] text-gray-500 flex items-center bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  {job.location}
                                </span>
                              )}
                              {job.skills?.slice(0, 3).map((skill: string) => (
                                <span
                                  key={skill}
                                  className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* POSTS */}
                {results.posts.length > 0 && (
                  <div className="px-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">
                      Posts
                    </h3>
                    <div className="space-y-1">
                      {results.posts.map((post) => (
                        <div
                          key={post._id}
                          onClick={() => handleResultClick("post", post._id)}
                          className="flex items-start gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition"
                        >
                          <Avatar className="w-8 h-8 border border-gray-200">
                            <AvatarImage
                              src={
                                post.author?.photoUrl || post.companyId?.logoUrl
                              }
                            />
                            <AvatarFallback>
                              {post.author?.firstName?.[0] ||
                                post.companyId?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 mb-0.5">
                              {post.author
                                ? `${post.author.firstName} ${post.author.lastName}`
                                : post.companyId?.name}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {post.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3 px-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <LinkedInIcon
        id="search-medium"
        size={48}
        className="text-gray-300 mb-4"
      />
      <p className="text-gray-500">{message}</p>
      <p className="text-sm text-gray-400 mt-2">
        Tente usar palavras-chave diferentes
      </p>
    </div>
  );
}
