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
  const hasThumbnail = Boolean(thumbnailUrl);

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-white transition hover:border-red-500 md:rounded-xl"
      style={{ marginBottom: "4px" }}
    >
      <div className="relative overflow-hidden bg-neutral-100">
        {mediaType === "video" ? (
          hasThumbnail ? (
            <img
              src={thumbnailUrl || ""}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <video
              src={`${mediaUrl}#t=0.2`}
              muted
              playsInline
              preload="metadata"
              className="pointer-events-none h-auto w-full transition duration-300 group-hover:scale-[1.02]"
            />
          )
        ) : (
          <img
            src={thumbnailUrl || mediaUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-auto w-full transition duration-300 group-hover:scale-[1.02]"
          />
        )}

        {mediaType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 pl-0.5 text-[9px] text-white md:h-10 md:w-10 md:text-sm">
              ▶
            </div>
          </div>
        )}

        <div className="absolute left-1 top-1 rounded-full bg-white px-1 py-0.5 text-[7px] font-medium text-red-600 md:px-2 md:text-xs">
          {mediaType === "video" ? "Video" : "Image"}
        </div>

        {canFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className={`absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition md:h-8 md:w-8 md:text-sm ${
              favorite
                ? "bg-red-600 text-white"
                : "bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {favorite ? "♥" : "♡"}
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1.5 pt-6 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:px-3 md:pb-3 md:pt-8">
          <p className="truncate text-[8px] font-medium text-white md:text-xs">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}