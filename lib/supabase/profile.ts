import { supabase } from "./client";
import {
  createAvatarSignedUrl,
  deleteAvatarImage,
  uploadAvatarImage,
} from "./storage";

export type UserProfile = {
  user_id: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AvatarProfileResult = {
  profile: UserProfile;
  signedUrl: string | null;
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

export async function getAvatarProfile(): Promise<AvatarProfileResult> {
  const user = await getLoggedInUser();

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, avatar_path, avatar_updated_at, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  let profile: UserProfile;

  if (data) {
    profile = data as UserProfile;
  } else {
    const now = new Date().toISOString();

    const { data: created, error: createError } =
      await supabase
        .from("user_profiles")
        .insert({
          user_id: user.id,
          avatar_path: null,
          avatar_updated_at: null,
          updated_at: now,
        })
        .select(
          "user_id, avatar_path, avatar_updated_at, created_at, updated_at"
        )
        .single();

    if (createError) {
      throw new Error(createError.message);
    }

    profile = created as UserProfile;
  }

  let signedUrl: string | null = null;

  if (profile.avatar_path) {
    try {
      signedUrl =
        await createAvatarSignedUrl(
          profile.avatar_path
        );
    } catch {
      signedUrl = null;
    }
  }

  return {
    profile,
    signedUrl,
  };
}

export async function saveAvatarProfile(
  file: File
): Promise<AvatarProfileResult> {
  const user = await getLoggedInUser();

  const previous = await supabase
    .from("user_profiles")
    .select("avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (previous.error) {
    throw new Error(previous.error.message);
  }

  const uploaded =
    await uploadAvatarImage(file);

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: user.id,
        avatar_path: uploaded.filePath,
        avatar_updated_at: now,
        updated_at: now,
      },
      {
        onConflict: "user_id",
      }
    )
    .select(
      "user_id, avatar_path, avatar_updated_at, created_at, updated_at"
    )
    .single();

  if (error) {
    try {
      await deleteAvatarImage(
        uploaded.filePath
      );
    } catch {
      // Preserve the original database error.
    }

    throw new Error(error.message);
  }

  return {
    profile: data as UserProfile,
    signedUrl: uploaded.signedUrl,
  };
}

export async function removeAvatarProfile(): Promise<void> {
  const user = await getLoggedInUser();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("avatar_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.avatar_path) {
    await deleteAvatarImage(
      data.avatar_path
    );
  }

  const { error: updateError } =
    await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: user.id,
          avatar_path: null,
          avatar_updated_at: null,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }
}