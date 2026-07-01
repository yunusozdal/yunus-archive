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
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    function updateColumns() {
      const width = window.innerWidth;

      if (width < 640) {
        setColumnCount(4); // mobil
      } else if (width < 1024) {
        setColumnCount(6); // tablet
      } else {
        setColumnCount(8); // desktop / tarayıcı
      }
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);

    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  function parseMediaDate(dateString?: string | null) {
    if (!dateString) return 0;

    const [day, month, year] = dateString.split(".").map(Number);

    if (!day || !month || !year) return 0;

    return new Date(year, month - 1, day).getTime();
  }

  function sortWorks(items: Work[]) {
    return [...items].sort((a, b) => {
      if (Boolean(a.favorite) !== Boolean(b.favorite)) {
        return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite));
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

  async function loadWorks() {
    const data = await getWorks();

    const normalized = (data as Work[]).map((work) => ({
      ...work,
      media_url: work.media_url || work.image_url || "",
      media_type: work.media_type || "image",
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

  return (
    <>
      {works.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          Henüz bir şey yüklenmedi.
        </div>
      ) : (
        <div
          style={{
            columnCount,
            columnGap: "6px",
          }}
        >
          {works.map((work) => (
            <Card
              key={work.id}
              title={work.title || "Untitled"}
              mediaDate={work.media_date}
              mediaUrl={work.media_url}
              mediaType={work.media_type}
              favorite={Boolean(work.favorite)}
              canFavorite={isAdmin}
              onFavorite={() => handleFavorite(work)}
              onOpen={() => setSelectedWork(work)}
            />
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