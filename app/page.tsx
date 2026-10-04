"use client";

import { useEffect, useRef } from "react";
import Header from "@/components/Header";
import PrimaryButton from "@/components/PrimaryButton";
import styles from "./page.module.css";

const moods = [
  "Quiet luxury",
  "Clean girl",
  "Parisian",
  "Old money",
  "Model off duty",
  "Soft tailoring",
  "Business chic",
  "Vacation",
];

const testimonials = [
  {
    quote:
      "Closetly made me realise I already owned the wardrobe I kept trying to shop for.",
    name: "Priya",
    role: "Bengaluru",
  },
  {
    quote:
      "My mornings are calmer now. I open the app and the outfit is already there.",
    name: "Maya",
    role: "College senior",
  },
  {
    quote:
      "It understands my style without suggesting clothes I do not actually own.",
    name: "Aria",
    role: "Marketing lead",
  },
];

export default function LandingPage() {
  const heroVisualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(
      `.${styles.reveal}`
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const visual = heroVisualRef.current;

    if (!visual) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = visual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      visual.style.setProperty("--pointer-x", `${x}`);
      visual.style.setProperty("--pointer-y", `${y}`);
    };

    const resetPointer = () => {
      visual.style.setProperty("--pointer-x", "0");
      visual.style.setProperty("--pointer-y", "0");
    };

    visual.addEventListener("pointermove", handlePointerMove);
    visual.addEventListener("pointerleave", resetPointer);

    return () => {
      visual.removeEventListener("pointermove", handlePointerMove);
      visual.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.ambientBackground} aria-hidden="true">
        <div className={styles.ambientOne} />
        <div className={styles.ambientTwo} />
        <div className={styles.ambientThree} />
      </div>

      <Header variant="marketing" />

      <section className={styles.hero}>
        <div className={`wrap ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Your wardrobe, intelligently styled</span>

            <h1>
              The quiet luxury
              <br />
              of knowing exactly
              <br />
              <em>what to wear.</em>
            </h1>

            <p className={styles.heroLead}>
              Closetly turns the clothes you already own into thoughtful,
              personal outfits for every morning, mood and moment.
            </p>

            <div className={styles.heroActions}>
              <PrimaryButton href="/signup">Start your closet</PrimaryButton>

              <a href="#experience" className={styles.textLink}>
                Explore the experience
                <span aria-hidden="true">↘</span>
              </a>
            </div>

            <div className={styles.heroNote}>
              <span className={styles.noteLine} />
              No invented clothing. Every outfit comes from your real wardrobe.
            </div>
          </div>

          <div
            className={styles.heroVisual}
            ref={heroVisualRef}
            aria-label="Closetly wardrobe styling preview"
          >
            <div className={styles.heroHalo} />

            <div className={`${styles.floatingCard} ${styles.weatherCard}`}>
              <span className={styles.cardLabel}>Today</span>
              <strong>24° · Soft sunlight</strong>
              <small>Light layers suggested</small>
            </div>

            <div className={`${styles.floatingCard} ${styles.outfitCard}`}>
              <div className={styles.outfitTop}>
                <span>Today’s edit</span>
                <span>01 / 03</span>
              </div>

              <div className={styles.outfitComposition}>
                <div className={styles.blazer}>
                  <span className={styles.blazerCollarLeft} />
                  <span className={styles.blazerCollarRight} />
                  <span className={styles.blazerButton} />
                </div>

                <div className={styles.silkTop}>
                  <span className={styles.silkNeck} />
                </div>

                <div className={styles.trouser}>
                  <span className={styles.trouserLine} />
                </div>

                <div className={styles.bag}>
                  <span className={styles.bagHandle} />
                  <span className={styles.bagClasp} />
                </div>

                <div className={styles.shoe}>
                  <span className={styles.shoeHeel} />
                </div>
              </div>

              <div className={styles.outfitFooter}>
                <div>
                  <span className={styles.cardLabel}>Quiet tailoring</span>
                  <strong>Monday in the city</strong>
                </div>
                <button type="button" aria-label="Save outfit">
                  ♡
                </button>
              </div>
            </div>

            <div className={`${styles.floatingCard} ${styles.matchCard}`}>
              <span className={styles.matchScore}>96%</span>
              <div>
                <span className={styles.cardLabel}>Style match</span>
                <strong>Feels like you</strong>
              </div>
            </div>

            <div className={styles.fabricOrb}>
              <span />
            </div>

            <div className={styles.sparkleOne}>✦</div>
            <div className={styles.sparkleTwo}>✦</div>
          </div>
        </div>

        <div className={`wrap ${styles.heroFooter}`}>
          <span>Built around your wardrobe</span>
          <span>Styled for real life</span>
          <span>Made more personal over time</span>
        </div>
      </section>

      <section className={styles.proofSection}>
        <div className={`wrap ${styles.proofGrid}`}>
          <div className={`${styles.proofIntro} ${styles.reveal}`}>
            <span className={styles.eyebrow}>A more intentional closet</span>
            <h2>
              Wear more.
              <br />
              Buy less.
              <br />
              Feel like yourself.
            </h2>
          </div>

          <div className={`${styles.proofStats} ${styles.reveal}`}>
            <article>
              <strong>40k+</strong>
              <span>wardrobes organised</span>
            </article>

            <article>
              <strong>1.2m</strong>
              <span>personal outfits created</span>
            </article>

            <article>
              <strong>4.9</strong>
              <span>average member rating</span>
            </article>
          </div>
        </div>
      </section>

      <section id="experience" className={styles.experienceSection}>
        <div className={`wrap ${styles.sectionHeading}`}>
          <div className={styles.reveal}>
            <span className={styles.eyebrow}>The Closetly experience</span>
            <h2>Your wardrobe becomes easier to understand.</h2>
          </div>

          <p className={styles.reveal}>
            Closetly quietly organises what you own, notices what you reach for
            and prepares outfits that make sense for your day.
          </p>
        </div>

        <div className={`wrap ${styles.experienceGrid}`}>
          <article className={`${styles.featureLarge} ${styles.reveal}`}>
            <div className={styles.featureText}>
              <span className={styles.featureNumber}>01</span>
              <h3>See your wardrobe as one considered collection.</h3>
              <p>
                Add pieces individually or photograph your closet. Closetly
                organises colour, category, season and style without turning
                wardrobe management into work.
              </p>
            </div>

            <div className={styles.wardrobePreview}>
              <div className={styles.wardrobeHeader}>
                <span>Your wardrobe</span>
                <span>128 pieces</span>
              </div>

              <div className={styles.wardrobeRail}>
                <div className={styles.railItemOne} />
                <div className={styles.railItemTwo} />
                <div className={styles.railItemThree} />
                <div className={styles.railItemFour} />
              </div>

              <div className={styles.wardrobeFilters}>
                <span>All pieces</span>
                <span>Most worn</span>
                <span>Recently added</span>
              </div>
            </div>
          </article>

          <article className={`${styles.featureSmall} ${styles.reveal}`}>
            <span className={styles.featureNumber}>02</span>

            <div className={styles.miniCalendar}>
              <span>MON</span>
              <strong>19</strong>
              <small>Client meeting</small>
            </div>

            <h3>Dress for the day ahead.</h3>
            <p>
              Weather, plans, dress code and personal preferences come together
              in one relevant recommendation.
            </p>
          </article>

          <article className={`${styles.featureSmall} ${styles.reveal}`}>
            <span className={styles.featureNumber}>03</span>

            <div className={styles.preferenceMeter}>
              <div>
                <span>Tailored</span>
                <span>Relaxed</span>
              </div>
              <div className={styles.meterTrack}>
                <span />
              </div>
            </div>

            <h3>Refine the mood, not the whole outfit.</h3>
            <p>
              Ask for something softer, sharper or more effortless and Closetly
              adjusts using pieces you already own.
            </p>
          </article>
        </div>
      </section>

      <section id="vibes" className={styles.moodSection}>
        <div className={`wrap ${styles.moodInner}`}>
          <div className={`${styles.moodCopy} ${styles.reveal}`}>
            <span className={styles.eyebrow}>Style, without the labels</span>
            <h2>One wardrobe. Many versions of you.</h2>
            <p>
              Your clothes do not belong to one aesthetic. Closetly helps you
              reinterpret them for the person you feel like being today.
            </p>
          </div>

          <div className={`${styles.moodCloud} ${styles.reveal}`}>
            {moods.map((mood, index) => (
              <span
                key={mood}
                className={styles.moodChip}
                style={{ ["--chip-index" as string]: index }}
              >
                {mood}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="vision" className={styles.visionSection}>
        <div className={`wrap ${styles.visionGrid}`}>
          <div className={`${styles.visionVisual} ${styles.reveal}`}>
            <div className={styles.visionGlow} />

            <div className={styles.phone}>
              <div className={styles.phoneTop}>
                <span>9:41</span>
                <span>Closet Vision</span>
                <span>•••</span>
              </div>

              <div className={styles.cameraView}>
                <div className={styles.scanCornerOne} />
                <div className={styles.scanCornerTwo} />
                <div className={styles.scanCornerThree} />
                <div className={styles.scanCornerFour} />

                <div className={styles.cameraGarmentOne} />
                <div className={styles.cameraGarmentTwo} />
                <div className={styles.cameraGarmentThree} />

                <div className={styles.scanBeam} />
              </div>

              <div className={styles.phoneBottom}>
                <span>12 pieces recognised</span>
                <button type="button">Review wardrobe</button>
              </div>
            </div>

            <div className={styles.visionTagOne}>Silk · Ivory</div>
            <div className={styles.visionTagTwo}>Tailored · Espresso</div>
          </div>

          <div className={`${styles.visionCopy} ${styles.reveal}`}>
            <span className={styles.eyebrow}>Closet Vision™</span>
            <h2>Photograph your closet. We will understand the rest.</h2>
            <p>
              Closet Vision recognises your clothing, colours and categories
              from a single image, helping you build a digital wardrobe without
              manually entering every detail.
            </p>

            <div className={styles.visionList}>
              <div>
                <span>01</span>
                <p>Automatic clothing recognition and categorisation.</p>
              </div>
              <div>
                <span>02</span>
                <p>Review every item before it is added.</p>
              </div>
              <div>
                <span>03</span>
                <p>Your wardrobe stays private and personal to you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stories" className={styles.storiesSection}>
        <div className={`wrap ${styles.storiesHeading}`}>
          <div className={styles.reveal}>
            <span className={styles.eyebrow}>From real wardrobes</span>
            <h2>A better relationship with getting dressed.</h2>
          </div>

          <p className={styles.reveal}>
            Less decision fatigue. Fewer unnecessary purchases. More confidence
            in the clothes already waiting in your closet.
          </p>
        </div>

        <div className={`wrap ${styles.testimonialGrid}`}>
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className={`${styles.testimonial} ${styles.reveal}`}
              style={{ ["--testimonial-index" as string]: index }}
            >
              <span className={styles.quoteMark}>“</span>
              <p>{testimonial.quote}</p>
              <div>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalSection}>
        <div className={`wrap ${styles.finalCard}`}>
          <div className={styles.finalGlowOne} />
          <div className={styles.finalGlowTwo} />

          <div className={`${styles.finalContent} ${styles.reveal}`}>
            <span className={styles.finalEyebrow}>
              Your wardrobe is already enough
            </span>

            <h2>
              The outfit is in there.
              <br />
              Closetly finds it.
            </h2>

            <p>
              Build your digital wardrobe and make getting dressed the easiest
              part of your morning.
            </p>

            <PrimaryButton href="/signup">
              Start your closet — free
            </PrimaryButton>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`wrap ${styles.footerInner}`}>
          <div>
            <strong>Closetly</strong>
            <span>Your wardrobe, considered.</span>
          </div>

          <div className={styles.footerLinks}>
            <a href="#experience">Experience</a>
            <a href="#vision">Closet Vision</a>
            <a href="#stories">Stories</a>
          </div>

          <span>© 2026 Closetly</span>
        </div>
      </footer>
    </main>
  );
}