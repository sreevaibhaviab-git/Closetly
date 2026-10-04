"use client";

import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import {
  getAvatarProfile,
} from "@/lib/supabase/profile";
import styles from "./TryOnButton.module.css";

export type TryOnItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
};

type TryOnButtonProps = {
  outfitTitle: string;
  items: TryOnItem[];
  occasion?: string;
  vibe?: string;
  timeOfDay?: string;
  formality?: string;
  description?: string;
  disabled?: boolean;
};

type TryOnResponse = {
  success: boolean;
  imageUrl?: string;
  message?: string;
};

export default function TryOnButton({
  outfitTitle,
  items,
  occasion,
  vibe,
  timeOfDay,
  formality,
  description,
  disabled = false,
}: TryOnButtonProps) {
  const [isGenerating, setIsGenerating] =
    useState(false);

  const [generatedImage, setGeneratedImage] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  async function handleTryOn() {
    if (
      isGenerating ||
      disabled ||
      items.length === 0
    ) {
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage("");
      setGeneratedImage(null);
      setIsModalOpen(true);

      const avatarResult =
        await getAvatarProfile();

      if (
        !avatarResult.profile.avatar_path ||
        !avatarResult.signedUrl
      ) {
        throw new Error(
          "Upload your permanent avatar before using Virtual Try-On."
        );
      }

      const response = await fetch(
        "/api/try-on",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            avatarUrl:
              avatarResult.signedUrl,

            outfitTitle,

            occasion:
              occasion || null,

            vibe:
              vibe || null,

            timeOfDay:
              timeOfDay || null,

            formality:
              formality || null,

            description:
              description || null,

            items: items.map((item) => ({
              id: item.id,
              name: item.name,
              category: item.category,
              color: item.color,
              image_url:
                item.image_url,
            })),
          }),
        }
      );

      const data =
        (await response.json()) as TryOnResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.imageUrl
      ) {
        throw new Error(
          data.message ||
            "Closetly could not generate your try-on image."
        );
      }

      setGeneratedImage(data.imageUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your virtual try-on."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function closeModal() {
    if (isGenerating) return;

    setIsModalOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTryOn}
        disabled={
          disabled ||
          isGenerating ||
          items.length === 0
        }
        className={styles.tryOnButton}
      >
        {isGenerating ? (
          <LoaderCircle
            size={15}
            className={styles.spinner}
          />
        ) : (
          <Sparkles size={15} />
        )}

        {isGenerating
          ? "Creating try-on..."
          : "Virtual Try-On"}
      </button>

      {isModalOpen && (
        <div
          className={styles.overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="try-on-title"
          >
            <div className={styles.header}>
              <div>
                <p className={styles.eyebrow}>
                  AI fitting room
                </p>

                <h2
                  id="try-on-title"
                  className={styles.title}
                >
                  {outfitTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isGenerating}
                className={styles.closeButton}
                aria-label="Close virtual try-on"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.content}>
              {isGenerating && (
                <div
                  className={
                    styles.loadingPanel
                  }
                >
                  <div
                    className={
                      styles.loadingIcon
                    }
                  >
                    <LoaderCircle
                      size={24}
                      className={
                        styles.spinner
                      }
                    />
                  </div>

                  <h3
                    className={
                      styles.loadingTitle
                    }
                  >
                    Dressing your avatar
                  </h3>

                  <p
                    className={
                      styles.loadingText
                    }
                  >
                    Closetly is combining your
                    permanent avatar with this
                    exact outfit.
                  </p>
                </div>
              )}

              {!isGenerating &&
                errorMessage && (
                  <div
                    className={
                      styles.errorPanel
                    }
                  >
                    <p
                      className={
                        styles.errorTitle
                      }
                    >
                      Try-on unavailable
                    </p>

                    <p
                      className={
                        styles.errorText
                      }
                    >
                      {errorMessage}
                    </p>

                    {errorMessage.includes(
                      "Upload your permanent avatar"
                    ) ? (
                      <a
                        href="/app/profile/avatar"
                        className={
                          styles.avatarLink
                        }
                      >
                        Open avatar settings
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          handleTryOn
                        }
                        className={
                          styles.retryButton
                        }
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}

              {!isGenerating &&
                generatedImage && (
                  <div
                    className={
                      styles.resultPanel
                    }
                  >
                    <div
                      className={
                        styles.imageFrame
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          generatedImage
                        }
                        alt={`Virtual try-on for ${outfitTitle}`}
                        className={
                          styles.resultImage
                        }
                      />
                    </div>

                    <div
                      className={
                        styles.resultFooter
                      }
                    >
                      <div>
                        <p
                          className={
                            styles.resultTitle
                          }
                        >
                          Your virtual look
                        </p>

                        <p
                          className={
                            styles.resultText
                          }
                        >
                          Generated using your
                          saved avatar and the
                          selected wardrobe
                          pieces.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleTryOn
                        }
                        className={
                          styles.regenerateButton
                        }
                      >
                        <Sparkles
                          size={14}
                        />
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}