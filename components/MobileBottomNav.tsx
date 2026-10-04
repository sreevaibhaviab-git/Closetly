"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./MobileBottomNav.module.css";

const NAV_ITEMS = [
  {
    href: "/app",
    label: "Home",
  },
  {
    href: "/app/closet",
    label: "Closet",
  },
  {
    href: "/app/style",
    label: "Style",
  },
  {
    href: "/app/calendar",
    label: "Calendar",
  },
  {
    href: "/app/packing",
    label: "Pack",
  },
  {
    href: "/app/profile/avatar",
    label: "Avatar",
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={styles.nav}
      aria-label="Dashboard navigation"
      style={{
        overflowX: "auto",
        justifyContent:
          "flex-start",
      }}
    >
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
            className={`${styles.item} ${
              isActive
                ? styles.itemActive
                : ""
            }`}
            style={{
              minWidth: "72px",
              flex: "0 0 auto",
            }}
          >
            <span
              className={styles.dot}
              aria-hidden="true"
            />

            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}