"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface UserComboboxProps {
  onSelect: (userId: string, userName?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string; // Valor controlado externamente
  onClear?: () => void; // Callback para limpar valor
}

export function UserCombobox({
  onSelect,
  placeholder = "Selecionar usuário...",
  disabled = false,
  value: externalValue,
  onClear,
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Usar valor externo se fornecido, senão usar valor interno
  const value = externalValue !== undefined ? externalValue : internalValue;

  // Limpar valor interno quando valor externo for limpo
  React.useEffect(() => {
    if (externalValue === "" && internalValue !== "") {
      setInternalValue("");
    }
  }, [externalValue, internalValue]);

  // Buscar usuários quando o popover abrir ou quando a query mudar
  React.useEffect(() => {
    if (!open) {
      // Limpar busca quando fechar, mas manter usuários se houver valor selecionado
      if (!value) {
        setUsers([]);
      }
      setSearchQuery("");
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        let response;
        if (searchQuery.length >= 2) {
          // Buscar por query se tiver pelo menos 2 caracteres
          response = await fetch(
            `/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`
          );
        } else {
          // Buscar usuários recentes (primeiros 20) quando abrir sem query
          response = await fetch(`/api/admin/users?limit=20&page=1`);
        }

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erro ao buscar usuários:", errorData);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce apenas para busca por query
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(fetchUsers, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Buscar imediatamente quando abrir sem query
      fetchUsers();
    }
  }, [searchQuery, open, value]);

  // Buscar usuário selecionado se necessário
  React.useEffect(() => {
    if (value && users.length === 0 && !loading && open) {
      // Se tiver valor mas não tiver usuários, buscar usuários recentes
      const fetchUsers = async () => {
        try {
          const response = await fetch(`/api/admin/users?limit=20&page=1`);
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [value, users.length, loading, open]);

  const selectedUser = users.find((user) => user._id === value);

  const handleUserSelect = React.useCallback((userId: string, userName: string) => {
    if (externalValue === undefined) {
      setInternalValue(userId);
    }
    onSelect(userId, userName);
    setOpen(false);
  }, [externalValue, onSelect]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedUser
            ? (
                <span className="truncate">
                  {selectedUser.name} ({selectedUser.email.length > 20 
                    ? `${selectedUser.email.substring(0, 20)}...` 
                    : selectedUser.email})
                </span>
              )
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false} loop={false}>
          <CommandInput
            placeholder="Pesquisar usuário..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : !loading && users.length === 0 && searchQuery.length >= 2 ? (
              <CommandEmpty>
                Nenhum usuário encontrado.
              </CommandEmpty>
            ) : users.length === 0 && searchQuery.length === 0 ? (
              <CommandEmpty>
                Digite para buscar usuários...
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {users.map((user) => {
                  const isSelected = value === user._id;
                  return (
                    <div
                      key={user._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUserSelect(user._id, user.name || user.email);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleUserSelect(user._id, user.name || user.email);
                      }}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
