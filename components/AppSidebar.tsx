"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AppSidebar.module.css";

const NAV_ITEMS = [
  {
    href: "/app",
    label: "Dashboard",
  },
  {
    href: "/app/closet",
    label: "My closet",
  },
  {
    href: "/app/closet/upload",
    label: "Upload clothing",
  },
  {
    href: "/app/style",
    label: "Style me",
  },
  {
    href: "/app/chat",
    label: "Closet chat",
  },
  {
    href: "/app/outfits",
    label: "Saved outfits",
  },
  {
    href: "/app/calendar",
    label: "Calendar",
  },
  {
    href: "/app/packing",
    label: "Packing mode",
  },
  {
    href: "/app/wishlist",
    label: "Wishlist",
  },
  {
    href: "/app/profile/avatar",
    label: "My avatar",
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        Closetly
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(
                item.href
              );

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${
              isActive
                ? styles.linkActive
                : ""
            }`}
          >
            <span
              className={styles.dot}
              aria-hidden="true"
            />

            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}