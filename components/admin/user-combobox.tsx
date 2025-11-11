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
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface UserComboboxProps {
  onSelect: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserCombobox({
  onSelect,
  placeholder = "Selecionar usuário...",
  disabled = false,
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (open && searchQuery.length >= 2) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`
          );
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users || []);
          } else {
            toast.error("Erro ao buscar usuários");
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          toast.error("Erro ao buscar usuários");
        } finally {
          setLoading(false);
        }
      };

      const timeoutId = setTimeout(fetchUsers, 300);
      return () => clearTimeout(timeoutId);
    } else if (open && searchQuery.length < 2) {
      setUsers([]);
    }
  }, [searchQuery, open]);

  const selectedUser = users.find((user) => user._id === value);

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
            ? `${selectedUser.name} (${selectedUser.email})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
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
            ) : users.length === 0 ? (
              <CommandEmpty>
                {searchQuery.length < 2
                  ? "Digite pelo menos 2 caracteres para pesquisar"
                  : "Nenhum usuário encontrado."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user._id}
                    value={user._id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      if (currentValue !== value) {
                        onSelect(currentValue);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

