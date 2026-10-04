"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";
import {
  createWishlistItem,
  deleteWishlistItem,
  getWishlistItems,
  type WishlistItem,
} from "@/lib/supabase/planner";

const CATEGORIES = [
  "Top",
  "Bottom",
  "Dress",
  "Jacket",
  "Shoes",
  "Bag",
  "Accessory",
  "Jewelry",
  "Other",
];

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState("");
  const [priority, setPriority] =
    useState<"Low" | "Medium" | "High">("Medium");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadWishlist() {
      try {
        setItems(await getWishlistItems());
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your wishlist."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      setMessage("Adding to your wishlist...");

      const created = await createWishlistItem({
        name,
        category,
        color,
        priority,
        notes,
        imageUrl,
      });

      setItems((current) => [created, ...current]);

      setName("");
      setCategory(CATEGORIES[0]);
      setColor("");
      setPriority("Medium");
      setImageUrl("");
      setNotes("");
      setMessage("Added to your wishlist ♡");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add this item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: WishlistItem) {
    if (deletingId) return;

    try {
      setDeletingId(item.id);
      await deleteWishlistItem(item.id);

      setItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete this item."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Closet goals"
        title="Wishlist"
        subtitle="Keep track of the missing pieces that would complete your wardrobe."
      />

      <SectionCard title="Add a wishlist item">
        <form onSubmit={handleCreate}>
          <div style={formGridStyle}>
            <Field label="Item name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Brown leather loafers"
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Category">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field label="Colour">
              <input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="e.g. Chocolate brown"
                style={inputStyle}
              />
            </Field>

            <Field label="Priority">
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as "Low" | "Medium" | "High"
                  )
                }
                style={inputStyle}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </Field>

            <Field label="Inspiration image URL">
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Optional image URL"
                style={inputStyle}
              />
            </Field>

            <Field label="Notes">
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Brand, budget or styling idea"
                style={inputStyle}
              />
            </Field>
          </div>

          {message && (
            <p role="status" style={{ ...mutedStyle, marginTop: "16px" }}>
              {message}
            </p>
          )}

          <div style={{ marginTop: "18px" }}>
            <PrimaryButton type="submit">
              {saving ? "Adding..." : "Add to wishlist"}
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>

      <div style={{ marginTop: "30px" }}>
        {loading ? (
          <p style={mutedStyle}>Opening your wishlist...</p>
        ) : items.length === 0 ? (
          <EmptyState
            glyph="♡"
            title="Your wishlist is empty"
            subtitle="Add a wardrobe goal above, such as the perfect bag, shoes or jacket."
          />
        ) : (
          <div style={cardGridStyle}>
            {items.map((item) => (
              <article key={item.id} style={cardStyle}>
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={placeholderStyle}>{item.category}</div>
                )}

                <div style={{ padding: "18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <h2 style={{ fontSize: "18px" }}>{item.name}</h2>

                    <span style={priorityStyle(item.priority)}>
                      {item.priority}
                    </span>
                  </div>

                  <p style={{ ...mutedStyle, marginTop: "7px" }}>
                    {item.category}
                    {item.color ? ` · ${item.color}` : ""}
                  </p>

                  {item.notes && (
                    <p style={{ ...mutedStyle, marginTop: "10px" }}>
                      {item.notes}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    style={deleteButtonStyle}
                  >
                    {deletingId === item.id
                      ? "Deleting..."
                      : "Remove from wishlist"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={{ fontSize: "13px", fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  );
}

function priorityStyle(
  priority: "Low" | "Medium" | "High"
): React.CSSProperties {
  return {
    flex: "0 0 auto",
    padding: "5px 10px",
    borderRadius: "999px",
    background:
      priority === "High"
        ? "var(--blush)"
        : priority === "Medium"
          ? "var(--cream)"
          : "var(--paper)",
    border: "1px solid var(--line)",
    color: "var(--rose-deep)",
    fontSize: "11px",
    fontWeight: 700,
  };
}

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "18px",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "20px",
};

const cardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--line)",
  borderRadius: "20px",
  background: "var(--paper)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid var(--line)",
  borderRadius: "13px",
  background: "var(--paper)",
  color: "var(--ink)",
  font: "inherit",
};

const mutedStyle: React.CSSProperties = {
  color: "var(--ink-soft)",
  lineHeight: 1.6,
};

const placeholderStyle: React.CSSProperties = {
  minHeight: "190px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(145deg, var(--blush), var(--cream))",
  color: "var(--rose-deep)",
  fontFamily: "var(--font-fraunces)",
};

const deleteButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "16px",
  padding: "10px",
  border: "1px solid var(--line)",
  borderRadius: "999px",
  background: "transparent",
  color: "var(--rose-deep)",
  font: "inherit",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
};