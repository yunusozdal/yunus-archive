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
  const { data, error } = await supabase
    .from("works")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  if (!data) {
    console.error("Delete blocked or no row deleted");
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
export async function toggleFavorite(id: string, currentValue: boolean) {
  const { error } = await supabase
    .from("works")
    .update({ favorite: !currentValue })
    .eq("id", id);

  if (error) {
    console.error("Favorite error:", error);
    return false;
  }

  return true;
}