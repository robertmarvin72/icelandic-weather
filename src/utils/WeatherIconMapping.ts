import type { WeatherIconId } from "../components/WeatherIcon";

export function mapWeatherCodeToIconId(
  code: number,
  isDay: boolean
): WeatherIconId {
  // Clear sky
  if (code === 0) {
    return isDay ? "clear-day" : "clear-night";
  }

  // Mainly clear / partly cloudy
  if (code === 1 || code === 2) {
    return isDay ? "partly-cloudy-day" : "partly-cloudy-night";
  }

  // Overcast
  if (code === 3) {
    return "cloudy";
  }

  // Fog
  if (code === 45 || code === 48) {
    return "fog";
  }

  // Drizzle, light/medium rain, showers
  if (
    (code >= 51 && code <= 55) || // drizzle
    code === 61 ||
    code === 63 || // light/moderate rain
    code === 80 ||
    code === 81 // rain showers
  ) {
    return "rain";
  }

  // Heavy rain
  if (code === 65 || code === 82) {
    return "heavy-rain";
  }

  // Freezing drizzle / freezing rain → sleet
  if (
    code === 56 ||
    code === 57 || // freezing drizzle
    code === 66 ||
    code === 67 // freezing rain
  ) {
    return "sleet";
  }

  // Snow
  if (
    (code >= 71 && code <= 77) || // snow, snow grains
    code === 85 ||
    code === 86 // snow showers
  ) {
    return "snow";
  }

  // Thunderstorms
  if (code === 95) {
    return "thunderstorm";
  }

  // Thunderstorm with hail
  if (code === 96 || code === 99) {
    return "hail";
  }

  // Fallback
  return "cloudy";
}
