import Link from "next/link";
import styles from "./Header.module.css";

type HeaderProps = {
  variant?: "marketing" | "app";
};

export default function Header({ variant = "marketing" }: HeaderProps) {
  if (variant === "app") {
    return (
      <header className={styles.nav}>
        <div className={`wrap ${styles.inner}`}>
          <Link href="/" className={styles.logo}>
            Closetly
          </Link>
          <div className={styles.appRight}>
            <Link href="/" className={styles.loginLink}>
              Back to site
            </Link>
            <div className={styles.avatar} aria-hidden="true">
              A
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.nav}>
      <div className={`wrap ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          Closetly
        </Link>
        <nav className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#vibes">Vibes</a>
          <a href="#vision">Closet Vision</a>
          <a href="#stories">Stories</a>
        </nav>
        <Link href="/signup" className={styles.navCta}>
          Start your closet
        </Link>
      </div>
    </header>
  );
}
