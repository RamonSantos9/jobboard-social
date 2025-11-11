import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();

  const { pathname } = request.nextUrl;

  // Rotas públicas que não requerem autenticação (rotas de autenticação)
  const publicAuthRoutes = [
    "/feed/auth/login",
    "/feed/auth/register",
    "/feed/auth/forgot-password",
    "/auth/login",
    "/auth/register",
  ];

  // Se for uma rota pública de autenticação, permitir acesso
  if (publicAuthRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Rotas que requerem autenticação
  const protectedRoutes = [
    "/dashboard",
    "/company",
    "/invite",
    "/admin",
    "/feed",
    "/jobs",
    "/notifications",
    "/settings",
  ];

  // Rotas que requerem ser admin do sistema
  const systemAdminRoutes = ["/admin"];

  // Rotas que requerem ser admin de empresa
  const companyAdminRoutes = ["/company/[id]/admin", "/company/[id]/invite"];

  // Verificar se a rota precisa de autenticação
  const needsAuth = protectedRoutes.some((route) => pathname.startsWith(route));

  // Verificar se a rota precisa de admin do sistema
  const needsSystemAdmin = systemAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se a rota precisa de admin de empresa
  const needsCompanyAdmin = companyAdminRoutes.some((route) => {
    const regex = new RegExp(route.replace(/\[.*?\]/g, "[^/]+"));
    return regex.test(pathname);
  });

  // Se precisa de autenticação mas não está logado
  if (needsAuth && !session) {
    const loginUrl = new URL("/feed/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se precisa de admin do sistema, verificar na sessão
  // A verificação completa será feita nas APIs, mas aqui podemos fazer uma verificação básica
  if (needsSystemAdmin && session) {
    // A verificação de role será feita nas APIs
    // O middleware aqui só garante que está autenticado
  }

  // Se precisa de admin de empresa, verificar na sessão
  // A verificação completa será feita nas APIs
  if (needsCompanyAdmin && session) {
    // A verificação de admin/recrutador será feita nas APIs
    // O middleware aqui só garante que está autenticado
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
