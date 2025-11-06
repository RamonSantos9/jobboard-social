import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Rotas que requerem autenticação
  const protectedRoutes = ["/dashboard", "/company", "/invite"];

  // Rotas que requerem ser admin de empresa
  const adminRoutes = ["/company/[id]/invite"];

  // Verificar se a rota precisa de autenticação
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  // Verificar se a rota precisa de admin
  const needsAdmin = adminRoutes.some((route) => {
    const regex = new RegExp(route.replace(/\[.*?\]/g, "[^/]+"));
    return regex.test(pathname);
  });

  // Se precisa de autenticação mas não está logado
  if (needsAuth && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se precisa de admin, verificar se é admin da empresa
  if (needsAdmin && token) {
    // Para rotas de admin de empresa, precisamos verificar no backend
    // O middleware aqui só redireciona se não estiver logado
    // A verificação específica de admin será feita nas APIs
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
