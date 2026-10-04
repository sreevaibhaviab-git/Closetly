"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PrimaryButton from "@/components/PrimaryButton";
import ClothingCard from "@/components/ClothingCard";
import EmptyState from "@/components/EmptyState";
import {
  deleteWardrobeItem,
  getWardrobeItems,
  updateWardrobeItem,
  type WardrobeItem,
} from "@/lib/supabase/wardrobe";
import { deleteWardrobeImage } from "@/lib/supabase/storage";
import styles from "./page.module.css";

const FILTERS = [
  "All",
  "Favourites",
  "Laundry",
  "Top",
  "Bottom",
  "Dress",
  "Jacket",
  "Shoes",
  "Bag",
  "Accessory",
  "Jewelry",
];

export default function ClosetPage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadWardrobe();
  }, []);

  async function loadWardrobe() {
    try {
      setLoading(true);
      setErrorMessage("");

      const wardrobeItems = await getWardrobeItems();
      setItems(wardrobeItems);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load your wardrobe."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFavorite(item: WardrobeItem) {
    if (updatingId) return;

    const nextValue = !item.is_favorite;

    try {
      setUpdatingId(item.id);

      await updateWardrobeItem(item.id, {
        is_favorite: nextValue,
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                is_favorite: nextValue,
              }
            : currentItem
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not update this favourite."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLaundry(item: WardrobeItem) {
    if (updatingId) return;

    const nextValue = !item.is_in_laundry;

    try {
      setUpdatingId(item.id);

      await updateWardrobeItem(item.id, {
        is_in_laundry: nextValue,
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                is_in_laundry: nextValue,
              }
            : currentItem
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not update the laundry status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(item: WardrobeItem) {
    if (updatingId) return;

    const confirmed = window.confirm(
      `Delete "${item.name || "this clothing item"}" permanently?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(item.id);

      await deleteWardrobeItem(item.id);

      const storagePath = getStoragePathFromPublicUrl(item.image_url);

      if (storagePath) {
        try {
          await deleteWardrobeImage(storagePath);
        } catch (storageError) {
          console.warn(
            "The database item was deleted, but the image could not be removed:",
            storageError
          );
        }
      }

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) => currentItem.id !== item.id
        )
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete this clothing item."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = (item.name || "")
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      let matchesFilter = true;

      if (filter === "Favourites") {
        matchesFilter = item.is_favorite;
      } else if (filter === "Laundry") {
        matchesFilter = item.is_in_laundry;
      } else if (filter !== "All") {
        matchesFilter = item.category === filter;
      }

      return matchesSearch && matchesFilter;
    });
  }, [items, query, filter]);

  const favouriteCount = items.filter(
    (item) => item.is_favorite
  ).length;

  const laundryCount = items.filter(
    (item) => item.is_in_laundry
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Your wardrobe"
        title="My Closet"
        subtitle={`${items.length} pieces · ${favouriteCount} favourites · ${laundryCount} in laundry`}
        action={
          <PrimaryButton href="/app/closet/upload">
            Add Clothing
          </PrimaryButton>
        }
      />

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search clothes..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search clothes"
        />
      </div>

      <div className={styles.filters}>
        {FILTERS.map((item) => {
          const label =
            item === "Favourites"
              ? `Favourites (${favouriteCount})`
              : item === "Laundry"
                ? `Laundry (${laundryCount})`
                : item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`${styles.filterChip} ${
                filter === item ? styles.filterChipActive : ""
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p
          style={{
            marginTop: "30px",
            color: "var(--ink-soft)",
          }}
        >
          Opening your closet...
        </p>
      ) : errorMessage ? (
        <EmptyState
          title="We couldn't open your closet"
          subtitle={errorMessage}
          action={
            <PrimaryButton href="/app/closet/upload">
              Add Clothing
            </PrimaryButton>
          }
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={getEmptyTitle(filter, items.length)}
          subtitle={getEmptySubtitle(filter, items.length)}
          action={
            filter === "All" && items.length === 0 ? (
              <PrimaryButton href="/app/closet/upload">
                Upload Clothing
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => (
            <ClothingCard
              key={item.id}
              name={item.name || "Untitled item"}
              category={item.category || "Clothing"}
              imageUrl={item.image_url}
              color={item.color}
              isFavorite={item.is_favorite}
              isInLaundry={item.is_in_laundry}
              isUpdating={updatingId === item.id}
              onFavorite={() => handleFavorite(item)}
              onLaundry={() => handleLaundry(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function getEmptyTitle(filter: string, itemCount: number) {
  if (itemCount === 0) {
    return "Your closet is waiting";
  }

  if (filter === "Favourites") {
    return "No favourite pieces yet";
  }

  if (filter === "Laundry") {
    return "Your laundry basket is empty";
  }

  return "No clothes match";
}

function getEmptySubtitle(filter: string, itemCount: number) {
  if (itemCount === 0) {
    return "Upload your first clothing item and it will appear here.";
  }

  if (filter === "Favourites") {
    return "Tap the heart on any clothing item to save it here.";
  }

  if (filter === "Laundry") {
    return "Items marked as laundry will appear here and stay out of outfit suggestions.";
  }

  return "Try another search or category.";
}

function getStoragePathFromPublicUrl(
  publicUrl: string
): string | null {
  const marker =
    "/storage/v1/object/public/wardrobe-images/";

  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const encodedPath = publicUrl.slice(
    markerIndex + marker.length
  );

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return encodedPath;
  }
}