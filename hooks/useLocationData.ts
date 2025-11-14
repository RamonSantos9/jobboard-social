"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { countries, staticLocationData, State, City } from "@/lib/location-data";

interface IBGEState {
  id: number;
  nome: string;
  sigla: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

export function useLocationData(country?: string, state?: string) {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache para evitar requisições repetidas
  const statesCache = React.useRef<Map<string, State[]>>(new Map());
  const citiesCache = React.useRef<Map<string, City[]>>(new Map());

  const loadStates = useCallback(async (countryName: string) => {
    const cacheKey = countryName;
    
    // Verificar cache
    if (statesCache.current.has(cacheKey)) {
      setStates(statesCache.current.get(cacheKey)!);
      return;
    }

    setLoadingStates(true);
    setError(null);

    try {
      if (countryName === "Brasil") {
        // Usar API do IBGE para Brasil
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
        );
        
        if (!response.ok) {
          throw new Error("Erro ao carregar estados");
        }

        const data: IBGEState[] = await response.json();
        const formattedStates: State[] = data.map((s) => ({
          name: s.nome,
          code: s.sigla,
        }));

        // Ordenar alfabeticamente
        formattedStates.sort((a, b) => a.name.localeCompare(b.name));

        // Salvar no cache
        statesCache.current.set(cacheKey, formattedStates);
        setStates(formattedStates);
      } else {
        // Usar dados estáticos para outros países
        const countryCode = countries.find((c) => c.name === countryName)?.code;
        if (countryCode && staticLocationData[countryCode]) {
          const staticStates = staticLocationData[countryCode].states;
          statesCache.current.set(cacheKey, staticStates);
          setStates(staticStates);
        } else {
          setStates([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  }, []);

  const loadCities = useCallback(async (countryName: string, stateName: string) => {
    const cacheKey = `${countryName}-${stateName}`;
    
    // Verificar cache
    if (citiesCache.current.has(cacheKey)) {
      setCities(citiesCache.current.get(cacheKey)!);
      return;
    }

    setLoadingCities(true);
    setError(null);

    try {
      if (countryName === "Brasil") {
        // Encontrar o estado selecionado
        const selectedState = states.find((s) => s.name === stateName);
        
        if (!selectedState) {
          setCities([]);
          return;
        }

        // Usar API do IBGE para Brasil
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.code}/municipios`
        );
        
        if (!response.ok) {
          throw new Error("Erro ao carregar cidades");
        }

        const data: IBGECity[] = await response.json();
        const formattedCities: City[] = data.map((c) => ({
          name: c.nome,
        }));

        // Ordenar alfabeticamente
        formattedCities.sort((a, b) => a.name.localeCompare(b.name));

        // Salvar no cache
        citiesCache.current.set(cacheKey, formattedCities);
        setCities(formattedCities);
      } else {
        // Usar dados estáticos para outros países
        const countryCode = countries.find((c) => c.name === countryName)?.code;
        const selectedState = states.find((s) => s.name === stateName);
        
        if (
          countryCode &&
          selectedState &&
          staticLocationData[countryCode]?.cities[selectedState.code]
        ) {
          const staticCities = staticLocationData[countryCode].cities[selectedState.code];
          citiesCache.current.set(cacheKey, staticCities);
          setCities(staticCities);
        } else {
          setCities([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, [states]);

  // Carregar estados quando país mudar
  useEffect(() => {
    if (country) {
      loadStates(country);
      // Limpar cidades quando país mudar
      setCities([]);
      citiesCache.current.clear();
    } else {
      setStates([]);
      setCities([]);
    }
  }, [country, loadStates]);

  // Carregar cidades quando estado mudar
  useEffect(() => {
    if (country && state) {
      loadCities(country, state);
    } else {
      setCities([]);
    }
  }, [country, state, loadCities]);

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error,
    reloadStates: () => country && loadStates(country),
    reloadCities: () => country && state && loadCities(country, state),
  };
}

