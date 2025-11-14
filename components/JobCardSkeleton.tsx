export default function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border animate-pulse">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Nome da empresa */}
              <div className="h-4 bg-gray-200 rounded w-32" />
              {/* Localização */}
              <div className="h-3 bg-gray-200 rounded w-24" />
              {/* Tempo */}
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>

          {/* Botão salvar skeleton */}
          <div className="w-8 h-8 rounded bg-gray-200 shrink-0" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Título */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Informações */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-6 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-32" />
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-18" />
          <div className="h-6 bg-gray-200 rounded-full w-22" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
          <div className="h-9 bg-gray-200 rounded flex-1" />
          <div className="h-9 bg-gray-200 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

