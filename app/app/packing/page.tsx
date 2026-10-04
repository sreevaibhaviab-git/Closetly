"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";
import {
  getWardrobeItems,
  type WardrobeItem,
} from "@/lib/supabase/wardrobe";
import {
  createPackingList,
  deletePackingList,
  getPackingLists,
  type PackingItem,
  type PackingList,
} from "@/lib/supabase/planner";

const TRIP_TYPES = [
  "City break",
  "Beach holiday",
  "Business trip",
  "Wedding trip",
  "Cold-weather trip",
  "Casual getaway",
];

export default function PackingPage() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [savedLists, setSavedLists] = useState<PackingList[]>([]);

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripType, setTripType] = useState(TRIP_TYPES[0]);
  const [notes, setNotes] = useState("");

  const [generatedItems, setGeneratedItems] = useState<PackingItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingList, setSavingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPacking() {
      try {
        const [wardrobeItems, lists] = await Promise.all([
          getWardrobeItems(),
          getPackingLists(),
        ]);

        setWardrobe(
          wardrobeItems.filter((item) => !item.is_in_laundry)
        );

        setSavedLists(lists);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not open Packing Mode."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPacking();
  }, []);

  const tripDays = useMemo(
    () => calculateTripDays(startDate, endDate),
    [startDate, endDate]
  );

  function handleGenerate() {
    if (!destination.trim()) {
      setMessage("Enter your destination before building the packing list.");
      return;
    }

    if (wardrobe.length === 0) {
      setMessage(
        "Add some available clothes before building your packing list."
      );
      return;
    }

    const packingItems = buildPackingList(
      wardrobe,
      tripDays,
      tripType,
      notes
    );

    setGeneratedItems(packingItems);

    setMessage(
      packingItems.length > 0
        ? `Closetly selected ${packingItems.length} suitable pieces for approximately ${tripDays} days.`
        : "Closetly could not find suitable clothing for this trip."
    );
  }

  async function handleSavePackingList() {
    if (
      !destination.trim() ||
      generatedItems.length === 0 ||
      savingList
    ) {
      setMessage(
        "Generate your packing list before saving it."
      );
      return;
    }

    try {
      setSavingList(true);
      setMessage("Saving your packing list...");

      const created = await createPackingList({
        title: `${destination.trim()} packing list`,
        destination: destination.trim(),
        startDate,
        endDate,
        tripType,
        items: generatedItems,
        notes,
      });

      setSavedLists((current) => [created, ...current]);
      setMessage("Packing list saved with all clothing images ♡");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save this packing list."
      );
    } finally {
      setSavingList(false);
    }
  }

  async function handleDeletePackingList(list: PackingList) {
    if (deletingId) return;

    const confirmed = window.confirm(
      `Delete "${list.title}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(list.id);

      await deletePackingList(list.id);

      setSavedLists((current) =>
        current.filter((item) => item.id !== list.id)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete this packing list."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Travel beautifully"
        title="Packing mode"
        subtitle="Build and save a visual packing list using clothing already inside your closet."
      />

      <SectionCard title="Plan your trip">
        <div style={formGridStyle}>
          <Field label="Destination">
            <input
              value={destination}
              onChange={(event) =>
                setDestination(event.target.value)
              }
              placeholder="e.g. Goa"
              style={inputStyle}
            />
          </Field>

          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="End date">
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="Trip type">
            <select
              value={tripType}
              onChange={(event) =>
                setTripType(event.target.value)
              }
              style={inputStyle}
            >
              {TRIP_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Extra notes">
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="e.g. Beach mornings, sightseeing and one nice dinner"
                style={{
                  ...inputStyle,
                  minHeight: "90px",
                  resize: "vertical",
                }}
              />
            </Field>
          </div>
        </div>

        {message && (
          <p
            role="status"
            style={{
              ...mutedStyle,
              marginTop: "16px",
            }}
          >
            {message}
          </p>
        )}

        <div style={buttonRowStyle}>
          <PrimaryButton
            type="button"
            onClick={handleGenerate}
          >
            Build packing list
          </PrimaryButton>

          {generatedItems.length > 0 && (
            <button
              type="button"
              onClick={handleSavePackingList}
              disabled={savingList}
              style={secondaryButtonStyle}
            >
              {savingList
                ? "Saving..."
                : "Save packing list"}
            </button>
          )}
        </div>
      </SectionCard>

      <div style={{ marginTop: "30px" }}>
        {loading ? (
          <p style={mutedStyle}>
            Opening your closet...
          </p>
        ) : generatedItems.length === 0 ? (
          <EmptyState
            glyph="✈"
            title="No packing list generated yet"
            subtitle="Enter your destination and Closetly will select practical pieces from your wardrobe."
          />
        ) : (
          <SectionCard
            title={`${destination || "Your trip"} · ${tripDays} days`}
            subtitle={`${generatedItems.length} suitable wardrobe pieces selected.`}
          >
            <div style={packingGridStyle}>
              {generatedItems.map((item) => (
                <PackingItemCard
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {savedLists.length > 0 && (
        <section style={{ marginTop: "42px" }}>
          <div style={sectionHeadingStyle}>
            <div>
              <p style={eyebrowStyle}>
                Your travel wardrobe
              </p>

              <h2 style={sectionTitleStyle}>
                Saved packing lists
              </h2>
            </div>

            <p style={mutedStyle}>
              Open any list to see every packed item.
            </p>
          </div>

          <div style={savedListsGridStyle}>
            {savedLists.map((list) => (
              <article
                key={list.id}
                style={savedPackingCardStyle}
              >
                <div style={savedCollageStyle}>
                  {list.items
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        style={savedCollageCellStyle}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.name || "Packed item"}
                          style={savedCollageImageStyle}
                        />
                      </div>
                    ))}

                  {list.items.length === 0 && (
                    <div style={emptyCollageStyle}>
                      No images
                    </div>
                  )}
                </div>

                <div style={{ padding: "20px" }}>
                  <p style={eyebrowStyle}>
                    {list.trip_type}
                  </p>

                  <h3
                    style={{
                      marginTop: "6px",
                      fontSize: "21px",
                    }}
                  >
                    {list.title}
                  </h3>

                  <p
                    style={{
                      ...mutedStyle,
                      marginTop: "8px",
                    }}
                  >
                    {list.items.length} packed items
                    {list.start_date
                      ? ` · ${formatDate(list.start_date)}`
                      : ""}
                  </p>

                  {list.destination && (
                    <p
                      style={{
                        ...mutedStyle,
                        marginTop: "4px",
                      }}
                    >
                      Destination: {list.destination}
                    </p>
                  )}

                  {list.notes && (
                    <p
                      style={{
                        ...mutedStyle,
                        marginTop: "10px",
                      }}
                    >
                      {list.notes}
                    </p>
                  )}

                  <details style={detailsStyle}>
                    <summary style={summaryStyle}>
                      View full packing list
                    </summary>

                    <div style={fullListGridStyle}>
                      {list.items.map((item) => (
                        <article
                          key={item.id}
                          style={miniItemCardStyle}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.name || "Packed item"}
                            style={miniItemImageStyle}
                          />

                          <div style={{ padding: "10px" }}>
                            <p
                              style={{
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              {item.name ||
                                "Untitled item"}
                            </p>

                            <p
                              style={{
                                ...mutedStyle,
                                marginTop: "3px",
                                fontSize: "11px",
                              }}
                            >
                              {item.category ||
                                "Clothing"}
                              {item.color
                                ? ` · ${item.color}`
                                : ""}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </details>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeletePackingList(list)
                    }
                    disabled={
                      deletingId === list.id
                    }
                    style={deleteButtonStyle}
                  >
                    {deletingId === list.id
                      ? "Deleting..."
                      : "Delete packing list"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function PackingItemCard({
  item,
}: {
  item: PackingItem;
}) {
  return (
    <article style={packingItemCardStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.name || "Packing item"}
        style={packingImageStyle}
      />

      <div style={{ padding: "13px" }}>
        <p style={{ fontWeight: 700 }}>
          {item.name || "Untitled item"}
        </p>

        <p
          style={{
            ...mutedStyle,
            marginTop: "4px",
            fontSize: "12px",
          }}
        >
          {item.category || "Clothing"}
          {item.color
            ? ` · ${item.color}`
            : ""}
        </p>
      </div>
    </article>
  );
}

function buildPackingList(
  wardrobe: WardrobeItem[],
  days: number,
  tripType: string,
  notes: string
): PackingItem[] {
  const suitable = wardrobe.filter((item) =>
    isSuitablePackingItem(
      item,
      tripType,
      notes
    )
  );

  const byCategory = (category: string) =>
    suitable.filter(
      (item) => item.category === category
    );

  const selected: WardrobeItem[] = [];

  const add = (
    items: WardrobeItem[],
    count: number
  ) => {
    selected.push(
      ...items.slice(0, Math.max(0, count))
    );
  };

  add(
    byCategory("Top"),
    Math.min(days + 1, 5)
  );

  add(
    byCategory("Bottom"),
    Math.min(Math.ceil(days / 2), 3)
  );

  if (tripType === "Wedding trip") {
    add(byCategory("Dress"), 2);
  } else {
    add(
      byCategory("Dress").filter(
        (item) => !isBridalItem(item)
      ),
      1
    );
  }

  add(byCategory("Shoes"), 2);
  add(byCategory("Bag"), 1);
  add(byCategory("Accessory"), 3);
  add(byCategory("Jewelry"), 2);

  add(
    byCategory("Jacket"),
    tripType === "Cold-weather trip" ||
      tripType === "Business trip"
      ? 2
      : 1
  );

  return Array.from(
    new Map(
      selected.map((item) => [
        item.id,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color,
          image_url: item.image_url,
        },
      ])
    ).values()
  );
}

function isSuitablePackingItem(
  item: WardrobeItem,
  tripType: string,
  notes: string
) {
  if (item.is_in_laundry) {
    return false;
  }

  const text = [
    item.name,
    item.category,
    item.color,
    notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    isBridalItem(item) &&
    tripType !== "Wedding trip"
  ) {
    return false;
  }

  if (
    tripType === "Beach holiday" &&
    [
      "heavy coat",
      "thermal",
      "thick wool",
      "snow boot",
      "puffer",
    ].some((word) => text.includes(word))
  ) {
    return false;
  }

  if (
    tripType !== "Cold-weather trip" &&
    [
      "thermal",
      "puffer coat",
      "snow boot",
    ].some((word) => text.includes(word))
  ) {
    return false;
  }

  if (
    tripType === "Business trip" &&
    [
      "bikini",
      "swimsuit",
      "beach cover",
    ].some((word) => text.includes(word))
  ) {
    return false;
  }

  return true;
}

function isBridalItem(item: WardrobeItem) {
  const text = [
    item.name,
    item.category,
    item.color,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return [
    "bridal",
    "wedding gown",
    "wedding dress",
    "bride",
    "ball gown",
  ].some((word) => text.includes(word));
}

function calculateTripDays(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) {
    return 3;
  }

  const start = new Date(
    `${startDate}T00:00:00`
  );

  const end = new Date(
    `${endDate}T00:00:00`
  );

  const difference =
    Math.floor(
      (end.getTime() - start.getTime()) /
        86400000
    ) + 1;

  return Math.max(1, difference);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: "8px",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${date}T00:00:00`)
  );
}

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "18px",
};

const buttonRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "18px",
};

const packingGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "16px",
};

const savedListsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "22px",
};

const fullListGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "12px",
  marginTop: "15px",
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

const packingItemCardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--line)",
  borderRadius: "17px",
  background: "var(--paper)",
};

const packingImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 5",
  objectFit: "cover",
  display: "block",
};

const savedPackingCardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--line)",
  borderRadius: "22px",
  background: "var(--paper)",
};

const savedCollageStyle: React.CSSProperties = {
  minHeight: "250px",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  background: "var(--cream)",
};

const savedCollageCellStyle: React.CSSProperties = {
  minHeight: "125px",
  overflow: "hidden",
  borderRight:
    "1px solid rgba(36, 30, 25, 0.06)",
  borderBottom:
    "1px solid rgba(36, 30, 25, 0.06)",
};

const savedCollageImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "125px",
  objectFit: "cover",
  display: "block",
};

const emptyCollageStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  display: "grid",
  placeItems: "center",
  color: "var(--ink-soft)",
};

const detailsStyle: React.CSSProperties = {
  marginTop: "18px",
  paddingTop: "15px",
  borderTop: "1px solid var(--line)",
};

const summaryStyle: React.CSSProperties = {
  cursor: "pointer",
  color: "var(--rose-deep)",
  fontSize: "13px",
  fontWeight: 700,
};

const miniItemCardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--line)",
  borderRadius: "14px",
  background: "var(--paper)",
};

const miniItemImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "4 / 5",
  objectFit: "cover",
  display: "block",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 20px",
  border: "1px solid var(--line)",
  borderRadius: "999px",
  background: "var(--paper)",
  color: "var(--ink)",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};

const eyebrowStyle: React.CSSProperties = {
  color: "var(--rose-deep)",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const sectionHeadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "14px",
  marginBottom: "18px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-fraunces)",
  fontSize: "27px",
};

const deleteButtonStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "18px",
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