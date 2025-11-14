import { NextResponse } from "next/server";

// Função para traduzir texto para português usando MyMemory Translation API
async function translateToPortuguese(text: string): Promise<string> {
  if (!text || text.trim() === "") {
    return text;
  }

  try {
    // Usar MyMemory Translation API (gratuita, sem necessidade de chave)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=en|pt-BR`,
      {
        method: "GET",
        headers: {
          "User-Agent": "JobBoard/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Translation API error");
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    // Se a tradução falhar, retornar texto original
    return text;
  } catch (error) {
    console.error("Error translating text:", error);
    // Em caso de erro, retornar texto original
    return text;
  }
}

export async function GET() {
  try {
    // Buscar artigos da Dev.to API
    const response = await fetch(
      "https://dev.to/api/articles?tag=javascript&top=7&per_page=5",
      {
        headers: {
          "User-Agent": "JobBoard/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Dev.to API");
    }

    const articles = await response.json();

    // Traduzir títulos e descrições para português
    const translatedArticles = await Promise.all(
      articles.map(async (article: any) => {
        const [translatedTitle, translatedDescription] = await Promise.all([
          translateToPortuguese(article.title),
          translateToPortuguese(article.description),
        ]);

        return {
          id: article.id,
          title: translatedTitle,
          description: translatedDescription,
          url: `/news/${article.id}`, // Link interno para nossa página
          publishedAt: article.published_at,
          readTime: article.reading_time_minutes,
          author: article.user.name,
          authorUsername: article.user.username,
          authorImage: article.user.profile_image_90,
          tags: Array.isArray(article.tag_list)
            ? article.tag_list.slice(0, 3)
            : [], // Garantir que é array
          reactions: article.public_reactions_count,
          comments: article.comments_count,
          originalUrl: article.url, // URL original para referência
        };
      })
    );

    // Formatar os dados para o nosso formato em português
    const formattedNews = translatedArticles;

    return NextResponse.json({
      success: true,
      news: formattedNews,
    });
  } catch (error) {
    console.error("Error fetching tech news:", error);

    // Fallback com notícias estáticas em caso de erro
    const fallbackNews = [
      {
        id: 1,
        title: "As 20 Top Startups de 2025 no Brasil",
        description: "Descubra as startups mais promissoras do Brasil em 2025",
        url: "/news/1",
        publishedAt: new Date().toISOString(),
        readTime: 5,
        author: "Tech News Brasil",
        authorUsername: "technewsbr",
        authorImage: "/placeholder/userplaceholder.svg",
        tags: ["startups", "brasil", "tecnologia"],
        reactions: 6602,
        comments: 45,
        originalUrl: "#",
      },
      {
        id: 2,
        title: "Vagas de trainee e estágio em alta",
        description: "Mercado de trabalho para jovens profissionais",
        url: "/news/2",
        publishedAt: new Date().toISOString(),
        readTime: 3,
        author: "Career News",
        authorUsername: "careernews",
        authorImage: "/placeholder/userplaceholder.svg",
        tags: ["vagas", "trainee", "estagio"],
        reactions: 12275,
        comments: 89,
        originalUrl: "#",
      },
      {
        id: 3,
        title: "Conversas sobre IA e Machine Learning",
        description: "Tendências em inteligência artificial para 2025",
        url: "/news/3",
        publishedAt: new Date().toISOString(),
        readTime: 7,
        author: "AI Weekly",
        authorUsername: "aiweekly",
        authorImage: "/placeholder/userplaceholder.svg",
        tags: ["ia", "machine-learning", "tecnologia"],
        reactions: 4775,
        comments: 67,
        originalUrl: "#",
      },
    ];

    return NextResponse.json({
      success: true,
      news: fallbackNews,
    });
  }
}
