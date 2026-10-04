import { supabase } from "./client";

export type StylistMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type TemporaryAvoidance = {
  term: string;
  until: string;
};

export type StylePreferences = {
  user_id: string;
  avoid_items: string[];
  avoid_colors: string[];
  preferred_items: string[];
  preferred_colors: string[];
  preferred_styles: string[];
  temporary_avoidances: TemporaryAvoidance[];
  notes: string[];
  updated_at: string;
};

export type StyleMemoryPatch = {
  avoid_items?: string[];
  avoid_colors?: string[];
  preferred_items?: string[];
  preferred_colors?: string[];
  preferred_styles?: string[];
  temporary_avoidances?: TemporaryAvoidance[];
  notes?: string[];
};

async function getLoggedInUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be logged in.");
  }

  return user.id;
}

export async function getStylePreferences(): Promise<StylePreferences> {
  const userId = await getLoggedInUserId();

  const { data, error } = await supabase
    .from("style_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    const preferences = normalizePreferences(
      data as StylePreferences
    );

    const activeTemporaryAvoidances =
      removeExpiredTemporaryAvoidances(
        preferences.temporary_avoidances
      );

    if (
      activeTemporaryAvoidances.length !==
      preferences.temporary_avoidances.length
    ) {
      const { data: updated, error: updateError } = await supabase
        .from("style_preferences")
        .update({
          temporary_avoidances: activeTemporaryAvoidances,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return normalizePreferences(
        updated as StylePreferences
      );
    }

    return preferences;
  }

  const { data: created, error: createError } = await supabase
    .from("style_preferences")
    .insert({
      user_id: userId,
      avoid_items: [],
      avoid_colors: [],
      preferred_items: [],
      preferred_colors: [],
      preferred_styles: [],
      temporary_avoidances: [],
      notes: [],
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return normalizePreferences(
    created as StylePreferences
  );
}

export async function mergeStylePreferences(
  patch: StyleMemoryPatch
): Promise<StylePreferences> {
  const current = await getStylePreferences();

  const mergedPreferences = {
    avoid_items: mergeStringArrays(
      current.avoid_items,
      patch.avoid_items
    ),
    avoid_colors: mergeStringArrays(
      current.avoid_colors,
      patch.avoid_colors
    ),
    preferred_items: mergeStringArrays(
      current.preferred_items,
      patch.preferred_items
    ),
    preferred_colors: mergeStringArrays(
      current.preferred_colors,
      patch.preferred_colors
    ),
    preferred_styles: mergeStringArrays(
      current.preferred_styles,
      patch.preferred_styles
    ),
    notes: mergeStringArrays(
      current.notes,
      patch.notes
    ),
    temporary_avoidances: mergeTemporaryAvoidances(
      current.temporary_avoidances,
      patch.temporary_avoidances
    ),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("style_preferences")
    .update(mergedPreferences)
    .eq("user_id", current.user_id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizePreferences(
    data as StylePreferences
  );
}

export async function getStylistMessages(
  limit = 40
): Promise<StylistMessage[]> {
  const userId = await getLoggedInUserId();

  const { data, error } = await supabase
    .from("stylist_messages")
    .select("id, user_id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as StylistMessage[]).reverse();
}

export async function addStylistMessage(
  role: "user" | "assistant",
  content: string
): Promise<StylistMessage> {
  const userId = await getLoggedInUserId();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("stylist_messages")
    .insert({
      user_id: userId,
      role,
      content: trimmedContent,
    })
    .select("id, user_id, role, content, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as StylistMessage;
}

export async function clearStylistMessages(): Promise<void> {
  const userId = await getLoggedInUserId();

  const { error } = await supabase
    .from("stylist_messages")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

function normalizePreferences(
  preferences: StylePreferences
): StylePreferences {
  return {
    user_id: preferences.user_id,
    avoid_items: normalizeStringArray(
      preferences.avoid_items
    ),
    avoid_colors: normalizeStringArray(
      preferences.avoid_colors
    ),
    preferred_items: normalizeStringArray(
      preferences.preferred_items
    ),
    preferred_colors: normalizeStringArray(
      preferences.preferred_colors
    ),
    preferred_styles: normalizeStringArray(
      preferences.preferred_styles
    ),
    temporary_avoidances:
      removeExpiredTemporaryAvoidances(
        Array.isArray(
          preferences.temporary_avoidances
        )
          ? preferences.temporary_avoidances
          : []
      ),
    notes: normalizeStringArray(
      preferences.notes
    ),
    updated_at:
      preferences.updated_at ||
      new Date().toISOString(),
  };
}

function normalizeStringArray(
  values: string[] | null | undefined
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) =>
          String(value).trim().toLowerCase()
        )
        .filter(Boolean)
    )
  );
}

function mergeStringArrays(
  current: string[] = [],
  incoming: string[] = []
): string[] {
  return normalizeStringArray([
    ...current,
    ...(Array.isArray(incoming)
      ? incoming
      : []),
  ]);
}

function mergeTemporaryAvoidances(
  current: TemporaryAvoidance[] = [],
  incoming: TemporaryAvoidance[] = []
): TemporaryAvoidance[] {
  const merged = new Map<
    string,
    TemporaryAvoidance
  >();

  removeExpiredTemporaryAvoidances(
    current
  ).forEach((item) => {
    merged.set(item.term, item);
  });

  if (Array.isArray(incoming)) {
    incoming.forEach((item) => {
      const term = String(
        item?.term ?? ""
      )
        .trim()
        .toLowerCase();

      const until = String(
        item?.until ?? ""
      ).trim();

      if (
        !term ||
        !isValidDateString(until)
      ) {
        return;
      }

      merged.set(term, {
        term,
        until,
      });
    });
  }

  return removeExpiredTemporaryAvoidances(
    Array.from(merged.values())
  );
}

function removeExpiredTemporaryAvoidances(
  items: TemporaryAvoidance[] = []
): TemporaryAvoidance[] {
  const now = new Date();

  return items
    .filter((item) => {
      const term = String(
        item?.term ?? ""
      )
        .trim()
        .toLowerCase();

      const until = String(
        item?.until ?? ""
      ).trim();

      if (
        !term ||
        !isValidDateString(until)
      ) {
        return false;
      }

      const expiry = new Date(
        `${until}T23:59:59`
      );

      return expiry.getTime() >= now.getTime();
    })
    .map((item) => ({
      term: item.term.trim().toLowerCase(),
      until: item.until,
    }));
}

function isValidDateString(
  value: string
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const parsed = new Date(
    `${value}T00:00:00`
  );

  return !Number.isNaN(parsed.getTime());
}