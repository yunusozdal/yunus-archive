type CardProps = {
  title: string;
  mediaDate?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  onOpen: () => void;
};

export default function Card({
  title,
  mediaUrl,
  mediaType,
  onOpen,
}: CardProps) {
  return (
    <div
      onClick={onOpen}
      className="group mb-5 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-red-500"
    >
      <div className="relative overflow-hidden bg-neutral-100">
        {mediaType === "video" ? (
          <>
            <video
              src={mediaUrl}
              muted
              playsInline
              className="w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 pl-1 text-white">
                ▶
              </div>
            </div>

            <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-red-600">
              Video
            </div>
          </>
        ) : (
          <>
            <img
              src={mediaUrl}
              alt={title}
              className="w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />

            <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-red-600">
              Image
            </div>
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-10 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="truncate text-sm font-medium text-white">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}