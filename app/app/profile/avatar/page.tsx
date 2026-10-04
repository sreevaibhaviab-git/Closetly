"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Check,
  ImagePlus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import {
  getAvatarProfile,
  removeAvatarProfile,
  saveAvatarProfile,
} from "@/lib/supabase/profile";
import styles from "./page.module.css";

const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

export default function AvatarPage() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [savedAvatarUrl, setSavedAvatarUrl] =
    useState<string | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadAvatar() {
      try {
        const result =
          await getAvatarProfile();

        setSavedAvatarUrl(
          result.signedUrl
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your avatar."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadAvatar();
  }, []);

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  function chooseFile(
    file: File | undefined
  ) {
    if (!file) {
      return;
    }

    if (
      !SUPPORTED_TYPES.includes(
        file.type
      )
    ) {
      setMessage(
        "Please choose a JPG, PNG or WebP image."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage(
        "Please choose an image smaller than 10 MB."
      );
      return;
    }

    if (
      previewUrl?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    setSelectedFile(file);

    setPreviewUrl(
      URL.createObjectURL(file)
    );

    setMessage("");
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    chooseFile(
      event.target.files?.[0]
    );
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDragging(false);

    chooseFile(
      event.dataTransfer.files?.[0]
    );
  }

  async function handleSave() {
    if (!selectedFile || isSaving) {
      setMessage(
        "Choose a clear full-body photo first."
      );
      return;
    }

    try {
      setIsSaving(true);

      setMessage(
        "Registering your avatar..."
      );

      const result =
        await saveAvatarProfile(
          selectedFile
        );

      setSavedAvatarUrl(
        result.signedUrl
      );

      setSelectedFile(null);

      if (
        previewUrl?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl(null);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      setMessage(
        "Avatar registered. Closetly can now reuse this photo for Virtual Try-On."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not register your avatar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !savedAvatarUrl ||
      isDeleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete your saved avatar? Virtual Try-On will be unavailable until you upload another photo."
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);

      setMessage(
        "Deleting your avatar..."
      );

      await removeAvatarProfile();

      setSavedAvatarUrl(null);
      setSelectedFile(null);

      if (
        previewUrl?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setPreviewUrl(null);

      setMessage(
        "Your avatar was deleted."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete your avatar."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const displayedImage =
    previewUrl || savedAvatarUrl;

  return (
    <>
      <PageHeader
        eyebrow="Virtual Try-On"
        title="Register your avatar"
        subtitle="Upload one clear full-body photo. Closetly will securely reuse it whenever you try on an outfit."
      />

      <div className={styles.layout}>
        <section
          className={styles.uploadCard}
        >
          <div
            className={
              styles.cardHeading
            }
          >
            <div
              className={
                styles.headingIcon
              }
            >
              <Camera size={20} />
            </div>

            <div>
              <h2>
                Your full-body photo
              </h2>

              <p>
                This photo remains private
                and will not appear in your
                wardrobe.
              </p>
            </div>
          </div>

          <div
            className={`${styles.dropzone} ${
              isDragging
                ? styles.dropzoneActive
                : ""
            }`}
            onClick={() =>
              fileInputRef.current?.click()
            }
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() =>
              setIsDragging(false)
            }
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
            <ImagePlus size={29} />

            <p
              className={
                styles.dropTitle
              }
            >
              Drop your photo here
            </p>

            <p
              className={
                styles.dropDescription
              }
            >
              Choose a clear JPG, PNG or
              WebP image up to 10 MB.
            </p>

            <SecondaryButton
              type="button"
              small
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              Choose photo
            </SecondaryButton>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={
                styles.hiddenInput
              }
              onChange={
                handleFileChange
              }
            />
          </div>

          <div
            className={
              styles.guidanceGrid
            }
          >
            <GuidanceItem text="Keep your complete body visible from head to feet." />

            <GuidanceItem text="Stand naturally, facing forward or at a slight angle." />

            <GuidanceItem text="Use good lighting and a simple background." />

            <GuidanceItem text="Avoid crossed arms, heavy coats and obstructed poses." />
          </div>

          {message && (
            <p
              role="status"
              className={styles.message}
            >
              {message}
            </p>
          )}

          <div
            className={styles.actions}
          >
            <PrimaryButton
              type="button"
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <RefreshCw
                    size={16}
                    className={
                      styles.spinner
                    }
                  />

                  Saving...
                </>
              ) : savedAvatarUrl ? (
                "Replace avatar"
              ) : (
                "Register avatar"
              )}
            </PrimaryButton>

            {savedAvatarUrl && (
              <button
                type="button"
                className={
                  styles.deleteButton
                }
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={15} />

                {isDeleting
                  ? "Deleting..."
                  : "Delete avatar"}
              </button>
            )}
          </div>
        </section>

        <aside
          className={
            styles.previewCard
          }
        >
          <div
            className={
              styles.previewHeader
            }
          >
            <div>
              <p
                className={
                  styles.eyebrow
                }
              >
                Private preview
              </p>

              <h2>
                Your Closetly avatar
              </h2>
            </div>

            {savedAvatarUrl && (
              <span
                className={
                  styles.readyBadge
                }
              >
                <Check size={13} />

                Ready
              </span>
            )}
          </div>

          <div
            className={
              styles.previewFrame
            }
          >
            {isLoading ? (
              <div
                className={
                  styles.emptyPreview
                }
              >
                <RefreshCw
                  size={25}
                  className={
                    styles.spinner
                  }
                />

                <p>
                  Opening your avatar...
                </p>
              </div>
            ) : displayedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayedImage}
                alt="Your saved Closetly avatar"
                className={
                  styles.previewImage
                }
              />
            ) : (
              <div
                className={
                  styles.emptyPreview
                }
              >
                <UserRound size={37} />

                <p>
                  Your avatar preview will
                  appear here.
                </p>
              </div>
            )}
          </div>

          <div
            className={
              styles.privacyNotice
            }
          >
            <ShieldCheck size={17} />

            <p>
              Stored privately and
              accessible only through your
              signed-in Closetly account.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function GuidanceItem({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className={
        styles.guidanceItem
      }
    >
      <Check size={14} />

      <span>{text}</span>
    </div>
  );
}