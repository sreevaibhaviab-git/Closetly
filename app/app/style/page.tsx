"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Brain,
  Heart,
  MapPin,
  Save,
  Sparkles,
  ThumbsDown,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SectionCard from "@/components/SectionCard";
import Select from "@/components/Select";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import EmptyState from "@/components/EmptyState";
import WeatherCard from "@/components/WeatherCard";
import TryOnButton from "@/components/TryOnButton";
import type { ClosetlyWeather } from "@/app/api/weather/route";
import {
  getWardrobeItems,
  type WardrobeItem,
} from "@/lib/supabase/wardrobe";
import {
  getRecentOutfitFeedback,
  saveOutfit,
  saveOutfitFeedback,
  type OutfitRating,
} from "@/lib/supabase/outfits";
import {
  getStylePreferences,
  type StylePreferences,
} from "@/lib/supabase/stylist";
import styles from "./page.module.css";

const OCCASIONS = [
  "Coffee date",
  "First date",
  "Girls night",
  "College",
  "Office",
  "Interview",
  "Wedding",
  "Birthday",
  "Dinner",
  "Vacation",
  "Shopping",
  "Casual",
];

const VIBES = [
  "Clean girl",
  "Old money",
  "Coquette",
  "Quiet luxury",
  "Parisian",
  "Model off duty",
  "Minimalist",
  "Business chic",
  "Soft girl",
  "Elegant",
];

const TIMES = [
  "Morning",
  "Afternoon",
  "Evening",
  "Late night",
];

const FORMALITY = [
  "Very casual",
  "Casual",
  "Smart casual",
  "Dressy",
  "Formal",
];

const BENGALURU_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
  name: "Bengaluru",
};

type GeneratedOutfit = {
  title: string;
  item_ids: string[];
  reason: string;
  styling_tip: string;
  confidence: number;
  preferences_applied?: string[];
};

type OutfitResponse = {
  success: boolean;
  outfit?: GeneratedOutfit;
  message?: string;
};

type WeatherResponse = {
  success: boolean;
  weather?: ClosetlyWeather;
  message?: string;
};

