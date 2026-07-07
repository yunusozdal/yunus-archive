"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;

    function preventBrowserOpen(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();
    }

    window.addEventListener("dragover", preventBrowserOpen);
    window.addEventListener("drop", preventBrowserOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserOpen);
      window.removeEventListener("drop", preventBrowserOpen);
    };
  }, [open]);

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

  function formatMB(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function handleFiles(selectedFiles: FileList | File[]) {
    const fileArray = Array.from(selectedFiles).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (fileArray.length === 0) {
      setMessage("Sadece görsel veya video yükleyebilirsin.");
      return;
    }

    setFiles((prev) => [...prev, ...fileArray]);
    setMessage("");
  }

  async function resizeImage(
    file: File,
    maxSize: number,
    quality: number,
    suffix: string
  ): Promise<{
    file: File;
    width: number;
    height: number;
  } | null> {
    const isImage = file.type.startsWith("image/");
    const isSvg = file.type === "image/svg+xml";
    const isGif = file.type === "image/gif";

    if (!isImage || isSvg || isGif) {
      return null;
    }

    return new Promise((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let width = image.naturalWidth;
        let height = image.naturalHeight;

        if (!width || !height) {
          resolve(null);
          return;
        }

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
          resolve(null);
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }

            const resizedFile = new File(
              [blob],
              `${getTitleFromFileName(file.name)}${suffix}.webp`,
              {
                type: "image/webp",
                lastModified: file.lastModified,
              }
            );

            resolve({
              file: resizedFile,
              width,
              height,
            });
          },
          "image/webp",
          quality
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      image.src = objectUrl;
    });
  }

  async function getVideoDimensions(file: File) {
    return new Promise<{ width: number | null; height: number | null }>(
      (resolve) => {
        const video = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          URL.revokeObjectURL(objectUrl);

          resolve({
            width: video.videoWidth || null,
            height: video.videoHeight || null,
          });
        };

        video.onerror = () => {
          URL.revokeObjectURL(objectUrl);

          resolve({
            width: null,
            height: null,
          });
        };

        video.src = objectUrl;
        video.load();
      }
    );
  }

  async function uploadFileToStorage(file: File, folder?: string) {
    const safeName = cleanFileName(file.name);
    const fileName = `${folder ? `${folder}/` : ""}${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeName}`;

    const { error } = await supabase.storage.from("works").upload(fileName, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("works").getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleUpload() {
    if (files.length === 0) {
      setMessage("Önce görsel ya da video seç.");
      return;
    }

    setLoading(true);
    setMessage("Dosyalar hazırlanıyor...");

    const rows = [];

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      try {
        let uploadFile = file;
        let thumbnailUrl: string | null = null;
        let mediaWidth: number | null = null;
        let mediaHeight: number | null = null;

        if (isImage) {
          const compressed = await resizeImage(file, 2200, 0.82, "");
          const thumbnail = await resizeImage(file, 700, 0.72, "-thumb");

          if (compressed) {
            uploadFile = compressed.file;
            mediaWidth = compressed.width;
            mediaHeight = compressed.height;

            setMessage(
              `${file.name} sıkıştırıldı: ${formatMB(file.size)} → ${formatMB(
                uploadFile.size
              )}`
            );
          }

          if (thumbnail) {
            thumbnailUrl = await uploadFileToStorage(thumbnail.file, "thumbs");
          }
        }

        if (isVideo) {
          const videoSize = await getVideoDimensions(file);

          mediaWidth = videoSize.width;
          mediaHeight = videoSize.height;

          setMessage(`${file.name} yükleniyor...`);
        }

        const mediaUrl = await uploadFileToStorage(uploadFile);

        rows.push({
          title: getTitleFromFileName(file.name),
          category: "Upload",
          favorite: false,
          disliked: false,
          year: null,
          image_url: mediaUrl,
          media_url: mediaUrl,
          media_type: isVideo ? "video" : "image",
          media_date: formatFileDate(file),
          thumbnail_url: thumbnailUrl,
          media_width: mediaWidth,
          media_height: mediaHeight,
        });
      } catch (error) {
        console.error("Upload error:", error);

        setMessage(
          error instanceof Error
            ? `Upload failed: ${error.message}`
            : "Upload failed."
        );

        setLoading(false);
        return;
      }
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
    }, 700);
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
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 text-neutral-950">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upload</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Dosyaları sürükle-bırak veya seç.
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
              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`rounded-2xl border border-dashed p-8 text-center transition ${
                  isDragging
                    ? "border-red-600 bg-red-50"
                    : "border-neutral-300 bg-neutral-50 hover:border-red-500"
                }`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files);
                    }

                    e.currentTarget.value = "";
                  }}
                />

                <label htmlFor="file-upload" className="block cursor-pointer">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white">
                    +
                  </div>

                  <p className="text-sm font-medium text-neutral-900">
                    {isDragging
                      ? "Dosyaları buraya bırak"
                      : "Dosyaları buraya sürükle"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    veya tıklayıp görsel/video seç
                  </p>

                  {files.length > 0 && (
                    <p className="mt-3 text-xs font-medium text-red-600">
                      {files.length} dosya seçildi
                    </p>
                  )}
                </label>
              </div>

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
                            playsInline
                            className="h-40 w-full object-contain"
                          />
                        ) : (
                          <img
                            src={url}
                            alt=""
                            className="h-40 w-full object-contain"
                          />
                        )}

                        <div className="space-y-1 px-3 py-2">
                          <p className="truncate text-xs text-neutral-700">
                            {file?.name}
                          </p>

                          <p className="text-xs text-neutral-400">
                            {file &&
                              `${formatMB(file.size)} · ${formatFileDate(
                                file
                              )}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {files.length > 0 && (
                <button
                  onClick={() => {
                    setFiles([]);
                    setMessage("");
                  }}
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  Seçilenleri temizle
                </button>
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