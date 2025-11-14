export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Grid 70/30 */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Coluna Esquerda - 70% (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Principal */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {/* Banner */}
              <div className="w-full h-[150px] bg-gray-200"></div>

              <div className="px-4 pb-4 pt-2">
                {/* Foto de Perfil */}
                <div className="relative -mt-16 mb-4">
                  <div className="w-[152px] h-[152px] bg-gray-200 rounded-full border-4 border-white"></div>
                  <div className="absolute top-22 right-0 w-6 h-6 bg-gray-200 rounded-full"></div>
                </div>

                {/* Grid de 2 colunas */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Coluna 1 */}
                  <div className="space-y-2">
                    {/* Nome */}
                    <div className="h-7 bg-gray-200 rounded w-48"></div>
                    {/* Headline */}
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                    {/* Localização */}
                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                    {/* Link */}
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>

                  {/* Coluna 2 */}
                  <div className="flex justify-end items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Sobre */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>

            {/* Card Experiência */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-48"></div>
                      <div className="h-4 bg-gray-200 rounded w-36"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                      <div className="space-y-1 mt-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Educação */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-52"></div>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Habilidades */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-full w-24"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita - 30% (3 colunas) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Card Sugestões */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

