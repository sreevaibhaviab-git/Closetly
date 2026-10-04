"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";
import {
  getSavedOutfits,
  type SavedOutfit,
} from "@/lib/supabase/outfits";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  type CalendarEvent,
} from "@/lib/supabase/planner";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [notes, setNotes] = useState("");
  const [outfitId, setOutfitId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPlanner() {
      try {
        setLoading(true);

        const [calendarEvents, savedOutfits] = await Promise.all([
          getCalendarEvents(),
          getSavedOutfits(),
        ]);

        setEvents(calendarEvents);
        setOutfits(savedOutfits);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your calendar."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlanner();
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter((event) => {
      const date = new Date(`${event.event_date}T00:00:00`);
      return date >= today;
    });
  }, [events]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !eventDate || saving) return;

    try {
      setSaving(true);
      setMessage("Adding your plan...");

      const selectedOutfit =
        outfits.find((outfit) => outfit.id === outfitId) || null;

      const created = await createCalendarEvent({
        title,
        eventDate,
        eventTime,
        notes,
        outfit: selectedOutfit,
      });

      setEvents((current) =>
        [...current, created].sort((a, b) =>
          a.event_date.localeCompare(b.event_date)
        )
      );

      setTitle("");
      setEventDate("");
      setEventTime("");
      setNotes("");
      setOutfitId("");
      setMessage("Added to your Closetly calendar.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create this event."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event: CalendarEvent) {
    if (deletingId) return;

    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(event.id);
      await deleteCalendarEvent(event.id);

      setEvents((current) =>
        current.filter((item) => item.id !== event.id)
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete this event."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Plan your looks"
        title="Outfit calendar"
        subtitle="Save an outfit for every date, event and important moment."
      />

      <SectionCard title="Add to calendar">
        <form onSubmit={handleCreate}>
          <div style={formGridStyle}>
            <Field label="Event name">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Rooftop dinner"
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Date">
              <input
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                value={eventTime}
                onChange={(event) => setEventTime(event.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Saved outfit">
              <select
                value={outfitId}
                onChange={(event) => setOutfitId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Choose later</option>

                {outfits.map((outfit) => (
                  <option key={outfit.id} value={outfit.id}>
                    {outfit.title}
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Dress code, location or anything to remember"
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    resize: "vertical",
                  }}
                />
              </Field>
            </div>
          </div>

          {message && <StatusMessage message={message} />}

          <div style={{ marginTop: "18px" }}>
            <PrimaryButton type="submit">
              {saving ? "Adding..." : "Add to calendar"}
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>

      <div style={{ marginTop: "30px" }}>
        {loading ? (
          <p style={mutedStyle}>Opening your calendar...</p>
        ) : upcomingEvents.length === 0 ? (
          <EmptyState
            glyph="◇"
            title="Nothing planned yet"
            subtitle="Add an event above and assign one of your saved outfits."
          />
        ) : (
          <div style={cardGridStyle}>
            {upcomingEvents.map((event) => (
              <article key={event.id} style={cardStyle}>
                {event.outfit_snapshot?.items?.[0]?.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.outfit_snapshot.items[0].image_url}
                    alt={event.outfit_snapshot.title}
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 10",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}

                <div style={{ padding: "18px" }}>
                  <p style={eyebrowStyle}>
                    {formatDate(event.event_date)}
                    {event.event_time ? ` · ${event.event_time}` : ""}
                  </p>

                  <h2 style={{ fontSize: "20px", marginTop: "6px" }}>
                    {event.title}
                  </h2>

                  {event.outfit_snapshot && (
                    <p style={{ ...mutedStyle, marginTop: "8px" }}>
                      Outfit: {event.outfit_snapshot.title}
                    </p>
                  )}

                  {event.notes && (
                    <p style={{ ...mutedStyle, marginTop: "10px" }}>
                      {event.notes}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(event)}
                    disabled={deletingId === event.id}
                    style={deleteButtonStyle}
                  >
                    {deletingId === event.id
                      ? "Deleting..."
                      : "Delete event"}
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
      <span style={{ fontSize: "13px", fontWeight: 700 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <p role="status" style={{ ...mutedStyle, marginTop: "16px" }}>
      {message}
    </p>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "18px",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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

const eyebrowStyle: React.CSSProperties = {
  color: "var(--rose-deep)",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
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