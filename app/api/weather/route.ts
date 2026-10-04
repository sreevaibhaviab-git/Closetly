import { NextRequest, NextResponse } from "next/server";

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
  };
  daily?: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
  };
};

export type WeatherFashionAdvice = {
  summary: string;
  recommended: string[];
  avoid: string[];
  carry: string[];
};

export type ClosetlyWeather = {
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipitation: number;
  rain: number;
  rainProbability: number;
  weatherCode: number;
  condition: string;
  cloudCover: number;
  windSpeed: number;
  uvIndex: number;
  high: number;
  low: number;
  isDay: boolean;
  fashionAdvice: WeatherFashionAdvice;
};

const DEFAULT_LATITUDE = 12.9716;
const DEFAULT_LONGITUDE = 77.5946;
const DEFAULT_LOCATION = "Bengaluru";

export async function GET(request: NextRequest) {
  try {
    const latitude = parseCoordinate(
      request.nextUrl.searchParams.get("latitude"),
      DEFAULT_LATITUDE,
      -90,
      90
    );

    const longitude = parseCoordinate(
      request.nextUrl.searchParams.get("longitude"),
      DEFAULT_LONGITUDE,
      -180,
      180
    );

    const requestedLocation =
      request.nextUrl.searchParams.get("location")?.trim() ||
      DEFAULT_LOCATION;

    const forecastUrl = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    forecastUrl.searchParams.set("latitude", String(latitude));
    forecastUrl.searchParams.set("longitude", String(longitude));

    forecastUrl.searchParams.set(
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "precipitation",
        "rain",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m",
      ].join(",")
    );

    forecastUrl.searchParams.set(
      "hourly",
      "precipitation_probability"
    );

    forecastUrl.searchParams.set(
      "daily",
      [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_probability_max",
        "uv_index_max",
      ].join(",")
    );

    forecastUrl.searchParams.set("timezone", "auto");
    forecastUrl.searchParams.set("forecast_days", "1");

    const response = await fetch(forecastUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Weather service returned ${response.status}.`
      );
    }

    const data =
      (await response.json()) as OpenMeteoResponse;

    if (!data.current) {
      throw new Error(
        "The weather service returned incomplete data."
      );
    }

    const currentHourIndex = findClosestHourIndex(
      data.hourly?.time ?? [],
      data.current.time
    );

    const hourlyRainProbability =
      currentHourIndex >= 0
        ? data.hourly?.precipitation_probability[
            currentHourIndex
          ] ?? 0
        : 0;

    const dailyRainProbability =
      data.daily?.precipitation_probability_max?.[0] ?? 0;

    const rainProbability = Math.max(
      hourlyRainProbability,
      dailyRainProbability
    );

    const condition = getWeatherCondition(
      data.current.weather_code
    );

    const uvIndex = roundNumber(
      data.daily?.uv_index_max?.[0] ?? 0
    );

    const high = roundNumber(
      data.daily?.temperature_2m_max?.[0] ??
        data.current.temperature_2m
    );

    const low = roundNumber(
      data.daily?.temperature_2m_min?.[0] ??
        data.current.temperature_2m
    );

    const fashionAdvice = buildFashionAdvice({
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      rainProbability,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      uvIndex,
      condition,
    });

    const weather: ClosetlyWeather = {
      location: requestedLocation,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      temperature: roundNumber(
        data.current.temperature_2m
      ),
      feelsLike: roundNumber(
        data.current.apparent_temperature
      ),
      humidity: roundNumber(
        data.current.relative_humidity_2m
      ),
      precipitation: roundNumber(
        data.current.precipitation
      ),
      rain: roundNumber(data.current.rain),
      rainProbability: roundNumber(rainProbability),
      weatherCode: data.current.weather_code,
      condition,
      cloudCover: roundNumber(data.current.cloud_cover),
      windSpeed: roundNumber(data.current.wind_speed_10m),
      uvIndex,
      high,
      low,
      isDay: data.current.is_day === 1,
      fashionAdvice,
    };

    return NextResponse.json({
      success: true,
      weather,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not load the weather.",
      },
      { status: 500 }
    );
  }
}

function parseCoordinate(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (!value) {
    return fallback;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < minimum ||
    number > maximum
  ) {
    return fallback;
  }

  return number;
}

function findClosestHourIndex(
  times: string[],
  currentTime: string
) {
  if (times.length === 0) {
    return -1;
  }

  const exactIndex = times.indexOf(currentTime);

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const currentTimestamp = new Date(currentTime).getTime();

  let closestIndex = 0;
  let closestDifference = Number.POSITIVE_INFINITY;

  times.forEach((time, index) => {
    const difference = Math.abs(
      new Date(time).getTime() - currentTimestamp
    );

    if (difference < closestDifference) {
      closestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function buildFashionAdvice(input: {
  temperature: number;
  feelsLike: number;
  humidity: number;
  rainProbability: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
}): WeatherFashionAdvice {
  const recommended = new Set<string>();
  const avoid = new Set<string>();
  const carry = new Set<string>();

  const effectiveTemperature = Math.max(
    input.temperature,
    input.feelsLike
  );

  let summary =
    "Comfortable conditions for flexible everyday styling.";

  if (effectiveTemperature >= 32) {
    summary =
      "Hot conditions call for light, breathable and relaxed clothing.";

    recommended.add("Cotton");
    recommended.add("Linen");
    recommended.add("Relaxed silhouettes");
    recommended.add("Open or breathable shoes");

    avoid.add("Heavy jackets");
    avoid.add("Thick knits");
    avoid.add("Velvet");
    avoid.add("Leather layers");
  } else if (effectiveTemperature >= 26) {
    summary =
      "Warm weather suits breathable fabrics and lighter layers.";

    recommended.add("Cotton");
    recommended.add("Linen");
    recommended.add("Lightweight separates");

    avoid.add("Heavy wool");
    avoid.add("Bulky outerwear");
  } else if (effectiveTemperature >= 20) {
    summary =
      "Mild weather is ideal for light layers and versatile outfits.";

    recommended.add("Light layers");
    recommended.add("Denim");
    recommended.add("Breathable tops");
  } else if (effectiveTemperature >= 14) {
    summary =
      "Cool conditions suit comfortable layering and closed shoes.";

    recommended.add("Cardigan");
    recommended.add("Light jacket");
    recommended.add("Closed shoes");

    avoid.add("Very light summer-only pieces");
  } else {
    summary =
      "Cold conditions require warm layers and protective outerwear.";

    recommended.add("Warm knitwear");
    recommended.add("Coat or insulated jacket");
    recommended.add("Closed shoes or boots");
    recommended.add("Layered clothing");

    avoid.add("Thin single-layer outfits");
    avoid.add("Open sandals");
  }

  if (input.humidity >= 75) {
    recommended.add("Moisture-friendly fabrics");
    recommended.add("Loose fits");

    avoid.add("Tight synthetic layers");
    avoid.add("Heavy non-breathable fabrics");
  }

  if (
    input.rainProbability >= 45 ||
    input.precipitation > 0
  ) {
    summary =
      "Rain is possible, so keep the outfit practical and weather-ready.";

    recommended.add("Quick-drying pieces");
    recommended.add("Water-resistant footwear");

    carry.add("Umbrella");
    carry.add("Light rain layer");

    avoid.add("Delicate suede");
    avoid.add("Floor-length hems");
  }

  if (input.windSpeed >= 25) {
    recommended.add("Secure layers");

    carry.add("Light windproof layer");

    avoid.add("Very loose scarves");
    avoid.add("Unsecured lightweight hats");
  }

  if (input.uvIndex >= 6) {
    carry.add("Sunglasses");
    carry.add("Sun protection");
  }

  return {
    summary,
    recommended: Array.from(recommended),
    avoid: Array.from(avoid),
    carry: Array.from(carry),
  };
}

function getWeatherCondition(code: number) {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail",
  };

  return conditions[code] ?? "Mixed conditions";
}

function roundNumber(value: number) {
  return Math.round(value * 10) / 10;
}