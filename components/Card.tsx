"use client";

import { useEffect, useRef, useState } from "react";

type CardProps = {
  title: string;
  mediaDate?: string | null;
  mediaUrl: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  favorite?: boolean;
  disliked?: boolean;
  canFavorite?: boolean;
  priority?: boolean;
  onFavorite?: () => void;
  onDislike?: () => void;
  onOpen: () => void;
};

export default function Card({
  title,
  mediaUrl,
  mediaType,
  thumbnailUrl,
  mediaWidth,
  mediaHeight,
  favorite = false,
  disliked = false,
  canFavorite = false,
  priority = false,
  onFavorite,
  onDislike,
  onOpen,
}: CardProps) {
  const isVideo = mediaType === "video";
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  const hasRealSize =
    typeof mediaWidth === "number" &&
    typeof mediaHeight === "number" &&
    mediaWidth > 0 &&
    mediaHeight > 0;

  const aspectRatio = hasRealSize
    ? `${mediaWidth} / ${mediaHeight}`
    : isVideo
    ? "9 / 16"
    : "4 / 5";

  useEffect(() => {
    if (!isVideo) return;

    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "500px",
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  return (
    <div
      ref={cardRef}
      onClick={onOpen}
      className={`group cursor-pointer overflow-hidden rounded-md border bg-white transition md:rounded-xl ${
        disliked
          ? "border-neutral-200 opacity-45"
          : favorite
          ? "border-red-500"
          : "border-neutral-200 hover:border-red-500"
      }`}
      style={{ marginBottom: "6px" }}
    >
      <div
        className="relative overflow-hidden bg-neutral-100"
        style={{ aspectRatio }}
      >
        {isVideo ? (
          shouldLoadVideo ? (
            <video
              src={`${mediaUrl}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              className="pointer-events-none absolute inset-0 h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 pl-0.5 text-xs text-white md:h-10 md:w-10 md:text-sm">
                ▶
              </div>
            </div>
          )
        ) : (
          <img
            src={thumbnailUrl || mediaUrl}
            alt={title}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
          />
        )}

        {isVideo && shouldLoadVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/95 pl-0.5 text-[10px] text-white shadow-sm md:h-10 md:w-10 md:text-sm">
              ▶
            </div>
          </div>
        )}

        {canFavorite && (
          <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite?.();
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition md:h-8 md:w-8 md:text-sm ${
                favorite
                  ? "bg-red-600 text-white"
                  : "bg-white text-red-600 hover:bg-red-50"
              }`}
              title="Favorite"
            >
              {favorite ? "♥" : "♡"}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDislike?.();
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition md:h-8 md:w-8 md:text-sm ${
                disliked
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
              title="Dislike"
            >
              ↓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}