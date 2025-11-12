"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { displayConsoleLogo } from "@/lib/console-logo";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    displayConsoleLogo();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
