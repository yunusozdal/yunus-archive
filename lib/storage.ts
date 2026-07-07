import { supabase } from "./supabase";

export async function getWorksPage(from = 0, to = 59) {
  const { data, error, count } = await supabase
    .from("works")
    .select("*", { count: "exact" })
    .order("favorite", { ascending: false })
    .order("disliked", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Works page fetch error:", error);
    return {
      data: [],
      count: 0,
    };
  }

  return {
    data: data || [],
    count: count || 0,
  };
}

export async function getWorks() {
  const pageSize = 1000;
  let from = 0;
  let allWorks: any[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Works fetch error:", error);
      return allWorks;
    }

    if (!data || data.length === 0) {
      break;
    }

    allWorks = [...allWorks, ...data];

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return allWorks;
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
    .update({
      favorite: !currentValue,
      disliked: false,
    })
    .eq("id", id);

  if (error) {
    console.error("Favorite error:", error);
    return false;
  }

  return true;
}

export async function toggleDislike(id: string, currentValue: boolean) {
  const { error } = await supabase
    .from("works")
    .update({
      disliked: !currentValue,
      favorite: false,
    })
    .eq("id", id);

  if (error) {
    console.error("Dislike error:", error);
    return false;
  }

  return true;
}

export async function updateMediaMeta(
  id: string,
  meta: {
    media_width: number;
    media_height: number;
    thumbnail_url?: string | null;
  }
) {
  const payload: {
    media_width: number;
    media_height: number;
    thumbnail_url?: string | null;
  } = {
    media_width: meta.media_width,
    media_height: meta.media_height,
  };

  if ("thumbnail_url" in meta) {
    payload.thumbnail_url = meta.thumbnail_url ?? null;
  }

  const { error } = await supabase.from("works").update(payload).eq("id", id);

  if (error) {
    console.error("Media meta update error:", error);
    return false;
  }

  return true;
}