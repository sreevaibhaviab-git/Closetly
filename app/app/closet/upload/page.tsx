"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import Input from "@/components/Input";
import Select from "@/components/Select";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import { supabase } from "@/lib/supabase/client";
import {
  deleteWardrobeImage,
  uploadWardrobeImage,
} from "@/lib/supabase/storage";
import styles from "./page.module.css";

const AI_WEBHOOK =
  "http://localhost:5678/webhook/80834857-25c5-488f-bd34-09003c86ecab";

const CATEGORIES = [
  "Top",
  "Bottom",
  "Dress",
  "Jacket",
  "Shoes",
  "Bag",
  "Accessory",
  "Jewelry",
];

type ClothingAnalysis = {
  success: boolean;
  clothing: {
    name?: string;
    category?: string;
    color?: string;
    pattern?: string;
    material?: string;
    style?: string[];
    season?: string[];
    occasions?: string[];
  };
};

async function analyzeClothing(
  imageUrl: string
): Promise<ClothingAnalysis> {
  const response = await fetch(AI_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
    }),
  });

  if (!response.ok) {
    throw new Error("Closetly Vision could not analyse this image.");
  }

  return response.json();
}

export default function UploadClothingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function readFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose a JPG, PNG or another image file.");
      return;
    }

    setSelectedFile(file);
    setMessage("");

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    readFile(event.dataTransfer.files?.[0]);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    readFile(event.target.files?.[0]);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (isSaving) return;

    if (!selectedFile) {
      setMessage("Please choose a clothing photo first.");
      return;
    }

    setIsSaving(true);
    setMessage("Uploading your clothing photo...");

    let uploadedFilePath: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to add clothing.");
      }

      const uploadedImage =
        await uploadWardrobeImage(selectedFile);

      uploadedFilePath = uploadedImage.filePath;

      setMessage("Closetly Vision is analysing your item...");

      const analysis = await analyzeClothing(
        uploadedImage.publicUrl
      );

      const detectedName =
        analysis.clothing?.name?.trim() ||
        name.trim() ||
        "Untitled clothing item";

      const detectedCategory =
        analysis.clothing?.category &&
        CATEGORIES.includes(analysis.clothing.category)
          ? analysis.clothing.category
          : category;

      const detectedColor =
        analysis.clothing?.color?.trim() || null;

      setName(detectedName);
      setCategory(detectedCategory);

      setMessage("Saving your item to My Closet...");

      const { error: insertError } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          name: detectedName,
          category: detectedCategory,
          color: detectedColor,
          image_url: uploadedImage.publicUrl,
        });

      if (insertError) {
        throw insertError;
      }

      setMessage("Your item is ready.");
      router.push("/app/closet");
      router.refresh();
    } catch (error) {
      if (uploadedFilePath) {
        try {
          await deleteWardrobeImage(uploadedFilePath);
        } catch {
          // Keep the original error visible.
        }
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your item.";

      setMessage(errorMessage);
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="My closet"
        title="Upload clothing"
        subtitle="Upload a photo and Closetly Vision will identify the item for you."
      />

      <form onSubmit={handleSave} className={styles.layout}>
        <div>
          <div
            className={`${styles.dropzone} ${
              isDragging ? styles.dropzoneActive : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                fileInputRef.current?.click();
              }
            }}
          >
            <div className={styles.dropIcon} aria-hidden="true">
              ↑
            </div>

            <p className={styles.dropTitle}>
              Drag a photo here
            </p>

            <p className={styles.dropSubtitle}>
              Choose one clear clothing photo. Closetly Vision
              will identify it automatically.
            </p>

            <SecondaryButton
              type="button"
              small
              onClick={() => fileInputRef.current?.click()}
            >
              Upload from device
            </SecondaryButton>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.hiddenInput}
            />
          </div>

          <div className={styles.fields}>
            <Input
              id="itemName"
              label="Name"
              placeholder="AI will detect this automatically"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

            <Select
              id="category"
              label="Category"
              options={CATEGORIES}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            />
          </div>

          {message && (
            <p
              role="status"
              style={{
                marginTop: "16px",
                color: "var(--ink-soft)",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}

          <div className={styles.actions}>
            <PrimaryButton type="submit">
              {isSaving
                ? "Closetly Vision is working..."
                : "Analyse and save"}
            </PrimaryButton>

            <SecondaryButton href="/app/closet">
              Cancel
            </SecondaryButton>
          </div>
        </div>

        <SectionCard
          title="Preview"
          className={styles.previewCard}
        >
          <p className={styles.previewLabel}>
            How it will look in your closet
          </p>

          <div className={styles.previewFrame}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Selected clothing preview"
                className={styles.previewImage}
              />
            ) : (
              <p className={styles.previewEmpty}>
                Your clothing photo will appear here.
              </p>
            )}
          </div>
        </SectionCard>
      </form>
    </>
  );
}