import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query deve ter pelo menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Buscar na API do IBGE
    const ibgeUrl = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?nome=${encodeURIComponent(query)}`;
    
    const response = await fetch(ibgeUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Adicionar timeout
      signal: AbortSignal.timeout(10000), // 10 segundos
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao buscar cidades: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Resposta da API não é um array" },
        { status: 500 }
      );
    }

    // Normalizar query para comparação (remover acentos e converter para minúsculas)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    const normalizedQuery = normalizeString(query);

    // Formatar resultados e filtrar para garantir correspondência
    const formattedResults = data
      .map((municipio: any) => {
        try {
          let stateName = "";
          let stateCode = "";

          // Tentar diferentes caminhos para encontrar o estado
          if (municipio.microrregiao?.mesorregiao?.UF) {
            stateName = municipio.microrregiao.mesorregiao.UF.nome || "";
            stateCode = municipio.microrregiao.mesorregiao.UF.sigla || "";
          } else if (municipio.regiaoImediata?.regiaoIntermediaria?.UF) {
            stateName = municipio.regiaoImediata.regiaoIntermediaria.UF.nome || "";
            stateCode = municipio.regiaoImediata.regiaoIntermediaria.UF.sigla || "";
          } else if (municipio.UF) {
            stateName = municipio.UF.nome || "";
            stateCode = municipio.UF.sigla || "";
          }

          if (!stateName || !stateCode || !municipio.nome) {
            return null;
          }

          // Normalizar nome da cidade para verificar correspondência
          const normalizedCityName = normalizeString(municipio.nome);

          // Verificar se o nome da cidade contém a query (case-insensitive, sem acentos)
          if (!normalizedCityName.includes(normalizedQuery)) {
            return null;
          }

          return {
            id: municipio.id,
            name: municipio.nome,
            state: stateName,
            stateCode: stateCode,
            // Adicionar score para ordenação (priorizar cidades que começam com a query)
            matchScore: normalizedCityName.startsWith(normalizedQuery) ? 1 : 0,
          };
        } catch (e) {
          return null;
        }
      })
      .filter((item: any) => item !== null)
      // Ordenar: primeiro as que começam com a query, depois as que contêm
      .sort((a: any, b: any) => {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Se mesmo score, ordenar alfabeticamente
        return a.name.localeCompare(b.name, "pt-BR");
      })
      .map((item: any) => {
        // Remover matchScore antes de retornar
        const { matchScore, ...result } = item;
        return result;
      })
      .slice(0, 20); // Limitar a 20 resultados

    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Timeout ao buscar cidades. Tente novamente." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido ao buscar cidades",
      },
      { status: 500 }
    );
  }
}

