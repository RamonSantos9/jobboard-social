"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Globe,
  ChevronRight,
  Lightbulb,
  Target,
  Crown,
  Puzzle,
} from "lucide-react";

interface TechNews {
  id: number;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  readTime: number;
  author: string;
  authorUsername: string;
  authorImage?: string;
  tags: string[];
  reactions: number;
  comments: number;
  originalUrl?: string;
}

export default function RightSidebar() {
  const [techNews, setTechNews] = useState<TechNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechNews = async () => {
      try {
        const response = await fetch("/api/tech-news");
        const data = await response.json();

        if (data.success) {
          setTechNews(data.news);
        }
      } catch (error) {
        console.error("Error fetching tech news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTechNews();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `há ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `há ${diffInDays}d`;
    }
  };

  const getIconForIndex = (index: number) => {
    const icons = [TrendingUp, Users, MessageSquare, Calendar, Globe];
    return icons[index % icons.length];
  };

  return (
    <div className="w-full">
      {/* Jobboard News */}
      <Card>
        <CardHeader className="px-4 py-2">
          <CardTitle className="text-xl font-bold font-sora ">
            Jobboard Notícias
          </CardTitle>
          <p className="text-base text-black/60">Assuntos em alta</p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="w-4 h-4 bg-gray-200 rounded mt-1 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {techNews.slice(0, 5).map((news, index) => {
                const IconComponent = getIconForIndex(index);
                return (
                  <div key={news.id} className="hover:bg-black/10 py-2">
                    <div className="flex items-start w-full h-full px-4">
                      <div className="flex-1">
                        <Link
                          href={news.url}
                          className="block w-64 text-sm font-medium transition-colors cursor-pointer truncate whitespace-nowrap overflow-hidden"
                        >
                          {news.title}
                        </Link>
                        <p className="text-xs text-black/60">
                          {formatTimeAgo(news.publishedAt)} • {news.reactions}{" "}
                          leitores
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full text-sm items-start flex justify-start"
          >
            Exibir mais <ChevronDown className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Footer Links */}
      <div className="text-xs text-black/60 space-y-4 mt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Sobre
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Acessibilidade
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Central de Ajuda
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Termos e Privacidade
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Preferências de anúncios
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Publicidade
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Serviços empresariais
          </Button>
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-black/60 hover:text-black"
          >
            Mais
          </Button>
        </div>
        <Separator />
        <p className="text-start">RamonXp © 2025</p>
      </div>
    </div>
  );
}
