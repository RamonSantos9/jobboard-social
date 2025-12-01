"use client";

import { useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import LinkedInIcon from "./LinkedInIcon";
import SearchModal from "./SearchModal";

export function ButtonGroupInput() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <>
      <ButtonGroup className="border border-gray-300 rounded-full overflow-hidden bg-white">
        <div className="flex items-center w-full">
          <LinkedInIcon
            id="search-small"
            size={16}
            className="ml-3 text-gray-500"
          />
          <Input
            placeholder="Pesquisar"
            className="border-none focus-visible:ring-0 bg-transparent text-sm pl-2 cursor-pointer"
            onClick={() => setSearchModalOpen(true)}
            readOnly
          />
        </div>
      </ButtonGroup>

      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
}
