import {
  Cloud,
  CloudRain,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  ThermometerSun,
  Umbrella,
  Wind,
} from "lucide-react";
import type {
  ClosetlyWeather,
} from "@/app/api/weather/route";
import styles from "./WeatherCard.module.css";

type WeatherCardProps = {
  weather: ClosetlyWeather | null;
  isLoading?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
};

export default function WeatherCard({
  weather,
  isLoading = false,
  errorMessage = "",
  onRefresh,
}: WeatherCardProps) {
  if (isLoading) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <RefreshCw
            size={22}
            className={styles.spinner}
          />

          <p>Checking your local weather...</p>
        </div>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className={styles.card}>
        <div className={styles.loading}>
          <Cloud size={24} />

          <p>
            {errorMessage ||
              "Weather is temporarily unavailable."}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className={styles.retryButton}
            >
              <RefreshCw size={15} />
              Try again
            </button>
          )}
        </div>
      </section>
    );
  }

  const WeatherIcon =
    weather.rainProbability >= 45 ||
    weather.precipitation > 0
      ? CloudRain
      : weather.isDay
        ? Sun
        : Cloud;

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div>
          <div className={styles.location}>
            <MapPin size={14} />
            <span>{weather.location}</span>
          </div>

          <div className={styles.temperatureRow}>
            <WeatherIcon
              size={36}
              className={styles.weatherIcon}
            />

            <div>
              <p className={styles.temperature}>
                {Math.round(weather.temperature)}°
              </p>

              <p className={styles.condition}>
                {weather.condition}
              </p>
            </div>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={styles.refreshButton}
            aria-label="Refresh weather"
            title="Refresh weather"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      <div className={styles.metrics}>
        <WeatherMetric
          icon={<ThermometerSun size={16} />}
          label="Feels like"
          value={`${Math.round(weather.feelsLike)}°`}
        />

        <WeatherMetric
          icon={<Droplets size={16} />}
          label="Humidity"
          value={`${Math.round(weather.humidity)}%`}
        />

        <WeatherMetric
          icon={<CloudRain size={16} />}
          label="Rain chance"
          value={`${Math.round(
            weather.rainProbability
          )}%`}
        />

        <WeatherMetric
          icon={<Wind size={16} />}
          label="Wind"
          value={`${Math.round(
            weather.windSpeed
          )} km/h`}
        />
      </div>

      <div className={styles.advice}>
        <p className={styles.adviceEyebrow}>
          Closetly weather advice
        </p>

        <p className={styles.summary}>
          {weather.fashionAdvice.summary}
        </p>

        <AdviceGroup
          title="Wear"
          items={weather.fashionAdvice.recommended}
        />

        <AdviceGroup
          title="Avoid"
          items={weather.fashionAdvice.avoid}
        />

        {weather.fashionAdvice.carry.length > 0 && (
          <div className={styles.carry}>
            <Umbrella size={15} />

            <p>
              Carry{" "}
              {weather.fashionAdvice.carry.join(", ")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function WeatherMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricIcon}>
        {icon}
      </div>

      <div>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricValue}>{value}</p>
      </div>
    </div>
  );
}

function AdviceGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.adviceGroup}>
      <p className={styles.adviceLabel}>{title}</p>

      <div className={styles.tags}>
        {items.map((item) => (
          <span key={item} className={styles.tag}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}