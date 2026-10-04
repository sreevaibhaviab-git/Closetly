"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import SecondaryButton from "@/components/SecondaryButton";
import PrimaryButton from "@/components/PrimaryButton";
import EmptyState from "@/components/EmptyState";
import ClothingCard from "@/components/ClothingCard";
import styles from "./page.module.css";

type RecentWardrobeItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  image_url: string;
};

export default function DashboardPage() {
  const [name, setName] = useState("there");
  const [recentItems, setRecentItems] = useState<RecentWardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Please log in to open your dashboard.");
        }

        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "there";

        setName(displayName);

        const { data: items, error: itemsError } = await supabase
          .from("wardrobe_items")
          .select("id, name, category, color, image_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        if (itemsError) {
          throw itemsError;
        }

        setRecentItems(items ?? []);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "We could not load your dashboard.";

        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Good to see you"
        title={`Hi, ${name} 👋`}
        subtitle="Ready to create today’s outfit?"
      />

      <div className={styles.grid}>
        <SectionCard
          title="Today&apos;s outfit"
          subtitle="Chosen for today&apos;s weather and what&apos;s clean."
        >
          <EmptyState
            glyph="✦"
            title="No outfit generated yet"
            subtitle="Choose an occasion and Closetly will build a look using your own wardrobe."
            action={
              <PrimaryButton href="/app/style">
                Style me
              </PrimaryButton>
            }
          />
        </SectionCard>

        <SectionCard
          title="Quick actions"
          subtitle="Jump back into your closet."
        >
          <div className={styles.quickActions}>
            <SecondaryButton
              href="/app/closet/upload"
              fullWidth
            >
              Upload clothing
            </SecondaryButton>

            <SecondaryButton
              href="/app/style"
              fullWidth
            >
              Style me
            </SecondaryButton>

            <SecondaryButton
              href="/app/closet"
              fullWidth
            >
              Browse my closet
            </SecondaryButton>

            <SecondaryButton
              href="/app/outfits"
              fullWidth
            >
              Saved outfits
            </SecondaryButton>
          </div>
        </SectionCard>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className="serif">Recently added</h2>
          <Link href="/app/closet">View closet</Link>
        </div>

        {isLoading ? (
          <p
            style={{
              marginTop: "24px",
              color: "var(--ink-soft)",
            }}
          >
            Opening your closet...
          </p>
        ) : errorMessage ? (
          <EmptyState
            title="We could not load your closet"
            subtitle={errorMessage}
            action={
              <PrimaryButton href="/app/closet">
                Open closet
              </PrimaryButton>
            }
          />
        ) : recentItems.length === 0 ? (
          <EmptyState
            title="Your closet is empty"
            subtitle="Upload your first pieces and Closetly will start learning your style."
            action={
              <PrimaryButton href="/app/closet/upload">
                Upload clothing
              </PrimaryButton>
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {recentItems.map((item) => (
              <ClothingCard
                key={item.id}
                name={item.name || "Untitled item"}
                category={item.category || "Clothing"}
                imageUrl={item.image_url}
                color={item.color}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className="serif">Saved outfits</h2>
          <Link href="/app/outfits">View all</Link>
        </div>

        <EmptyState
          glyph="♡"
          title="No saved outfits yet"
          subtitle="Outfits you love from Style me will show up here."
          action={
            <PrimaryButton href="/app/style">
              Style me
            </PrimaryButton>
          }
        />
      </section>
    </>
  );
}