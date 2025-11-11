"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/feed/auth/register");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecionando...</p>
    </div>
  );
}


