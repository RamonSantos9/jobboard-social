"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
} from "lucide-react";

interface NewsDetail {
  id: number;
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  readTime: number;
  author: string;
  authorUsername: string;
  authorImage?: string;
  tags: string[];
  reactions: number;
  comments: number;
  coverImage?: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const newsId = params.id as string;
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        const response = await fetch(`/api/tech-news/${newsId}`);
        const data = await response.json();

        if (data.success) {
          setNews(data.news);
        } else {
          setError(data.error || "Notícia não encontrada");
        }
      } catch (error) {
        setError("Erro ao carregar notícia");
      } finally {
        setLoading(false);
      }
    };

    if (newsId) {
      fetchNewsDetail();
    }
  }, [newsId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Notícia não encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "A notícia que você está procurando não existe."}
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">in</span>
              </div>
              <span className="text-gray-600">Jobboard Notícias</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={news.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver original
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {/* Article Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    {news.tags &&
                      Array.isArray(news.tags) &&
                      news.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                  </div>

                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {news.title}
                  </h1>

                  <p className="text-lg text-gray-600 mb-6">
                    {news.description}
                  </p>

                  {/* Author and Meta Info */}
                  <div className="flex items-center justify-between border-t border-b py-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={news.authorImage || "/placeholder-avatar.svg"}
                        />
                        <AvatarFallback>
                          {news.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {news.author}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{news.authorUsername}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(news.publishedAt)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {news.readTime} min de leitura
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Content */}
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {news.content}
                  </div>
                </div>

                {/* Article Footer */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <Button variant="ghost" size="sm">
                        <Heart className="w-4 h-4 mr-2" />
                        {news.reactions} curtidas
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {news.comments} comentários
                      </Button>
                    </div>

                    <Button variant="outline" asChild>
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ler no site original
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre o autor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={news.authorImage || "/placeholder-avatar.svg"}
                    />
                    <AvatarFallback>
                      {news.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {news.author}
                    </h3>
                    <p className="text-sm text-gray-500">
                      @{news.authorUsername}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Especialista em tecnologia
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Articles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Artigos relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          Artigo relacionado {i}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          há {i} dias
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
