import { supabase } from "./supabase";

export async function getWorks() {
  const { data, error } = await supabase
    .from("works")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Works fetch error:", error);
    return [];
  }

  return data;
}

export async function deleteWork(id: string) {
  const { error } = await supabase.from("works").delete().eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}

export async function updateWork(
  id: string,
  title: string,
  year: number | null
) {
  const { error } = await supabase
    .from("works")
    .update({ title, year })
    .eq("id", id);

  if (error) {
    console.error("Update error:", error);
    return false;
  }

  return true;
}