import { supabase } from "./client";

export type UploadedWardrobeImage = {
  publicUrl: string;
  filePath: string;
};

export type UploadedAvatarImage = {
  filePath: string;
  signedUrl: string;
};

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

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

function validateImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Please choose a JPG, PNG or WebP image."
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      "Please choose an image smaller than 10 MB."
    );
  }
}

function getFileExtension(file: File) {
  const extension =
    file.name.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "png";
  }

  if (extension === "webp") {
    return "webp";
  }

  return "jpg";
}

export async function uploadWardrobeImage(
  file: File
): Promise<UploadedWardrobeImage> {
  const user = await getLoggedInUser();

  validateImage(file);

  const fileExtension = getFileExtension(file);
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } =
    await supabase.storage
      .from("wardrobe-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from("wardrobe-images")
    .getPublicUrl(filePath);

  return {
    publicUrl: data.publicUrl,
    filePath,
  };
}

export async function deleteWardrobeImage(
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from("wardrobe-images")
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadAvatarImage(
  file: File
): Promise<UploadedAvatarImage> {
  const user = await getLoggedInUser();

  validateImage(file);

  const fileExtension = getFileExtension(file);
  const filePath = `${user.id}/avatar.${fileExtension}`;

  await removeExistingAvatarFiles(user.id);

  const { error: uploadError } =
    await supabase.storage
      .from("closetly-avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const signedUrl =
    await createAvatarSignedUrl(filePath);

  return {
    filePath,
    signedUrl,
  };
}

export async function createAvatarSignedUrl(
  filePath: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("closetly-avatars")
    .createSignedUrl(
      filePath,
      expiresInSeconds
    );

  if (error || !data?.signedUrl) {
    throw new Error(
      error?.message ||
        "Could not open your avatar photo."
    );
  }

  return data.signedUrl;
}

export async function deleteAvatarImage(
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from("closetly-avatars")
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }
}

async function removeExistingAvatarFiles(
  userId: string
): Promise<void> {
  const { data, error } = await supabase.storage
    .from("closetly-avatars")
    .list(userId, {
      limit: 20,
    });

  if (error) {
    throw new Error(error.message);
  }

  const filePaths = (data ?? [])
    .filter((item) => item.id)
    .map((item) => `${userId}/${item.name}`);

  if (filePaths.length === 0) {
    return;
  }

  const { error: removeError } =
    await supabase.storage
      .from("closetly-avatars")
      .remove(filePaths);

  if (removeError) {
    throw new Error(removeError.message);
  }
}