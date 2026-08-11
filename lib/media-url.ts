const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

export function toR2Url(url?: string | null) {
  if (!url || !R2_PUBLIC_URL) return url || "";
  if (url.startsWith(R2_PUBLIC_URL)) return url;

  const marker = "/storage/v1/object/public/works/";
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) return url;

  const objectKey = url.slice(markerIndex + marker.length);
  return `${R2_PUBLIC_URL}/${objectKey}`;
}

export function normalizeWorkMedia<T extends Record<string, unknown>>(work: T): T {
  return {
    ...work,
    image_url: toR2Url(work.image_url as string | null),
    media_url: toR2Url(work.media_url as string | null),
    thumbnail_url: toR2Url(work.thumbnail_url as string | null),
  };
}
