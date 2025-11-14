"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { institutions, Institution } from "@/lib/institutions-data";

interface InstitutionComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Função auxiliar para normalizar strings (remover acentos e converter para minúsculas)
const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

// Função auxiliar para destacar o texto da busca
const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);
  
  // Encontrar a posição do match (case-insensitive, sem acentos)
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text;
  
  // Extrair a parte correspondente do texto original
  const matchLength = query.length;
  const parts = [];
  let currentIndex = 0;
  
  // Adicionar parte antes do match
  if (index > 0) {
    parts.push(text.substring(0, index));
    currentIndex = index;
  }
  
  // Adicionar parte destacada
  parts.push(
    <mark key="match" className="bg-yellow-200 font-semibold">
      {text.substring(currentIndex, currentIndex + matchLength)}
    </mark>
  );
  currentIndex += matchLength;
  
  // Adicionar parte depois do match
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  return <span>{parts}</span>;
};

export function InstitutionCombobox({
  value = "",
  onChange,
  disabled = false,
}: InstitutionComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [isUserTyping, setIsUserTyping] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Inicializar query quando value mudar externamente
  React.useEffect(() => {
    if (value && query === "" && !isUserTyping) {
      setQuery(value);
      setIsUserTyping(false);
    }
  }, [value]);

  // Filtrar instituições baseado na pesquisa
  const filteredInstitutions = React.useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const normalizedQuery = normalizeString(query);
    return institutions
      .filter((inst) => {
        const normalizedName = normalizeString(inst.name);
        return normalizedName.includes(normalizedQuery);
      })
      .slice(0, 20); // Limitar a 20 resultados
  }, [query]);

  // Abrir dropdown quando houver resultados e usuário estiver digitando
  React.useEffect(() => {
    if (isUserTyping && query.length >= 2 && filteredInstitutions.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [query, filteredInstitutions, isUserTyping]);

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setTimeout(() => {
          setOpen(false);
        }, 150);
      }
    };

    document.addEventListener("click", handleClickOutside, true);

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  const handleSelect = (institution: Institution) => {
    onChange(institution.name);
    setQuery(institution.name);
    setIsUserTyping(false);
    setOpen(false);
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    if (newValue === "") {
      setIsUserTyping(false);
      setOpen(false);
      onChange("");
    } else {
      setIsUserTyping(true);
      // Atualizar o valor externo imediatamente para permitir digitação livre
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    // Se houver valor, permitir edição
    if (value && query === value) {
      // Manter o valor mas permitir edição
    }
    setOpen(false);
  };

  const handleBlur = () => {
    // Se não houver seleção, manter o que foi digitado
    if (query && !filteredInstitutions.some((inst) => inst.name === query)) {
      // O valor já foi atualizado no onChange
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Instituição de Ensino</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Digite o nome da instituição..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10"
          disabled={disabled}
        />
        {query && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuery("");
              onChange("");
              setIsUserTyping(false);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown de instituições */}
        {open && filteredInstitutions.length > 0 && (
          <div
            ref={dropdownRef}
            data-institution-dropdown
            className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md max-h-[300px] overflow-y-auto"
          >
            {filteredInstitutions.map((institution) => (
              <button
                key={institution.code || institution.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(institution);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b last:border-b-0 cursor-pointer"
                )}
              >
                <div className="font-medium">
                  {highlightText(institution.name, query)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mensagens de estado - apenas quando o usuário estiver digitando */}
        {isUserTyping && query.length > 0 && query.length < 2 && (
          <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
            Digite pelo menos 2 caracteres para buscar
          </div>
        )}
        {isUserTyping &&
          query.length >= 2 &&
          filteredInstitutions.length === 0 && (
            <div className="absolute z-[9999] w-full mt-1 bg-popover border rounded-md shadow-md p-3 text-sm text-muted-foreground">
              Nenhuma instituição encontrada. Continue digitando para adicionar manualmente.
            </div>
          )}
      </div>
    </div>
  );
}

