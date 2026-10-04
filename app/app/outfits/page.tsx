"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import OutfitCard from "@/components/OutfitCard";
import EmptyState from "@/components/EmptyState";
import {
  deleteSavedOutfit,
  getSavedOutfits,
  type SavedOutfit,
} from "@/lib/supabase/outfits";
import styles from "./page.module.css";

const FILTERS = [
  "All",
  "Coffee date",
  "First date",
  "Girls night",
  "College",
  "Office",
  "Interview",
  "Wedding",
  "Birthday",
  "Dinner",
  "Vacation",
  "Shopping",
  "Casual",
];

export default function SavedOutfitsPage() {
  const [filter, setFilter] = useState("All");
  const [outfits, setOutfits] =
    useState<SavedOutfit[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadOutfits() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const savedOutfits = await getSavedOutfits();
        setOutfits(savedOutfits);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load your saved outfits."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadOutfits();
  }, []);

  const filteredOutfits = useMemo(() => {
    if (filter === "All") return outfits;

    return outfits.filter(
      (outfit) => outfit.occasion === filter
    );
  }, [filter, outfits]);

  async function handleDelete(outfit: SavedOutfit) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${outfit.title}" from your saved outfits?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(outfit.id);

      await deleteSavedOutfit(outfit.id);

      setOutfits((current) =>
        current.filter(
          (currentOutfit) =>
            currentOutfit.id !== outfit.id
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete this outfit."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Your lookbook"
        title="Saved outfits"
        subtitle={`${outfits.length} saved ${
          outfits.length === 1 ? "look" : "looks"
        }, newest first.`}
        action={
          <PrimaryButton href="/app/style">
            Style me
          </PrimaryButton>
        }
      />

      <div className={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`${styles.filterChip} ${
              filter === item
                ? styles.filterChipActive
                : ""
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p
          style={{
            marginTop: "30px",
            color: "var(--ink-soft)",
          }}
        >
          Opening your lookbook...
        </p>
      ) : errorMessage ? (
        <EmptyState
          glyph="♡"
          title="We couldn't open your lookbook"
          subtitle={errorMessage}
          action={
            <PrimaryButton href="/app/style">
              Style me
            </PrimaryButton>
          }
        />
      ) : filteredOutfits.length > 0 ? (
        <div className={styles.grid}>
          {filteredOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              title={outfit.title}
              tags={[
                outfit.occasion,
                outfit.vibe,
                outfit.formality,
              ]}
              items={outfit.items || []}
              reason={outfit.reason}
              stylingTip={outfit.styling_tip}
              confidence={outfit.confidence}
              date={formatSavedDate(
                outfit.created_at
              )}
              isDeleting={deletingId === outfit.id}
              onDelete={() =>
                handleDelete(outfit)
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          glyph="♡"
          title={
            outfits.length === 0
              ? "No saved outfits yet"
              : "No outfits match this filter"
          }
          subtitle={
            outfits.length === 0
              ? "Generate a look in Style me and save it to begin your personal lookbook."
              : "Try another occasion filter."
          }
          action={
            <PrimaryButton href="/app/style">
              Style me
            </PrimaryButton>
          }
        />
      )}
    </>
  );
}

function formatSavedDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}