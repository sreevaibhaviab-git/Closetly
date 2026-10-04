import { supabase } from "./client";

export type SavedOutfitItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
};

export type SavedOutfit = {
  id: string;
  user_id: string;
  title: string;
  occasion: string;
  vibe: string;
  time_of_day: string;
  formality: string;
  description: string | null;
  item_ids: string[];
  items: SavedOutfitItem[];
  reason: string | null;
  styling_tip: string | null;
  confidence: number;
  created_at: string;
};

export type CreateSavedOutfitInput = {
  title: string;
  occasion: string;
  vibe: string;
  timeOfDay: string;
  formality: string;
  description?: string;
  itemIds: string[];
  items: SavedOutfitItem[];
  reason?: string;
  stylingTip?: string;
  confidence?: number;
};

export type OutfitRating =
  | "love"
  | "not_my_style";

export type OutfitFeedback = {
  id: string;
  user_id: string;
  outfit_title: string | null;
  item_ids: string[];
  rating: OutfitRating;
  context: {
    occasion?: string;
    vibe?: string;
    timeOfDay?: string;
    formality?: string;
    description?: string;
  };
  created_at: string;
};

async function getLoggedInUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be logged in.");
  }

  return user;
}

export async function saveOutfit(
  input: CreateSavedOutfitInput
): Promise<SavedOutfit> {
  const user = await getLoggedInUser();

  const { data, error } = await supabase
    .from("saved_outfits")
    .insert({
      user_id: user.id,
      title: input.title,
      occasion: input.occasion,
      vibe: input.vibe,
      time_of_day: input.timeOfDay,
      formality: input.formality,
      description:
        input.description?.trim() || null,
      item_ids: input.itemIds,
      items: input.items,
      reason: input.reason || null,
      styling_tip: input.stylingTip || null,
      confidence: Math.max(
        0,
        Math.min(100, input.confidence || 0)
      ),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SavedOutfit;
}

export async function getSavedOutfits(): Promise<
  SavedOutfit[]
> {
  const user = await getLoggedInUser();

  const { data, error } = await supabase
    .from("saved_outfits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SavedOutfit[];
}

export async function deleteSavedOutfit(
  outfitId: string
): Promise<void> {
  const user = await getLoggedInUser();

  const { error } = await supabase
    .from("saved_outfits")
    .delete()
    .eq("id", outfitId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveOutfitFeedback(input: {
  outfitTitle: string;
  itemIds: string[];
  rating: OutfitRating;
  occasion: string;
  vibe: string;
  timeOfDay: string;
  formality: string;
  description?: string;
}): Promise<void> {
  const user = await getLoggedInUser();

  const { error } = await supabase
    .from("outfit_feedback")
    .insert({
      user_id: user.id,
      outfit_title: input.outfitTitle,
      item_ids: input.itemIds,
      rating: input.rating,
      context: {
        occasion: input.occasion,
        vibe: input.vibe,
        timeOfDay: input.timeOfDay,
        formality: input.formality,
        description:
          input.description || "",
      },
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getRecentOutfitFeedback(
  limit = 20
): Promise<OutfitFeedback[]> {
  const user = await getLoggedInUser();

  const { data, error } = await supabase
    .from("outfit_feedback")
    .select(
      "id, user_id, outfit_title, item_ids, rating, context, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as OutfitFeedback[];
}