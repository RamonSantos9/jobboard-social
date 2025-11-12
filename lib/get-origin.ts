/**
 * Obtém a origem da URL atual (domain + protocol)
 * Funciona tanto no servidor quanto no cliente
 */
export function getOrigin(): string {
  // No servidor, usar variável de ambiente
  if (typeof window === "undefined") {
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }
  
  // No cliente, usar window.location
  return window.location.origin;
}

/**
 * Obtém a URL completa de uma rota
 */
export function getUrl(path: string): string {
  const origin = getOrigin();
  // Remover barra inicial duplicada se houver
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

