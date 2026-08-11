import { supabase } from "./supabase";

export async function uploadToR2(file: File, objectKey: string) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı.");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("objectKey", objectKey);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "R2 upload failed");
  return result.url as string;
}
