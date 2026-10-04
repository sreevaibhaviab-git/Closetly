import { supabase } from "./client";
import type { SavedOutfit } from "./outfits";

export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  saved_outfit_id: string | null;
  outfit_snapshot: SavedOutfit | null;
  created_at: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string | null;
  priority: "Low" | "Medium" | "High";
  notes: string | null;
  image_url: string | null;
  created_at: string;
};

export type PackingItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
};

export type PackingList = {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  trip_type: string | null;
  items: PackingItem[];
  notes: string | null;
  created_at: string;
};

async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be logged in.");
  }

  return user.id;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []) as CalendarEvent[];
}

export async function createCalendarEvent(input: {
  title: string;
  eventDate: string;
  eventTime?: string;
  notes?: string;
  outfit?: SavedOutfit | null;
}): Promise<CalendarEvent> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      event_date: input.eventDate,
      event_time: input.eventTime || null,
      notes: input.notes?.trim() || null,
      saved_outfit_id: input.outfit?.id || null,
      outfit_snapshot: input.outfit || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as CalendarEvent;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getWishlistItems(): Promise<WishlistItem[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as WishlistItem[];
}

export async function createWishlistItem(input: {
  name: string;
  category: string;
  color?: string;
  priority: "Low" | "Medium" | "High";
  notes?: string;
  imageUrl?: string;
}): Promise<WishlistItem> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category: input.category,
      color: input.color?.trim() || null,
      priority: input.priority,
      notes: input.notes?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as WishlistItem;
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getPackingLists(): Promise<PackingList[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("packing_lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as PackingList[];
}

export async function createPackingList(input: {
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  tripType: string;
  items: PackingItem[];
  notes?: string;
}): Promise<PackingList> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("packing_lists")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      destination: input.destination.trim(),
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      trip_type: input.tripType,
      items: input.items,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as PackingList;
}

export async function deletePackingList(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from("packing_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}