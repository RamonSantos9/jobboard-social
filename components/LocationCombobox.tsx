"use client";

import * as React from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { countries } from "@/lib/location-data";
import { useCitySearch, CityResult } from "@/hooks/useCitySearch";

interface LocationComboboxProps {
  country?: string;
  city?: string;
  state?: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  disabled?: boolean;
}

export function LocationCombobox({
  country: externalCountry,
  city: externalCity,
  state: externalState,
  onCountryChange,
  onCityChange,
  onStateChange,
  disabled = false,
}: LocationComboboxProps) {
  const [countryOpen, setCountryOpen] = React.useState(false);
  const [cityOpen, setCityOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [isUserTyping, setIsUserTyping] = React.useState(false); // Rastrear se o usuário está digitando
  const countryInputRef = React.useRef<HTMLInputElement>(null);
  const cityInputRef = React.useRef<HTMLInputElement>(null);
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);
  const cityDropdownRef = React.useRef<HTMLDivElement>(null);

  const country = externalCountry || "";
  const city = externalCity || "";

  // Hook para busca de cidades
  const {
    query: cityQuery,
    setQuery: setCityQuery,
    results: cityResults,
    loading: cityLoading,
    error: cityError,
  } = useCitySearch({
    country,
    enabled: country === "Brasil",
    minLength: 2,
    debounceMs: 300,
  });

  // Filtrar países baseado na pesquisa
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch) return countries;
    const search = countrySearch.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(search));
  }, [countrySearch]);

  // Fechar dropdowns ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Verificar se o clique foi dentro do dropdown de países
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(target) &&
        countryInputRef.current &&
        !countryInputRef.current.contains(target)
      ) {
        setCountryOpen(false);
      }
      
      // Verificar se o clique foi dentro do dropdown de cidades
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(target)
      ) {
        // Usar setTimeout para garantir que o onClick do botão seja processado primeiro
        setTimeout(() => {
          setCityOpen(false);
        }, 150);
      }
    };

    // Usar 'click' em vez de 'mousedown' para garantir que o onClick seja processado primeiro
    document.addEventListener("click", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  // Abrir dropdown de países quando houver texto
  React.useEffect(() => {
    if (countrySearch.length > 0 && filteredCountries.length > 0) {
      setCountryOpen(true);
    } else {
      setCountryOpen(false);
    }
  }, [countrySearch, filteredCountries]);

  // Inicializar cityQuery quando a cidade externa mudar (apenas se não estiver digitando)
  React.useEffect(() => {
    if (city && cityQuery === "" && !isUserTyping) {
      // Se houver estado, formatar como "Cidade, Estado"
      const state = externalState || "";
      const displayText = state ? `${city}, ${state}` : city;
      setCityQuery(displayText);
      setIsUserTyping(false); // Resetar flag ao inicializar
    }
  }, [city, externalState]);

  // Abrir dropdown de cidades apenas quando o usuário estiver digitando
  React.useEffect(() => {
    // Só abrir se o usuário realmente digitou (isUserTyping) e há resultados
    if (isUserTyping && cityQuery.length >= 2 && cityResults.length > 0 && !cityLoading) {
      setCityOpen(true);
    } else {
      setCityOpen(false);
    }
  }, [cityQuery, cityResults, cityLoading, isUserTyping]);

  const handleCountrySelect = (countryName: string) => {
    onCountryChange(countryName);
    setCountrySearch("");
    setCountryOpen(false);
    // Limpar cidade quando país mudar
    onCityChange("");
    onStateChange("");
    setCityQuery("");
    setIsUserTyping(false); // Resetar flag ao mudar país
  };

  const handleCitySelect = (cityResult: CityResult) => {
    onCityChange(cityResult.name);
    onStateChange(cityResult.state); // Extrair estado automaticamente
    // Formatar como "Cidade, Estado" para exibição no input
    const displayText = cityResult.state 
      ? `${cityResult.name}, ${cityResult.state}`
      : cityResult.name;
    setCityQuery(displayText);
    setIsUserTyping(false); // Resetar flag quando selecionar uma cidade
    setCityOpen(false);
    // Não fazer blur imediatamente para evitar conflitos
    setTimeout(() => {
      cityInputRef.current?.blur();
    }, 100);
  };

  const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCountryOpen(false);
      countryInputRef.current?.blur();
    } else if (e.key === "ArrowDown" && filteredCountries.length > 0) {
      e.preventDefault();
      setCountryOpen(true);
    }
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setCityOpen(false);
      cityInputRef.current?.blur();
    } else if (e.key === "ArrowDown" && cityResults.length > 0) {
      e.preventDefault();
      setCityOpen(true);
    }
  };

  // Highlight do texto pesquisado
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 font-semibold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Campo de País */}
      <div className="space-y-2">
        <label className="text-sm font-medium">País *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={countryInputRef}
            type="text"
            placeholder="Digite o país..."
            value={countrySearch || country}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              if (e.target.value === "") {
                onCountryChange("");
              }
            }}
            onKeyDown={handleCountryKeyDown}
            onFocus={() => {
              if (filteredCountries.length > 0 && countrySearch.length > 0) {
                setCountryOpen(true);
              }
            }}
            className="pl-10"
            disabled={disabled}
          />
          {country && (
            <button
              type="button"
              onClick={() => {
                onCountryChange("");
                setCountrySearch("");
                setCountryOpen(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown de países */}
          {countryOpen && filteredCountries.length > 0 && (
            <div
              ref={countryDropdownRef}
              className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto"
              onMouseDown={(e) => {
                // Prevenir que o input perca foco ao clicar no dropdown
                e.preventDefault();
              }}
            >
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCountrySelect(c.name);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCountrySelect(c.name);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer",
                    country === c.name && "bg-accent text-accent-foreground"
                  )}
                >
                  {highlightText(c.name, countrySearch)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campo de Cidade */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Cidade *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {cityLoading && (
            <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Input
            ref={cityInputRef}
            type="text"
            placeholder={
              !country
                ? "Selecione o país primeiro"
                : country === "Brasil"
                ? "Digite a cidade (mín. 2 caracteres)..."
                : "Digite a cidade..."
            }
            value={cityQuery}
            onChange={(e) => {
              const value = e.target.value;
              setCityQuery(value);
              setIsUserTyping(true); // Marcar que o usuário está digitando
              if (value === "") {
                onCityChange("");
                onStateChange("");
                setCityOpen(false); // Fechar dropdown quando limpar
                setIsUserTyping(false); // Resetar flag quando limpar
              }
              // O dropdown será aberto automaticamente pelo useEffect quando houver resultados
            }}
            onKeyDown={handleCityKeyDown}
            onFocus={() => {
              // Quando ganhar foco, se houver cidade selecionada, limpar para permitir nova busca
              if (city && cityQuery.includes(", ")) {
                // Se o input contém "Cidade, Estado", limpar para permitir nova busca
                setCityQuery("");
                onCityChange("");
                onStateChange("");
                setIsUserTyping(false); // Resetar flag ao limpar
              }
              // Não abrir dropdown automaticamente ao ganhar foco
              setCityOpen(false);
            }}
            onBlur={(e) => {
              // Verificar se o foco está indo para o dropdown ou um botão dentro dele
              const relatedTarget = e.relatedTarget as HTMLElement;
              const isClickingDropdown = 
                cityDropdownRef.current?.contains(relatedTarget) ||
                relatedTarget?.closest('[data-city-dropdown]') ||
                relatedTarget?.closest('button[type="button"]');
              
              // Se não estiver clicando no dropdown, manter o formato "Cidade, Estado" no input
              if (!isClickingDropdown && city) {
                // Se houver cidade e estado selecionados, formatar como "Cidade, Estado"
                const state = externalState || "";
                const displayText = state ? `${city}, ${state}` : city;
                setCityQuery(displayText);
              }
            }}
            className="pl-10"
            disabled={disabled || !country}
          />
          {city && !cityQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCityChange("");
                onStateChange("");
                setCityQuery("");
                setCityOpen(false);
                cityInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Dropdown de cidades */}
          {cityOpen && cityResults.length > 0 && (
            <div
              ref={cityDropdownRef}
              data-city-dropdown
              className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto"
            >
              {cityResults.map((cityResult) => (
                <button
                  key={cityResult.id}
                  type="button"
                  onMouseDown={(e) => {
                    // Prevenir que o input perca foco antes do clique
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCitySelect(cityResult);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 cursor-pointer"
                  )}
                >
                  <div className="font-medium">
                    {highlightText(cityResult.name, cityQuery)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cityResult.state}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensagens de estado - apenas quando o usuário estiver digitando */}
          {isUserTyping && cityQuery.length > 0 && cityQuery.length < 2 && country === "Brasil" && (
            <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
          {isUserTyping && cityQuery.length >= 2 && !cityLoading && cityResults.length === 0 && !cityError && (
            <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
              Nenhuma cidade encontrada
            </div>
          )}
          {isUserTyping && cityError && (
            <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-destructive">
              <div className="font-medium">Erro ao buscar cidades</div>
              <div className="text-xs mt-1">{cityError}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
