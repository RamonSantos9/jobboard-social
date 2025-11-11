"use client";

interface MediaGridLayoutProps {
  mediaUrls: string[];
  mediaType?: "image" | "video";
  onImageClick: (index: number) => void;
}

export default function MediaGridLayout({
  mediaUrls,
  mediaType = "image",
  onImageClick,
}: MediaGridLayoutProps) {
  const count = mediaUrls.length;

  if (count === 0) return null;

  // 1 imagem: imagem única grande
  if (count === 1) {
    return (
      <div
        className="mb-3 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
        onClick={() => onImageClick(0)}
      >
        {mediaType === "image" ? (
          <img
            src={mediaUrls[0]}
            alt="Post media"
            className="w-full object-contain"
          />
        ) : (
          <video
            src={mediaUrls[0]}
            controls
            className="w-full object-contain"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        )}
      </div>
    );
  }

  // 2 imagens: grid 2 colunas 50/50 lado a lado (sem destaque)
  if (count === 2) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1">
        <div
          className="overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
          onClick={() => onImageClick(0)}
        >
          <img
            src={mediaUrls[0]}
            alt="Post media 1"
            className="w-full h-full object-contain"
          />
        </div>
        <div
          className="overflow-hidden  cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
          onClick={() => onImageClick(1)}
        >
          <img
            src={mediaUrls[1]}
            alt="Post media 2"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  // 3 imagens: primeira grande (h-2/3), grid 2 colunas abaixo (h-1/3)
  if (count === 3) {
    return (
      <div className="mb-3 flex flex-col gap-1">
        <div
          className="overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
          onClick={() => onImageClick(0)}
        >
          <img
            src={mediaUrls[0]}
            alt="Post media 1"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="grid grid-cols-2 gap-1 h-[200px]">
          <div
            className="overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
            onClick={() => onImageClick(1)}
          >
            <img
              src={mediaUrls[1]}
              alt="Post media 2"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className="overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
            onClick={() => onImageClick(2)}
          >
            <img
              src={mediaUrls[2]}
              alt="Post media 3"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4 imagens: grid 2x2
  if (count === 4) {
    return (
      <div className="mb-3 grid grid-cols-2 gap-1">
        {mediaUrls.map((url, index) => (
          <div
            key={index}
            className="overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
            onClick={() => onImageClick(index)}
          >
            <img
              src={url}
              alt={`Post media ${index + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    );
  }

  // 5+ imagens: primeira grande (h-2/3), grid 2x2 abaixo (h-1/3) com "+N" na 4ª imagem
  const remainingCount = count - 4;
  const displayUrls = mediaUrls.slice(0, 4);

  return (
    <div className="mb-3 flex flex-col gap-1">
      <div
        className="overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center"
        onClick={() => onImageClick(0)}
      >
        <img
          src={mediaUrls[0]}
          alt="Post media 1"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="grid grid-cols-2 gap-1 h-[200px]">
        {displayUrls.slice(1, 4).map((url, index) => {
          const actualIndex = index + 1;
          const isLast = actualIndex === 3;

          return (
            <div
              key={actualIndex}
              className="overflow-hidden border bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center relative"
              onClick={() => onImageClick(actualIndex)}
            >
              <img
                src={url}
                alt={`Post media ${actualIndex + 1}`}
                className="w-full h-full object-contain"
              />
              {isLast && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
