/** @type {import('tailwindcss').Config} */
module.exports = {
  // No Tailwind v4, a configuração principal é feita no CSS usando @theme
  // Mantemos apenas o essencial aqui
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  // Plugins ainda são suportados
  plugins: [require("tailwindcss-animate")],
};
