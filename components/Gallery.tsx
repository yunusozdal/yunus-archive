"use client";

import { useEffect, useState } from "react";
import Card from "./Card";
import Lightbox from "./Lightbox";
import { deleteWork, getWorks } from "../lib/storage";

type Work = {
  id: string;
  title: string;
  media_date?: string | null;
  media_url: string;
  media_type: "image" | "video";
  image_url?: string;
  created_at: string;
};

type GalleryProps = {
  isAdmin: boolean;
};

export default function Gallery({ isAdmin }: GalleryProps) {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  function parseMediaDate(dateString?: string | null) {
    if (!dateString) return 0;

    const [day, month, year] = dateString.split(".").map(Number);

    if (!day || !month || !year) return 0;

    return new Date(year, month - 1, day).getTime();
  }

  async function loadWorks() {
    const data = await getWorks();

    const normalized = (data as Work[])
      .map((work) => ({
        ...work,
        media_url: work.media_url || work.image_url || "",
        media_type: work.media_type || "image",
      }))
      .sort((a, b) => {
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

    setWorks(normalized);
  }

  useEffect(() => {
    loadWorks();
  }, []);

  async function handleDelete() {
    if (!selectedWork) return;

    const confirmed = confirm("Bunu silmek istediğine emin misin?");
    if (!confirmed) return;

    const success = await deleteWork(selectedWork.id);
    if (!success) return;

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
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {works.map((work) => (
            <Card
              key={work.id}
              title={work.title || "Untitled"}
              mediaDate={work.media_date}
              mediaUrl={work.media_url}
              mediaType={work.media_type}
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