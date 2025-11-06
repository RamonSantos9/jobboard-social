"use client";

import { useState, useEffect } from "react";
import { Skiper39 } from "@/components/ui/skiper-ui/skiper39";

interface LoadingWrapperProps {
  children: React.ReactNode;
  duration?: number; // Duração em milissegundos
}

const LoadingWrapper = ({ children, duration = 2000 }: LoadingWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (isLoading) {
    return <Skiper39 />;
  }

  return <>{children}</>;
};

export default LoadingWrapper;
