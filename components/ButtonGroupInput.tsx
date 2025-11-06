import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";

export function ButtonGroupInput() {
  return (
    <ButtonGroup className="border border-gray-300 rounded-full overflow-hidden bg-white">
      <div className="flex items-center w-full">
        <SearchIcon className="ml-3 text-gray-500 w-4 h-4" />
        <Input
          placeholder="Pesquisar"
          className="border-none focus-visible:ring-0 bg-transparent text-sm pl-2"
        />
      </div>
    </ButtonGroup>
  );
}
