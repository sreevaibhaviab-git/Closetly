"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./LuxuryHero.module.css";

export default function LuxuryHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateScrollProgress = () => {
      if (!heroRef.current) return;

      const hero = heroRef.current;
      const rect = hero.getBoundingClientRect();
      const heroHeight = hero.offsetHeight;

      const travelled = Math.min(
        Math.max(-rect.top, 0),
        Math.max(heroHeight - window.innerHeight, 1)
      );

      const progress = travelled / Math.max(heroHeight - window.innerHeight, 1);

      setScrollProgress(Math.min(Math.max(progress, 0), 1));
    };

    updateScrollProgress();

    window.addEventListener("scroll", updateScrollProgress, {
      passive: true,
    });

    window.addEventListener("resize", updateScrollProgress);

    return () => {
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
    };
  }, []);

  const modelRotation = -12 + scrollProgress * 34;
  const modelTranslateY = scrollProgress * 80;
  const modelScale = 1 + scrollProgress * 0.08;

  const headlineTranslateY = scrollProgress * -100;
  const headlineOpacity = Math.max(1 - scrollProgress * 1.6, 0);

  return (
    <section ref={heroRef} className={styles.hero}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Closetly home">
            <span className={styles.brandMark}>C</span>

            <span className={styles.brandName}>Closetly</span>

            <span className={styles.brandEdition}>
              Personal wardrobe intelligence
            </span>
          </Link>

          <nav
            className={`${styles.navigation} ${
              menuOpen ? styles.navigationOpen : ""
            }`}
            aria-label="Primary navigation"
          >
            <a href="#experience">Experience</a>
            <a href="#vibes">Vibes</a>
            <a href="#closet-vision">Closet Vision</a>
            <a href="#stories">Stories</a>
          </nav>

          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginLink}>
              Sign in
            </Link>

            <Link href="/signup" className={styles.headerCta}>
              Enter your closet
              <span aria-hidden="true">↗</span>
            </Link>

            <button
              type="button"
              className={`${styles.menuButton} ${
                menuOpen ? styles.menuButtonOpen : ""
              }`}
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.stickyStage}>
        <div className={styles.backgroundWord} aria-hidden="true">
          CLOSETLY
        </div>

        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.lightWash} aria-hidden="true" />

        <div
          className={styles.heroCopy}
          style={{
            transform: `translate3d(0, ${headlineTranslateY}px, 0)`,
            opacity: headlineOpacity,
          }}
        >
          <div className={styles.eyebrow}>
            <span>01</span>
            <p>Your wardrobe, reimagined</p>
          </div>

          <h1>
            Dress like
            <span>you already knew.</span>
          </h1>

          <p className={styles.description}>
            Closetly turns your real wardrobe into a living personal style
            system—built around your body, mood, weather and life.
          </p>

          <div className={styles.heroActions}>
            <Link href="/signup" className={styles.primaryCta}>
              <span>Build my wardrobe</span>
              <span className={styles.ctaArrow} aria-hidden="true">
                ↗
              </span>
            </Link>

            <a href="#experience" className={styles.scrollLink}>
              <span className={styles.scrollLine} />
              Explore the experience
            </a>
          </div>
        </div>

        <div className={styles.modelScene}>
          <div
            className={styles.modelFrame}
            style={{
              transform: `
                translate3d(-50%, ${modelTranslateY}px, 0)
                rotateY(${modelRotation}deg)
                scale(${modelScale})
              `,
            }}
          >
            <div className={styles.modelGlow} />

            <img
              src="/images/closetly-editorial-model.png"
              alt="Editorial fashion model wearing a luxury neutral outfit"
              className={styles.modelImage}
            />

            <div className={styles.modelReflection} />
          </div>
        </div>

        <div
          className={`${styles.floatingCard} ${styles.weatherCard}`}
          style={{
            transform: `
              translate3d(
                ${scrollProgress * -90}px,
                ${scrollProgress * 45}px,
                0
              )
              rotate(${scrollProgress * -5 - 4}deg)
            `,
          }}
        >
          <span className={styles.cardIndex}>01</span>

          <div>
            <small>Today</small>
            <strong>24° · Soft sunlight</strong>
            <p>Light tailoring suggested</p>
          </div>
        </div>

        <div
          className={`${styles.floatingCard} ${styles.matchCard}`}
          style={{
            transform: `
              translate3d(
                ${scrollProgress * 105}px,
                ${scrollProgress * -45}px,
                0
              )
              rotate(${scrollProgress * 6 + 3}deg)
            `,
          }}
        >
          <div className={styles.matchCircle}>
            <span>96</span>
            <small>%</small>
          </div>

          <div>
            <small>Style match</small>
            <strong>Feels like you</strong>
          </div>
        </div>

        <div
          className={`${styles.floatingCard} ${styles.wardrobeCard}`}
          style={{
            transform: `
              translate3d(
                ${scrollProgress * -50}px,
                ${scrollProgress * -100}px,
                0
              )
              rotate(${scrollProgress * -4 + 2}deg)
            `,
          }}
        >
          <span className={styles.wardrobeDot} />

          <div>
            <small>Your wardrobe</small>
            <strong>48 pieces connected</strong>
          </div>

          <span className={styles.wardrobeArrow}>↗</span>
        </div>

        <div className={styles.verticalLabel}>
          <span>Scroll to style</span>
          <span className={styles.verticalLine} />
        </div>

        <div className={styles.heroFooter}>
          <span>Real clothing only</span>
          <span>Personal over time</span>
          <span>Designed for real life</span>
        </div>
      </div>
    </section>
  );
}