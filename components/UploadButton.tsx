"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage("Önce görsel ya da video seç.");
      return;
    }

    setLoading(true);
    setMessage("Yükleniyor...");

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
        console.error("Upload error:", uploadError);
        setMessage(`Upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from("works").getPublicUrl(fileName);

      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const title = getTitleFromFileName(file.name);
      const mediaDate = formatFileDate(file);

      rows.push({
        title,
        category: "Upload",
        favorite: false,
        year: null,

        image_url: data.publicUrl,

        media_url: data.publicUrl,
        media_type: mediaType,
        media_date: mediaDate,
      });
    }

    const { error: insertError } = await supabase.from("works").insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      setMessage(`Database insert failed: ${insertError.message}`);
      setLoading(false);
      return;
    }

    setMessage("Yüklendi!");
    setLoading(false);
    setFiles([]);

    setTimeout(() => {
      setOpen(false);
      window.location.reload();
    }, 600);
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setMessage("");
        }}
        className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        Upload
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-950">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upload</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Birden fazla görsel veya video yükle.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-neutral-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block cursor-pointer rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition hover:border-red-500">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    setFiles(Array.from(e.target.files || []));
                    setMessage("");
                  }}
                />

                <div className="text-sm text-neutral-500">
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
                        className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
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
                          <p className="truncate text-xs text-neutral-700">
                            {file?.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {file && formatFileDate(file)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  {message}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}