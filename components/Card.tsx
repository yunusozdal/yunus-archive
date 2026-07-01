type CardProps = {
  title: string;
  mediaDate?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  favorite?: boolean;
  canFavorite?: boolean;
  onFavorite?: () => void;
  onOpen: () => void;
};

export default function Card({
  title,
  mediaUrl,
  mediaType,
  favorite = false,
  canFavorite = false,
  onFavorite,
  onOpen,
}: CardProps) {
  return (
    <div
      onClick={onOpen}
      className="group mb-1 break-inside-avoid cursor-pointer overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:border-red-500 md:mb-2 md:rounded-xl"
    >
      <div className="relative overflow-hidden bg-neutral-100">
        {mediaType === "video" ? (
          <>
            <video
              src={mediaUrl}
              muted
              playsInline
              preload="metadata"
              className="pointer-events-none h-auto w-full transition duration-300 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 pl-0.5 text-[10px] text-white md:h-10 md:w-10 md:text-sm">
                ▶
              </div>
            </div>

            <div className="absolute left-1 top-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-medium text-red-600 md:left-2 md:top-2 md:text-xs">
              Video
            </div>
          </>
        ) : (
          <>
            <img
              src={mediaUrl}
              alt={title}
              className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
            />

            <div className="absolute left-1 top-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-medium text-red-600 md:left-2 md:top-2 md:text-xs">
              Image
            </div>
          </>
        )}

        {canFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className={`absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs transition md:right-2 md:top-2 md:h-8 md:w-8 ${
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