/**
 * Exibe o logo "RAMON SANTOS" no console do navegador
 * RAMON aparece em cima, SANTOS aparece em baixo
 */
export function displayConsoleLogo() {
  if (typeof window === "undefined") return;

  // RAMON - Parte de cima
  const ramon = `%c
    ██████╗  █████╗ ███╗   ███╗ ██████╗ ███╗   ██╗
    ██╔══██╗██╔══██╗████╗ ████║██╔═══██╗████╗  ██║
    ██████╔╝███████║██╔████╔██║██║   ██║██╔██╗ ██║
    ██╔══██╗██╔══██║██║╚██╔╝██║██║   ██║██║╚██╗██║
    ██║  ██║██║  ██║██║ ╚═╝ ██║╚██████╔╝██║ ╚████║
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝`;

  // SANTOS - Parte de baixo
  const santos = `%c
   ███████╗ █████╗ ███╗   ██╗████████╗ ██████╗ ███████╗
   ██╔════╝██╔══██╗████╗  ██║╚══██╔══╝██╔═══██╗██╔════╝
   ███████╗███████║██╔██╗ ██║   ██║   ██║   ██║███████╗
   ╚════██║██╔══██║██║╚██╗██║   ██║   ██║   ██║╚════██║
   ███████║██║  ██║██║ ╚████║   ██║   ╚██████╔╝███████║
   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚══════╝`;

  const style =
    "font-family: monospace; font-size: 11px; color: #2563eb; font-weight: bold; line-height: 1.2;";

  // Exibir RAMON em cima
  console.log(ramon, style);

  // Exibir SANTOS em baixo
  console.log(santos, style);

  // Mensagem adicional
  console.log(
    "%cDesenvolvido por Ramon Santos",
    "font-family: monospace; font-size: 9px; color: white;"
  );
}
