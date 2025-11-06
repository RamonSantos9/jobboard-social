"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para /feed
    router.push("/feed");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center"></div>
  );
}
