"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration = 3000) =>
      addToast({ message, type: "success", duration }),
    error: (message: string, duration = 3000) =>
      addToast({ message, type: "error", duration }),
    info: (message: string, duration = 3000) =>
      addToast({ message, type: "info", duration }),
    warning: (message: string, duration = 3000) =>
      addToast({ message, type: "warning", duration }),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}


