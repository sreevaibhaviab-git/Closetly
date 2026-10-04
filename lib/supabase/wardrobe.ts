import { supabase } from "./client";

export type WardrobeItem = {
  id: string;
  user_id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
  is_favorite: boolean;
  is_in_laundry: boolean;
  created_at: string;
};

export type CreateWardrobeItem = {
  user_id: string;
  name: string;
  category: string;
  color?: string | null;
  image_url: string;
};

export async function getWardrobeItems(): Promise<WardrobeItem[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to view your closet.");
  }

  const { data, error } = await supabase
    .from("wardrobe_items")
    .select(
      "id, user_id, name, category, color, image_url, is_favorite, is_in_laundry, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createWardrobeItem(
  item: CreateWardrobeItem
): Promise<void> {
  const { error } = await supabase.from("wardrobe_items").insert(item);

  if (error) {
    throw error;
  }
}

export async function updateWardrobeItem(
  id: string,
  updates: Partial<
    Pick<
      WardrobeItem,
      "name" | "category" | "color" | "is_favorite" | "is_in_laundry"
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from("wardrobe_items")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}