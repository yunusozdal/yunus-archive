"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (files.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function getTitleFromFileName(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, "");
  }

  function cleanFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-.]/g, "");
  }

  function formatFileDate(file: File) {
    const date = new Date(file.lastModified);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  }

  async function handleUpload() {
    if (files.length === 0) {
      alert("Önce görsel ya da video seç kanka");
      return;
    }

    setLoading(true);

    const rows = [];

    for (const file of files) {
      const safeName = cleanFileName(file.name);
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("works")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert(`${file.name} yüklenemedi`);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from("works").getPublicUrl(fileName);

      const mediaType = file.type.startsWith("video") ? "video" : "image";

      rows.push({
        title: getTitleFromFileName(file.name),
        media_date: formatFileDate(file),
        media_url: data.publicUrl,
        media_type: mediaType,
      });
    }

    const { error: insertError } = await supabase.from("works").insert(rows);

    if (insertError) {
      console.error(insertError);
      alert("Database insert failed");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    setFiles([]);
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
      >
        Upload
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upload</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Birden fazla görsel veya video yükle.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block cursor-pointer rounded-2xl border border-dashed border-neutral-700 bg-black p-6 text-center transition hover:border-neutral-500">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />

                <div className="text-sm text-neutral-400">
                  {files.length > 0
                    ? `${files.length} dosya seçildi`
                    : "Görsel veya video seç"}
                </div>
              </label>

              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {previewUrls.map((url, index) => {
                    const file = files[index];
                    const isVideo = file?.type.startsWith("video");

                    return (
                      <div
                        key={url}
                        className="overflow-hidden rounded-2xl border border-neutral-800 bg-black"
                      >
                        {isVideo ? (
                          <video
                            src={url}
                            controls
                            className="h-40 w-full object-contain"
                          />
                        ) : (
                          <img
                            src={url}
                            alt="Preview"
                            className="h-40 w-full object-contain"
                          />
                        )}

                        <div className="space-y-1 px-3 py-2">
                          <p className="truncate text-xs text-neutral-400">
                            {file?.name}
                          </p>
                          <p className="text-xs text-neutral-600">
                            {file && formatFileDate(file)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setOpen(true)}
                disabled={loading}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black shadow-xl shadow-white/10 transition hover:scale-[1.02] hover:bg-neutral-200 active:scale-95"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}