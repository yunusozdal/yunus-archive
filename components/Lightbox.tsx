"use client";

import { useEffect } from "react";

type Work = {
  id: string;
  title: string;
  media_date?: string | null;
  media_url: string;
  media_type: "image" | "video";
};

type LightboxProps = {
  work: Work | null;
  onClose: () => void;
  onDelete: () => void;
  canDelete: boolean;
};

export default function Lightbox({
  work,
  onClose,
  onDelete,
  canDelete,
}: LightboxProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (work) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [work, onClose]);

  if (!work) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-4 py-8 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-neutral-200 bg-white"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
        >
          ✕
        </button>

        <div className="flex max-h-[82vh] items-center justify-center bg-neutral-100">
          {work.media_type === "video" ? (
            <video
              src={work.media_url}
              controls
              playsInline
              preload="metadata"
              className="max-h-[82vh] w-full object-contain"
            />
          ) : (
            <img
              src={work.media_url}
              alt=""
              className="max-h-[82vh] w-full object-contain"
            />
          )}
        </div>

        {canDelete && (
          <div className="flex justify-end gap-2 p-4">
            <button
              onClick={onDelete}
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Delete
            </button>

            <a
              href={work.media_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Open
            </a>
          </div>
        )}
      </div>
    </div>
  );
}