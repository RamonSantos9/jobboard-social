"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthLoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl");
    const redirectUrl = callbackUrl
      ? `/feed/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/feed/auth/login";
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecionando...</p>
    </div>
  );
}

export default function AuthLoginRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    }>
      <AuthLoginRedirectContent />
    </Suspense>
  );
}