export default function StyleMePage() {
  const [occasion, setOccasion] =
    useState(OCCASIONS[0]);

  const [description, setDescription] =
    useState("");

  const [vibe, setVibe] =
    useState(VIBES[0]);

  const [timeOfDay, setTimeOfDay] =
    useState(TIMES[0]);

  const [formality, setFormality] =
    useState(FORMALITY[1]);

  const [wardrobe, setWardrobe] =
    useState<WardrobeItem[]>([]);

  const [preferences, setPreferences] =
    useState<StylePreferences | null>(null);

  const [outfit, setOutfit] =
    useState<GeneratedOutfit | null>(null);

  const [weather, setWeather] =
    useState<ClosetlyWeather | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  const [weatherError, setWeatherError] =
    useState("");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isRating, setIsRating] =
    useState(false);

  const [savedOutfitId, setSavedOutfitId] =
    useState<string | null>(null);

  const [rating, setRating] =
    useState<OutfitRating | null>(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    void loadWeather();
  }, []);

  const selectedItems = useMemo(() => {
    if (!outfit) return [];

    return outfit.item_ids
      .map((itemId) =>
        wardrobe.find(
          (item) => item.id === itemId
        )
      )
      .filter(
        (item): item is WardrobeItem =>
          item !== undefined
      );
  }, [outfit, wardrobe]);

  const visibleMemory = useMemo(() => {
    if (!preferences) return [];

    return [
      ...preferences.preferred_styles.map(
        (item) => `Prefer ${item}`
      ),
      ...preferences.preferred_colors.map(
        (item) => `Prefer ${item}`
      ),
      ...preferences.preferred_items.map(
        (item) => `Prefer ${item}`
      ),
      ...preferences.avoid_colors.map(
        (item) => `Avoid ${item}`
      ),
      ...preferences.avoid_items.map(
        (item) => `Avoid ${item}`
      ),
      ...preferences.temporary_avoidances.map(
        (item) =>
          `Pause ${item.term} until ${formatDate(
            item.until
          )}`
      ),
    ].slice(0, 8);
  }, [preferences]);

  const weatherFactors = useMemo(() => {
    if (!weather) return [];

    const factors = [
      `${Math.round(
        weather.temperature
      )}°C ${weather.condition.toLowerCase()}`,
      `Feels like ${Math.round(
        weather.feelsLike
      )}°C`,
      `${Math.round(
        weather.humidity
      )}% humidity`,
    ];

    if (
      weather.rainProbability >= 40
    ) {
      factors.push(
        `${Math.round(
          weather.rainProbability
        )}% rain chance`
      );
    }

    if (weather.windSpeed >= 20) {
      factors.push(
        `${Math.round(
          weather.windSpeed
        )} km/h wind`
      );
    }

    return factors;
  }, [weather]);

  async function loadWeather() {
    setWeatherLoading(true);
    setWeatherError("");

    try {
      const location =
        await getBrowserLocation();

      await fetchWeather(
        location.latitude,
        location.longitude,
        location.name
      );
    } catch {
      try {
        await fetchWeather(
          BENGALURU_LOCATION.latitude,
          BENGALURU_LOCATION.longitude,
          BENGALURU_LOCATION.name
        );
      } catch (error) {
        setWeather(null);
        setWeatherError(
          error instanceof Error
            ? error.message
            : "Could not load the weather."
        );
      }
    } finally {
      setWeatherLoading(false);
    }
  }

  async function fetchWeather(
    latitude: number,
    longitude: number,
    locationName: string
  ) {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      location: locationName,
    });

    const response = await fetch(
      `/api/weather?${query.toString()}`,
      {
        cache: "no-store",
      }
    );

    const data =
      (await response.json()) as WeatherResponse;

    if (
      !response.ok ||
      !data.success ||
      !data.weather
    ) {
      throw new Error(
        data.message ||
          "Could not load the weather."
      );
    }

    setWeather(data.weather);
  }

  async function handleGenerate(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (isGenerating) return;

    try {
      setIsGenerating(true);

      setMessage(
        weather
          ? "Opening your closet, weather and style memory..."
          : "Opening your closet and style memory..."
      );

      setOutfit(null);
      setSavedOutfitId(null);
      setRating(null);

      const [
        wardrobeItems,
        storedPreferences,
        feedback,
      ] = await Promise.all([
        getWardrobeItems(),
        getStylePreferences(),
        getRecentOutfitFeedback(),
      ]);

      setPreferences(storedPreferences);

      const preferenceFilteredItems =
        filterUnavailableItems(
          wardrobeItems,
          storedPreferences
        );

      const availableItems =
        filterWeatherUnsuitableItems(
          preferenceFilteredItems,
          weather
        );

      if (availableItems.length === 0) {
        throw new Error(
          "No suitable wardrobe items remain after applying laundry, saved preferences and weather restrictions."
        );
      }

      setWardrobe(availableItems);

      setMessage(
        "Closetly is creating your weather-aware personalised look..."
      );

      const response = await fetch(
        "/api/outfit",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            occasion,
            vibe,
            timeOfDay,
            formality,
            description,

            weather: weather
              ? {
                  location:
                    weather.location,
                  temperature:
                    weather.temperature,
                  feelsLike:
                    weather.feelsLike,
                  humidity:
                    weather.humidity,
                  rainProbability:
                    weather.rainProbability,
                  precipitation:
                    weather.precipitation,
                  condition:
                    weather.condition,
                  windSpeed:
                    weather.windSpeed,
                  uvIndex:
                    weather.uvIndex,
                  high: weather.high,
                  low: weather.low,
                  fashionAdvice:
                    weather.fashionAdvice,
                }
              : null,

            wardrobe:
              availableItems.map(
                (item) => ({
                  id: item.id,
                  name: item.name,
                  category:
                    item.category,
                  color: item.color,
                  image_url:
                    item.image_url,
                  is_favorite:
                    item.is_favorite,
                  is_in_laundry:
                    item.is_in_laundry,
                })
              ),

            preferences:
              storedPreferences,

            feedback:
              feedback.map((item) => ({
                outfit_title:
                  item.outfit_title,
                item_ids:
                  item.item_ids,
                rating: item.rating,
                context: item.context,
                created_at:
                  item.created_at,
              })),
          }),
        }
      );

      const data =
        (await response.json()) as OutfitResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.outfit
      ) {
        throw new Error(
          data.message ||
            "Closetly could not create an outfit."
        );
      }

      setOutfit(data.outfit);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your outfit."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveOutfit() {
    if (
      !outfit ||
      selectedItems.length === 0 ||
      isSaving ||
      savedOutfitId
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setMessage("Saving this look...");

      const weatherDescription =
        weather
          ? `Weather: ${weather.temperature}°C, ${weather.condition}, ${weather.humidity}% humidity.`
          : "";

      const saved = await saveOutfit({
        title: outfit.title,
        occasion,
        vibe,
        timeOfDay,
        formality,
        description: [
          description.trim(),
          weatherDescription,
        ]
          .filter(Boolean)
          .join(" "),
        itemIds: outfit.item_ids,
        items: selectedItems.map(
          (item) => ({
            id: item.id,
            name: item.name,
            category:
              item.category,
            color: item.color,
            image_url:
              item.image_url,
          })
        ),
        reason: outfit.reason,
        stylingTip:
          outfit.styling_tip,
        confidence:
          outfit.confidence,
      });

      setSavedOutfitId(saved.id);

      setMessage(
        "Outfit saved to your lookbook."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save this outfit."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRating(
    nextRating: OutfitRating
  ) {
    if (
      !outfit ||
      isRating ||
      rating
    ) {
      return;
    }

    try {
      setIsRating(true);

      await saveOutfitFeedback({
        outfitTitle:
          outfit.title,
        itemIds: outfit.item_ids,
        rating: nextRating,
        occasion,
        vibe,
        timeOfDay,
        formality,
        description: [
          description.trim(),
          weather
            ? `${weather.temperature}°C ${weather.condition}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });

      setRating(nextRating);

      setMessage(
        nextRating === "love"
          ? "Closetly saved this as a look you love."
          : "Closetly will use this feedback to avoid similar combinations."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your feedback."
      );
    } finally {
      setIsRating(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Get dressed"
        title="Style me"
        subtitle="Weather, wardrobe, style memory and ratings now work together."
      />

      <div style={weatherSectionStyle}>
        <div style={weatherSectionHeadingStyle}>
          <div>
            <p style={sectionEyebrowStyle}>
              Live conditions
            </p>

            <h2 style={weatherHeadingStyle}>
              Weather-aware styling
            </h2>
          </div>

          <div style={locationNoticeStyle}>
            <MapPin size={14} />

            <span>
              Uses your location with a
              Bengaluru fallback
            </span>
          </div>
        </div>

        <WeatherCard
          weather={weather}
          isLoading={weatherLoading}
          errorMessage={weatherError}
          onRefresh={() => {
            void loadWeather();
          }}
        />
      </div>

      <div style={{ marginTop: "24px" }}>
        <SectionCard>
          <form onSubmit={handleGenerate}>
            <div className={styles.form}>
              <Select
                id="occasion"
                label="Occasion"
                options={OCCASIONS}
                value={occasion}
                onChange={(event) =>
                  setOccasion(
                    event.target.value
                  )
                }
              />

              <Select
                id="vibe"
                label="Vibe"
                options={VIBES}
                value={vibe}
                onChange={(event) =>
                  setVibe(
                    event.target.value
                  )
                }
              />

              <Select
                id="timeOfDay"
                label="Time of day"
                options={TIMES}
                value={timeOfDay}
                onChange={(event) =>
                  setTimeOfDay(
                    event.target.value
                  )
                }
              />

              <Select
                id="formality"
                label="Formality"
                options={FORMALITY}
                value={formality}
                onChange={(event) =>
                  setFormality(
                    event.target.value
                  )
                }
              />

              <div
                className={styles.fullRow}
              >
                <label
                  htmlFor="description"
                  className={styles.label}
                >
                  Describe the moment
                </label>

                <textarea
                  id="description"
                  placeholder="e.g. Evening coffee date. I want to look confident but not overdressed."
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  className={
                    styles.textarea
                  }
                />
              </div>
            </div>

            <div
              className={styles.actions}
            >
              <PrimaryButton type="submit">
                {isGenerating
                  ? "Checking weather and styling..."
                  : outfit
                    ? "Generate another"
                    : "Generate outfit"}
              </PrimaryButton>
            </div>
          </form>
        </SectionCard>
      </div>

      {visibleMemory.length > 0 && (
        <div style={memoryCardStyle}>
          <div style={memoryTitleRowStyle}>
            <Brain size={17} />

            <p style={{ fontWeight: 700 }}>
              Style memory active
            </p>
          </div>

          <div style={memoryTagsStyle}>
            {visibleMemory.map((item) => (
              <span
                key={item}
                style={memoryTagStyle}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {weatherFactors.length > 0 && (
        <div style={weatherFactorsCardStyle}>
          <div style={memoryTitleRowStyle}>
            <Sparkles size={17} />

            <p style={{ fontWeight: 700 }}>
              Weather context active
            </p>
          </div>

          <div style={memoryTagsStyle}>
            {weatherFactors.map(
              (factor) => (
                <span
                  key={factor}
                  style={memoryTagStyle}
                >
                  {factor}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: "18px",
            color:
              "var(--ink-soft)",
            fontSize: "14px",
          }}
        >
          {message}
        </p>
      )}

      <div style={{ marginTop: "28px" }}>
        {outfit ? (
          <SectionCard
            title={outfit.title}
            subtitle="Personalised using your wardrobe, preferences, ratings and current weather."
          >
            {selectedItems.length >
            0 ? (
              <div style={itemGridStyle}>
                {selectedItems.map(
                  (item) => (
                    <article
                      key={item.id}
                      style={itemCardStyle}
                    >
                      <div
                        style={{
                          aspectRatio:
                            "4 / 5",
                          background:
                            "var(--cream)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.name ||
                            "Clothing item"
                          }
                          style={
                            itemImageStyle
                          }
                        />
                      </div>

                      <div
                        style={{
                          padding:
                            "14px",
                        }}
                      >
                        <p
                          style={{
                            fontWeight:
                              600,
                          }}
                        >
                          {item.name ||
                            "Untitled item"}
                        </p>

                        <p
                          style={{
                            marginTop:
                              "4px",
                            color:
                              "var(--ink-soft)",
                            fontSize:
                              "13px",
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
                  )
                )}
              </div>
            ) : (
              <p
                style={{
                  color:
                    "var(--ink-soft)",
                }}
              >
                The selected item IDs
                did not match your
                current wardrobe.
              </p>
            )}

            <div style={reasonSectionStyle}>
              <h3 style={reasonTitleStyle}>
                Why this works
              </h3>

              <p style={bodyTextStyle}>
                {outfit.reason}
              </p>

              {outfit.styling_tip && (
                <>
                  <p
                    style={{
                      fontWeight: 700,
                      marginTop:
                        "20px",
                    }}
                  >
                    Final touch
                  </p>

                  <p
                    style={{
                      ...bodyTextStyle,
                      marginTop:
                        "6px",
                    }}
                  >
                    {
                      outfit.styling_tip
                    }
                  </p>
                </>
              )}

              {outfit
                .preferences_applied &&
                outfit
                  .preferences_applied
                  .length > 0 && (
                  <div
                    style={
                      appliedPreferencesStyle
                    }
                  >
                    <div
                      style={
                        memoryTitleRowStyle
                      }
                    >
                      <Sparkles
                        size={16}
                      />

                      <p
                        style={{
                          fontWeight:
                            700,
                        }}
                      >
                        Personalisation
                        applied
                      </p>
                    </div>

                    <div
                      style={
                        memoryTagsStyle
                      }
                    >
                      {outfit.preferences_applied.map(
                        (item) => (
                          <span
                            key={item}
                            style={
                              memoryTagStyle
                            }
                          >
                            {item}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div
                className={
                  styles.resultTags
                }
              >
                <span
                  className={
                    styles.resultTag
                  }
                >
                  {occasion}
                </span>

                <span
                  className={
                    styles.resultTag
                  }
                >
                  {vibe}
                </span>

                <span
                  className={
                    styles.resultTag
                  }
                >
                  {timeOfDay}
                </span>

                <span
                  className={
                    styles.resultTag
                  }
                >
                  {formality}
                </span>

                {weather && (
                  <span
                    className={
                      styles.resultTag
                    }
                  >
                    {Math.round(
                      weather.temperature
                    )}
                    °C ·{" "}
                    {weather.condition}
                  </span>
                )}

                <span
                  className={
                    styles.resultTag
                  }
                >
                  {Math.max(
                    0,
                    Math.min(
                      100,
                      outfit.confidence
                    )
                  )}
                  % match
                </span>
              </div>

              <div style={actionRowStyle}>
                <PrimaryButton
                  type="button"
                  onClick={
                    handleSaveOutfit
                  }
                >
                  <Save size={15} />

                  {savedOutfitId
                    ? "Saved"
                    : isSaving
                      ? "Saving..."
                      : "Save outfit"}
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  onClick={() =>
                    handleRating(
                      "love"
                    )
                  }
                >
                  <Heart size={15} />

                  {rating === "love"
                    ? "Loved"
                    : "Love it"}
                </SecondaryButton>

                <SecondaryButton
                  type="button"
                  onClick={() =>
                    handleRating(
                      "not_my_style"
                    )
                  }
                >
                  <ThumbsDown
                    size={15}
                  />

                  {rating ===
                  "not_my_style"
                    ? "Noted"
                    : "Not my style"}
                </SecondaryButton>

                <TryOnButton
                  outfitTitle={outfit.title}
                  items={selectedItems.map(
                    (item) => ({
                      id: item.id,
                      name: item.name,
                      category:
                        item.category,
                      color: item.color,
                      image_url:
                        item.image_url,
                    })
                  )}
                  occasion={occasion}
                  vibe={vibe}
                  timeOfDay={timeOfDay}
                  formality={formality}
                  description={description}
                  disabled={
                    selectedItems.length === 0
                  }
                />
              </div>
            </div>
          </SectionCard>
        ) : (
          <EmptyState
            glyph="✦"
            title="No outfit generated yet"
            subtitle="Closetly will combine your wardrobe, style memory and current weather."
          />
        )}
      </div>
    </>
  );
}

function getBrowserLocation(): Promise<{
  latitude: number;
  longitude: number;
  name: string;
}> {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof navigator ===
          "undefined" ||
        !navigator.geolocation
      ) {
        reject(
          new Error(
            "Location is unavailable."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude:
              position.coords.latitude,
            longitude:
              position.coords.longitude,
            name: "Current location",
          });
        },
        () => {
          reject(
            new Error(
              "Location permission was not granted."
            )
          );
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 15 * 60 * 1000,
        }
      );
    }
  );
}

function filterUnavailableItems(
  items: WardrobeItem[],
  preferences: StylePreferences
) {
  const activeTemporary =
    preferences.temporary_avoidances
      .filter(
        (item) =>
          new Date(
            `${item.until}T23:59:59`
          ).getTime() >= Date.now()
      )
      .map((item) =>
        item.term.toLowerCase()
      );

  const avoidedTerms = [
    ...preferences.avoid_items,
    ...activeTemporary,
  ].map((item) =>
    item.toLowerCase()
  );

  const avoidedColors =
    preferences.avoid_colors.map(
      (item) => item.toLowerCase()
    );

  return items.filter((item) => {
    if (item.is_in_laundry) {
      return false;
    }

    const nameAndCategory = [
      item.name,
      item.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const itemColor =
      item.color?.toLowerCase() || "";

    const forbiddenItem =
      avoidedTerms.some((term) =>
        nameAndCategory.includes(term)
      );

    const forbiddenColor =
      avoidedColors.some(
        (color) =>
          itemColor.includes(color)
      );

    return (
      !forbiddenItem &&
      !forbiddenColor
    );
  });
}

function filterWeatherUnsuitableItems(
  items: WardrobeItem[],
  weather: ClosetlyWeather | null
) {
  if (!weather) {
    return items;
  }

  const feelsLike =
    weather.feelsLike;

  return items.filter((item) => {
    const text = [
      item.name,
      item.category,
      item.color,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (feelsLike >= 30) {
      const hotWeatherAvoid = [
        "heavy coat",
        "puffer",
        "thermal",
        "thick wool",
        "fur coat",
        "snow boot",
      ];

      if (
        hotWeatherAvoid.some((term) =>
          text.includes(term)
        )
      ) {
        return false;
      }
    }

    if (feelsLike <= 14) {
      const coldWeatherAvoid = [
        "bikini",
        "swimsuit",
        "beach cover",
      ];

      if (
        coldWeatherAvoid.some((term) =>
          text.includes(term)
        )
      ) {
        return false;
      }
    }

    if (
      weather.rainProbability >= 50
    ) {
      const rainAvoid = [
        "suede",
        "floor length",
        "floor-length",
      ];

      if (
        rainAvoid.some((term) =>
          text.includes(term)
        )
      ) {
        return false;
      }
    }

    return true;
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  ).format(
    new Date(`${date}T00:00:00`)
  );
}

const weatherSectionStyle: React.CSSProperties = {
  marginBottom: "4px",
};

const weatherSectionHeadingStyle: React.CSSProperties = {
  marginBottom: "14px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "12px",
};

const sectionEyebrowStyle: React.CSSProperties = {
  color: "var(--rose-deep)",
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const weatherHeadingStyle: React.CSSProperties = {
  marginTop: "4px",
  fontFamily: "var(--font-fraunces)",
  fontSize: "24px",
};

const locationNoticeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "var(--ink-soft)",
  fontSize: "11px",
};

const memoryCardStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "17px",
  border: "1px solid var(--line)",
  borderRadius: "17px",
  background: "var(--cream)",
};

const weatherFactorsCardStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "17px",
  border: "1px solid var(--line)",
  borderRadius: "17px",
  background: "var(--paper)",
};

const memoryTitleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "var(--rose-deep)",
};

const memoryTagsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  marginTop: "12px",
};

const memoryTagStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid var(--line)",
  borderRadius: "999px",
  background: "var(--paper)",
  color: "var(--ink-soft)",
  fontSize: "11px",
  fontWeight: 700,
};

const itemGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "16px",
};

const itemCardStyle: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid var(--line)",
  borderRadius: "18px",
  background: "var(--paper)",
};

const itemImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const reasonSectionStyle: React.CSSProperties = {
  marginTop: "26px",
  paddingTop: "22px",
  borderTop: "1px solid var(--line)",
};

const reasonTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-fraunces)",
  fontSize: "20px",
  marginBottom: "8px",
};

const bodyTextStyle: React.CSSProperties = {
  color: "var(--ink-soft)",
  lineHeight: 1.7,
};

const appliedPreferencesStyle: React.CSSProperties = {
  marginTop: "20px",
  padding: "15px",
  borderRadius: "15px",
  background: "var(--cream)",
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "24px",
};