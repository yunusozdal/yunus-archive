type CardProps = {
  title: string;
  mediaDate?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null;
  favorite?: boolean;
  canFavorite?: boolean;
  onFavorite?: () => void;
  onOpen: () => void;
};

export default function Card({
  title,
  mediaUrl,
  mediaType,
  thumbnailUrl,
  favorite = false,
  canFavorite = false,
  onFavorite,
  onOpen,
}: CardProps) {
  const isVideo = mediaType === "video";
  const imageSrc = isVideo ? thumbnailUrl : thumbnailUrl || mediaUrl;

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-red-500 md:rounded-xl [content-visibility:auto] [contain-intrinsic-size:180px]"
      style={{ marginBottom: "6px" }}
    >
      <div className="relative overflow-hidden bg-neutral-100">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex aspect-[9/12] w-full items-center justify-center bg-red-50">
            <div className="flex flex-col items-center gap-2 text-red-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 pl-0.5 text-xs text-white">
                ▶
              </div>

              <span className="text-[9px] font-medium">Video</span>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/95 pl-0.5 text-[10px] text-white shadow-sm md:h-10 md:w-10 md:text-sm">
              ▶
            </div>
          </div>
        )}

        <div className="absolute left-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-medium text-red-600 md:px-2 md:text-xs">
          {isVideo ? "Video" : "Image"}
        </div>

        {canFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs transition md:h-8 md:w-8 md:text-sm ${
              favorite
                ? "bg-red-600 text-white"
                : "bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {favorite ? "♥" : "♡"}
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-8 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="truncate text-[9px] font-medium text-white md:text-xs">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}