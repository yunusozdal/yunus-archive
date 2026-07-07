"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import Lightbox from "./Lightbox";
import { deleteWork, getWorks, toggleFavorite } from "../lib/storage";

type Work = {
  id: string;
  title: string;
  media_date?: string | null;
  media_url: string;
  media_type: "image" | "video";
  thumbnail_url?: string | null;
  image_url?: string;
  created_at: string;
  favorite?: boolean;
};

type GalleryProps = {
  isAdmin: boolean;
};

export default function Gallery({ isAdmin }: GalleryProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [columnCount, setColumnCount] = useState(2);

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

  function sortWorks(items: Work[]) {
    return [...items].sort((a, b) => {
      const favoriteA = Boolean(a.favorite);
      const favoriteB = Boolean(b.favorite);

      if (favoriteA !== favoriteB) {
        return Number(favoriteB) - Number(favoriteA);
      }

      const dateA = parseMediaDate(a.media_date);
      const dateB = parseMediaDate(b.media_date);

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
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
      favorite: Boolean(work.favorite),
    }));

    setWorks(sortWorks(normalized));
  }

  useEffect(() => {
    loadWorks();
  }, []);

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
            ? { ...item, favorite: !Boolean(item.favorite) }
            : item
        )
      )
    );

    setSelectedWork((prev) =>
      prev && prev.id === work.id
        ? { ...prev, favorite: !Boolean(prev.favorite) }
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

  return (
    <>
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
              {column.map((work) => (
                <Card
                  key={work.id}
                  title={work.title || "Untitled"}
                  mediaDate={work.media_date}
                  mediaUrl={work.media_url}
                  mediaType={work.media_type}
                  thumbnailUrl={work.thumbnail_url}
                  favorite={Boolean(work.favorite)}
                  canFavorite={isAdmin}
                  onFavorite={() => handleFavorite(work)}
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