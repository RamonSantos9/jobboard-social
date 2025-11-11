"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ScrollWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dashboard" | "subtle";
}

export function ScrollWrapper({
  children,
  className,
  variant = "default",
}: ScrollWrapperProps) {
  return (
    <ScrollArea className={cn("h-full w-full", className)}>
      <div className="min-h-full">
        {children}
      </div>
    </ScrollArea>
  );
}

