"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

export interface CityResult {
  id: number;
  name: string;
  state: string;
  stateCode: string;
}

interface UseCitySearchOptions {
  country: string;
  enabled?: boolean;
  minLength?: number;
  debounceMs?: number;
}

export function useCitySearch({
  country,
  enabled = true,
  minLength = 2,
  debounceMs = 300,
}: UseCitySearchOptions) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CityResult[]>>(new Map());

  const searchCities = useCallback(
    async (searchQuery: string) => {
      if (!enabled || !country || searchQuery.length < minLength) {
        setResults([]);
        return;
      }

      // Verificar cache
      const cacheKey = `${country}-${searchQuery.toLowerCase()}`;
      if (cacheRef.current.has(cacheKey)) {
        setResults(cacheRef.current.get(cacheKey)!);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (country === "Brasil") {
          // Usar rota proxy do Next.js para evitar problemas de CORS
          const url = `/api/ibge/cities?q=${encodeURIComponent(searchQuery)}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Accept": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: `Erro HTTP ${response.status}`,
            }));
            throw new Error(errorData.error || `Erro HTTP ${response.status}`);
          }

          const data = await response.json();

          if (!data.results || !Array.isArray(data.results)) {
            throw new Error("Resposta da API não contém resultados válidos");
          }

          const formattedResults: CityResult[] = data.results;

          if (formattedResults.length === 0) {
            setResults([]);
            return;
          }

          // Salvar no cache
          cacheRef.current.set(cacheKey, formattedResults);
          setResults(formattedResults);
        } else {
          // Para outros países, retornar array vazio por enquanto
          // Pode ser implementado com dados estáticos ou outra API
          setResults([]);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Erro desconhecido ao buscar cidades";
        setError(errorMessage);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [country, enabled, minLength]
  );

  // Debounce da busca
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length >= minLength) {
      debounceTimerRef.current = setTimeout(() => {
        searchCities(query);
      }, debounceMs);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, searchCities, debounceMs, minLength]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => {
      setResults([]);
      setQuery("");
    },
  };
}

