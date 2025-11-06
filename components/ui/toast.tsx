"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onRemove: (id: string) => void;
}

export function Toast({
  id,
  message,
  type,
  duration = 3000,
  onRemove,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animar entrada
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto remover após duração
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm w-full mx-auto transform transition-all duration-300 ease-in-out",
        isVisible && !isRemoving
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-full opacity-0 scale-95"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm",
          getBackgroundColor()
        )}
      >
        {getIcon()}
        <p className="text-sm font-medium text-gray-900 flex-1">{message}</p>
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="transform transition-all duration-300 ease-in-out"
          style={{
            transform: `translateY(${index * -8}px)`,
            zIndex: 50 - index,
          }}
        >
          <Toast {...toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}


