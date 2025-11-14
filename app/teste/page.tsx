"use client";

import LinkedInIcon from "@/components/LinkedInIcon";
import { useState } from "react";

export default function TestePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, iconId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(iconId);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const svgs = [
    {
      name: "userplaceholder.svg",
      path: "/placeholder/userplaceholder.svg",
      usage: "Foto de perfil (fallback quando não há photoUrl)",
    },
    {
      name: "studyorvacancies.svg",
      path: "/placeholder/studyorvacancies.svg",
      usage: "Logo da Instituição de Ensino",
    },
    {
      name: "personbanner.svg",
      path: "/placeholder/personbanner.svg",
      usage: "Banner do perfil (fallback quando não há bannerUrl)",
    },
    {
      name: "placeholder-avatar.svg",
      path: "/placeholder/placeholder-avatar.svg",
      usage: "Avatar genérico (disponível mas não usado no layout atual)",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Página de Teste - Visualização de SVGs
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {svgs.map((svg) => (
            <div
              key={svg.name}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {svg.name}
              </h2>
              {svg.usage && (
                <p className="text-sm text-gray-600 mb-4">{svg.usage}</p>
              )}
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 mb-4 min-h-[200px]">
                <img
                  src={svg.path}
                  alt={svg.name}
                  className="max-w-full max-h-[200px] object-contain"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-mono break-all">{svg.path}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SVG de Link Externo do LinkedIn */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Link Externo SVG (LinkedIn)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Usado no link do portfólio/website do perfil
          </p>
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-4 mb-4 min-h-[100px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-16 h-16 text-blue-600"
              aria-hidden="true"
            >
              <path d="M15 1v6h-2V4.41L7.41 10 6 8.59 11.59 3H9V1zm-4 10a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h2V3H5a3 3 0 00-3 3v5a3 3 0 003 3h5a3 3 0 003-3V9h-2z"></path>
            </svg>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-mono">SVG inline - Link Externo do LinkedIn</p>
          </div>
        </div>

        {/* Exemplo de uso no link */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Exemplo de Uso no Link
          </h2>
          <a
            href="https://ramonsantosportfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <strong>RamonSantos-Portfólio</strong>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M15 1v6h-2V4.41L7.41 10 6 8.59 11.59 3H9V1zm-4 10a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h2V3H5a3 3 0 00-3 3v5a3 3 0 003 3h5a3 3 0 003-3V9h-2z"></path>
            </svg>
          </a>
        </div>

        {/* Novos Ícones do Sprite LinkedIn */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Novos Ícones do Sprite LinkedIn
            </h2>
            <p className="text-sm text-gray-600">
              Todos os novos ícones adicionados ao sprite. Clique em "Copiar Código" para usar facilmente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { id: "edit-medium", name: "Editar (Medium)", size: 24 },
              { id: "analytics-medium", name: "Analytics", size: 24 },
              { id: "camera-small", name: "Câmera (Small)", size: 16 },
              { id: "camera-medium", name: "Câmera (Medium)", size: 24 },
              { id: "share-linkedin-medium", name: "Compartilhar LinkedIn", size: 24 },
              { id: "download-medium", name: "Download", size: 24 },
              { id: "bookmark-fill-medium", name: "Favorito", size: 24 },
              { id: "newspaper-medium", name: "Notícias", size: 24 },
              { id: "signal-notice-medium", name: "Notificação", size: 24 },
              { id: "skills-medium", name: "Habilidades (Medium)", size: 24 },
              { id: "skills-small", name: "Habilidades (Small)", size: 16 },
              { id: "chevron-left-small", name: "Seta Esquerda", size: 16 },
              { id: "link-external-small", name: "Link Externo (Small)", size: 16 },
              { id: "link-external-medium", name: "Link Externo (Medium)", size: 24 },
              { id: "check-small", name: "Check", size: 16 },
              { id: "linkedin-bug-medium", name: "Logo LinkedIn", size: 24 },
              { id: "phone-handset-medium", name: "Telefone", size: 24 },
              { id: "location-marker-medium", name: "Localização", size: 24 },
              { id: "envelope-medium", name: "Email", size: 24 },
              { id: "calendar-medium", name: "Calendário", size: 24 },
              { id: "visibility-small", name: "Visibilidade", size: 16 },
              { id: "trash-small", name: "Lixeira (Small)", size: 16 },
              { id: "trash-medium", name: "Lixeira (Medium)", size: 24 },
              { id: "question-medium", name: "Pergunta", size: 24 },
              { id: "settings-medium", name: "Configurações", size: 24 },
              { id: "shield-medium", name: "Proteção", size: 24 },
              { id: "filter-small", name: "Filtro", size: 16 },
              { id: "premium-chip-medium", name: "Premium", size: 24 },
              { id: "chevron-down-medium", name: "Seta Baixo (Medium)", size: 24 },
              { id: "chevron-up-medium", name: "Seta Cima (Medium)", size: 24 },
            ].map((icon) => {
              const codeExample = `<LinkedInIcon id="${icon.id}" size={${icon.size}} />`;
              const svgExample = `<svg width="${icon.size}" height="${icon.size}" viewBox="0 0 ${icon.size} ${icon.size}" fill="currentColor">
  <use href="#${icon.id}" />
</svg>`;

              return (
                <div
                  key={icon.id}
                  className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {icon.name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {icon.size}x{icon.size}
                    </span>
                  </div>

                  {/* Preview do Ícone */}
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg p-6 mb-4 min-h-[120px]">
                    <LinkedInIcon
                      id={icon.id}
                      size={icon.size === 16 ? 48 : 64}
                      className="text-gray-700"
                    />
                  </div>

                  {/* ID do Ícone */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">ID:</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                      {icon.id}
                    </code>
                  </div>

                  {/* Botões de Copiar */}
                  <div className="space-y-2">
                    <button
                      onClick={() => copyToClipboard(codeExample, `${icon.id}-code`)}
                      className={`w-full text-xs px-3 py-2 rounded-md transition-colors ${
                        copiedId === `${icon.id}-code`
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {copiedId === `${icon.id}-code` ? "✓ Copiado!" : "📋 Copiar Componente"}
                    </button>
                    <button
                      onClick={() => copyToClipboard(svgExample, `${icon.id}-svg`)}
                      className={`w-full text-xs px-3 py-2 rounded-md transition-colors ${
                        copiedId === `${icon.id}-svg`
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {copiedId === `${icon.id}-svg` ? "✓ Copiado!" : "📋 Copiar SVG"}
                    </button>
                  </div>

                  {/* Código de Exemplo (Oculto por padrão, pode expandir) */}
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Ver código
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Componente:</p>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          <code>{codeExample}</code>
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">SVG Direto:</p>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          <code>{svgExample}</code>
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seção de Informações */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 Como Usar
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>1. Usando o Componente:</strong> Importe{" "}
              <code className="bg-blue-100 px-1 rounded">LinkedInIcon</code> e use:
            </p>
            <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
              <code>{`import LinkedInIcon from "@/components/LinkedInIcon";

<LinkedInIcon id="edit-medium" size={24} />`}</code>
            </pre>
            <p>
              <strong>2. Usando SVG Direto:</strong> Use o elemento{" "}
              <code className="bg-blue-100 px-1 rounded">&lt;use&gt;</code>:
            </p>
            <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
              <code>{`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <use href="#edit-medium" />
</svg>`}</code>
            </pre>
            <p>
              <strong>3. Personalizar Cor:</strong> Use classes do Tailwind como{" "}
              <code className="bg-blue-100 px-1 rounded">text-blue-600</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
