"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import Lightbox from "./Lightbox";
import { supabase } from "../lib/supabase";
import {
  deleteWork,
  getWorks,
  toggleDislike,
  toggleFavorite,
  updateMediaMeta,
} from "../lib/storage";

type Work = {
  id: string;
  title: string;
  media_date?: string | null;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url?: string | null;
  media_width?: number | null;
  media_height?: number | null;
  image_url?: string;
  created_at: string;
  favorite?: boolean;
  disliked?: boolean;
};

type GalleryProps = {
  isAdmin: boolean;
};

export default function Gallery({ isAdmin }: GalleryProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [columnCount, setColumnCount] = useState(2);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState("");

  useEffect(() => {
    function updateLayout() {
      const width = window.innerWidth;

      if (width < 640) {
        setColumnCount(2);
      } else if (width < 1024) {
        setColumnCount(3);
      } else {
        setColumnCount(5);
      }
    }

    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  function parseMediaDate(dateString?: string | null) {
    if (!dateString) return 0;

    const [day, month, year] = dateString.split(".").map(Number);

    if (!day || !month || !year) return 0;

    return new Date(year, month - 1, day).getTime();
  }

  function getPriority(work: Work) {
    if (work.favorite) return 0;
    if (work.disliked) return 2;
    return 1;
  }

  function sortWorks(items: Work[]) {
    return [...items].sort((a, b) => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const dateA = parseMediaDate(a.media_date);
      const dateB = parseMediaDate(b.media_date);

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }

  function createColumns(items: Work[]) {
    const columns: Work[][] = Array.from({ length: columnCount }, () => []);

    items.forEach((item, index) => {
      columns[index % columnCount].push(item);
    });

    return columns;
  }

  async function loadWorks() {
    const data = await getWorks();

    const normalized = (data as Work[]).map((work) => ({
      ...work,
      media_url: work.media_url || work.image_url || "",
      media_type: work.media_type || "image",
      thumbnail_url: work.thumbnail_url || null,
      media_width: work.media_width || null,
      media_height: work.media_height || null,
      favorite: Boolean(work.favorite),
      disliked: Boolean(work.disliked),
    }));

    setWorks(sortWorks(normalized));
  }

  useEffect(() => {
    loadWorks();
  }, []);

  function cleanFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-.]/g, "");
  }

  function needsImageThumbnail(work: Work) {
    if (work.media_type !== "image") return false;
    if (!work.thumbnail_url) return true;
    if (work.thumbnail_url === work.media_url) return true;

    return false;
  }

  async function createImageThumbnailFromUrl(url: string, title: string) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Image fetch failed");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise<{
      file: File;
      width: number;
      height: number;
    }>((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;

        if (!originalWidth || !originalHeight) {
          reject(new Error("Image dimensions missing"));
          return;
        }

        const maxSize = 700;
        let width = originalWidth;
        let height = originalHeight;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }

        if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas failed"));
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (thumbBlob) => {
            if (!thumbBlob) {
              reject(new Error("Thumbnail blob failed"));
              return;
            }

            const file = new File(
              [thumbBlob],
              `${cleanFileName(title || "image")}-thumb.webp`,
              {
                type: "image/webp",
              }
            );

            resolve({
              file,
              width: originalWidth,
              height: originalHeight,
            });
          },
          "image/webp",
          0.72
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image load failed"));
      };

      image.src = objectUrl;
    });
  }

  async function uploadThumbnail(file: File, workId: string) {
    const fileName = `thumbs/${workId}-${Date.now()}-${cleanFileName(
      file.name
    )}`;

    const { error } = await supabase.storage.from("works").upload(fileName, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: true,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("works").getPublicUrl(fileName);

    return data.publicUrl;
  }

  function getVideoDimensions(url: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
      const video = document.createElement("video");

      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };

      video.onerror = () => {
        reject(new Error("Video dimensions could not be read"));
      };

      video.src = `${url}#t=0.1`;
      video.load();
    });
  }

  async function handleOptimizeMedia() {
    const itemsToOptimize = works.filter(
      (work) =>
        !work.media_width ||
        !work.media_height ||
        needsImageThumbnail(work)
    );

    if (itemsToOptimize.length === 0) {
      setOptimizeMessage("Her şey hafif.");
      return;
    }

    setOptimizing(true);

    for (let index = 0; index < itemsToOptimize.length; index++) {
      const work = itemsToOptimize[index];

      setOptimizeMessage(
        `Optimize ediliyor: ${index + 1}/${itemsToOptimize.length}`
      );

      try {
        if (work.media_type === "image") {
          const thumbData = await createImageThumbnailFromUrl(
            work.media_url,
            work.title || work.id
          );

          let nextThumbnailUrl = work.thumbnail_url || null;

          if (needsImageThumbnail(work)) {
            nextThumbnailUrl = await uploadThumbnail(thumbData.file, work.id);
          }

          const success = await updateMediaMeta(work.id, {
            media_width: thumbData.width,
            media_height: thumbData.height,
            thumbnail_url: nextThumbnailUrl,
          });

          if (success) {
            setWorks((prev) =>
              sortWorks(
                prev.map((item) =>
                  item.id === work.id
                    ? {
                        ...item,
                        media_width: thumbData.width,
                        media_height: thumbData.height,
                        thumbnail_url: nextThumbnailUrl,
                      }
                    : item
                )
              )
            );
          }
        }

        if (work.media_type === "video") {
          const dimensions = await getVideoDimensions(work.media_url);

          if (dimensions.width && dimensions.height) {
            const success = await updateMediaMeta(work.id, {
              media_width: dimensions.width,
              media_height: dimensions.height,
              thumbnail_url: work.thumbnail_url || null,
            });

            if (success) {
              setWorks((prev) =>
                sortWorks(
                  prev.map((item) =>
                    item.id === work.id
                      ? {
                          ...item,
                          media_width: dimensions.width,
                          media_height: dimensions.height,
                        }
                      : item
                  )
                )
              );
            }
          }
        }
      } catch (error) {
        console.error("Optimize media error:", work.id, error);
      }

      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }

    setOptimizing(false);
    setOptimizeMessage("Optimize bitti. Sayfayı yenile.");
  }

  async function handleFavorite(work: Work) {
    const success = await toggleFavorite(work.id, Boolean(work.favorite));

    if (!success) {
      alert("Favorite güncellenemedi.");
      return;
    }

    setWorks((prev) =>
      sortWorks(
        prev.map((item) =>
          item.id === work.id
            ? {
                ...item,
                favorite: !Boolean(item.favorite),
                disliked: false,
              }
            : item
        )
      )
    );

    setSelectedWork((prev) =>
      prev && prev.id === work.id
        ? {
            ...prev,
            favorite: !Boolean(prev.favorite),
            disliked: false,
          }
        : prev
    );
  }

  async function handleDislike(work: Work) {
    const success = await toggleDislike(work.id, Boolean(work.disliked));

    if (!success) {
      alert("Dislike güncellenemedi.");
      return;
    }

    setWorks((prev) =>
      sortWorks(
        prev.map((item) =>
          item.id === work.id
            ? {
                ...item,
                disliked: !Boolean(item.disliked),
                favorite: false,
              }
            : item
        )
      )
    );

    setSelectedWork((prev) =>
      prev && prev.id === work.id
        ? {
            ...prev,
            disliked: !Boolean(prev.disliked),
            favorite: false,
          }
        : prev
    );
  }

  async function handleDelete() {
    if (!selectedWork) return;

    const confirmed = confirm("Bunu silmek istediğine emin misin?");
    if (!confirmed) return;

    const success = await deleteWork(selectedWork.id);

    if (!success) {
      alert("Silinemedi. Admin girişi veya Supabase delete policy kontrol edilmeli.");
      return;
    }

    setWorks((prev) => prev.filter((work) => work.id !== selectedWork.id));
    setSelectedWork(null);
  }

  const columns = createColumns(works);
  const gap = columnCount === 2 ? "6px" : "8px";

  const totalCount = works.length;
  const imageCount = works.filter((work) => work.media_type === "image").length;
  const videoCount = works.filter((work) => work.media_type === "video").length;

  const missingDimensionCount = works.filter(
    (work) => !work.media_width || !work.media_height
  ).length;

  const missingThumbnailCount = works.filter((work) =>
    needsImageThumbnail(work)
  ).length;

  const hasOptimizationWork =
    missingDimensionCount > 0 || missingThumbnailCount > 0;

  return (
    <>
      {isAdmin && (
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500">
            Sitede görünen toplam:{" "}
            <span className="font-semibold text-neutral-900">
              {totalCount}
            </span>
            {" · "}
            Görsel:{" "}
            <span className="font-semibold text-neutral-900">
              {imageCount}
            </span>
            {" · "}
            Video:{" "}
            <span className="font-semibold text-neutral-900">
              {videoCount}
            </span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500">
            Ölçüsü eksik:{" "}
            <span className="font-semibold text-neutral-900">
              {missingDimensionCount}
            </span>
            {" · "}
            Hafif thumbnail eksik:{" "}
            <span className="font-semibold text-neutral-900">
              {missingThumbnailCount}
            </span>
          </div>
        </div>
      )}

      {isAdmin && hasOptimizationWork && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-neutral-500">
            Mobil performansı artırmak için eski görsellerin küçük kart
            versiyonunu üret.
          </p>

          <div className="flex items-center gap-2">
            {optimizeMessage && (
              <span className="text-xs text-neutral-400">
                {optimizeMessage}
              </span>
            )}

            <button
              onClick={handleOptimizeMedia}
              disabled={optimizing}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {optimizing ? "Optimize ediliyor..." : "Görselleri Hafiflet"}
            </button>
          </div>
        </div>
      )}

      {works.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          Henüz bir şey yüklenmedi.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap,
          }}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              style={{
                display: "flex",
                flexDirection: "column",
                gap,
              }}
            >
              {column.map((work, itemIndex) => (
                <Card
                  key={work.id}
                  title={work.title || "Untitled"}
                  mediaDate={work.media_date}
                  mediaUrl={work.media_url}
                  mediaType={work.media_type}
                  thumbnailUrl={work.thumbnail_url}
                  mediaWidth={work.media_width}
                  mediaHeight={work.media_height}
                  favorite={Boolean(work.favorite)}
                  disliked={Boolean(work.disliked)}
                  canFavorite={isAdmin}
                  priority={itemIndex < 2}
                  onFavorite={() => handleFavorite(work)}
                  onDislike={() => handleDislike(work)}
                  onOpen={() => setSelectedWork(work)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <Lightbox
        work={selectedWork}
        onClose={() => setSelectedWork(null)}
        onDelete={handleDelete}
        canDelete={isAdmin}
      />
    </>
  );
}