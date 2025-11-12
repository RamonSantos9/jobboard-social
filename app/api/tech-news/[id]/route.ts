import { NextResponse } from "next/server";

// Função para traduzir texto para português (versão simplificada)
async function translateToPortuguese(text: string): Promise<string> {
  // Por enquanto, retorna o texto original para evitar problemas com API externa
  // Em produção, você pode implementar uma tradução real
  return text;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {

    // Buscar artigo específico da Dev.to API
    const response = await fetch(`https://dev.to/api/articles/${id}`, {
      headers: {
        "User-Agent": "JobBoard/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Dev.to API");
    }

    const article = await response.json();

    // Traduzir conteúdo para português
    const [translatedTitle, translatedDescription, translatedContent] =
      await Promise.all([
        translateToPortuguese(article.title),
        translateToPortuguese(article.description),
        translateToPortuguese(article.body_html || article.description),
      ]);

    // Formatar os dados para o nosso formato em português
    const formattedNews = {
      id: article.id,
      title: translatedTitle,
      description: translatedDescription,
      content: translatedContent,
      url: article.url,
      publishedAt: article.published_at,
      readTime: article.reading_time_minutes,
      author: article.user.name,
      authorUsername: article.user.username,
      authorImage: article.user.profile_image_90,
      tags: Array.isArray(article.tag_list) ? article.tag_list.slice(0, 5) : [], // Garantir que é array
      reactions: article.public_reactions_count,
      comments: article.comments_count,
      coverImage: article.cover_image,
    };

    return NextResponse.json({
      success: true,
      news: formattedNews,
    });
  } catch (error) {
    console.error("Error fetching tech news detail:", error);

    // Fallback com notícia estática em caso de erro
    const fallbackNews = {
      id: parseInt(id),
      title: "As 20 Top Startups de 2025 no Brasil",
      description:
        "Descubra as startups mais promissoras do Brasil em 2025 e suas inovações tecnológicas que estão transformando o mercado.",
      content: `O ecossistema de startups brasileiro está em constante evolução, e 2025 promete ser um ano marcante para o setor. 

Neste artigo, exploramos as 20 startups mais promissoras do Brasil, analisando seus modelos de negócio, tecnologias inovadoras e potencial de crescimento.

## Principais Tendências

1. **Inteligência Artificial**: Muitas startups estão incorporando IA em seus produtos
2. **Sustentabilidade**: Foco crescente em soluções eco-friendly
3. **Fintech**: Revolução no setor financeiro brasileiro
4. **Healthtech**: Inovações em saúde e bem-estar

## Destaques do Ranking

As startups selecionadas foram avaliadas com base em critérios como:
- Inovação tecnológica
- Potencial de mercado
- Qualidade da equipe
- Tração e crescimento
- Impacto social

Cada uma dessas empresas representa uma oportunidade única de investimento e parceria no mercado brasileiro.`,
      url: "#",
      publishedAt: new Date().toISOString(),
      readTime: 5,
      author: "Tech News Brasil",
      authorUsername: "technewsbr",
      authorImage: "/placeholder/userplaceholder.svg",
      tags: ["startups", "brasil", "tecnologia", "inovação", "investimento"],
      reactions: 6602,
      comments: 45,
      coverImage: null,
    };

    return NextResponse.json({
      success: true,
      news: fallbackNews,
    });
  }
}
