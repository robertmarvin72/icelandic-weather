import React from "react";
import {
  IconClearDay,
  IconClearNight,
  IconPartlyCloudyDay,
  IconPartlyCloudyNight,
  IconCloudy,
  IconRain,
  IconHeavyRain,
  IconSnow,
  IconSleet,
  IconFog,
  IconThunderstorm,
  IconWind,
  IconHail,
} from "./icons/weather";

export type WeatherIconId =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "fog"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "sleet"
  | "wind"
  | "thunderstorm"
  | "hail";

type Props = {
  iconId: WeatherIconId;
  className?: string;
} & React.SVGProps<SVGSVGElement>;

const ICONS: Record<WeatherIconId, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "clear-day": IconClearDay,
  "clear-night": IconClearNight,
  "partly-cloudy-day": IconPartlyCloudyDay,
  "partly-cloudy-night": IconPartlyCloudyNight,
  cloudy: IconCloudy,
  fog: IconFog,
  rain: IconRain,
  "heavy-rain": IconHeavyRain,
  snow: IconSnow,
  sleet: IconSleet,
  wind: IconWind,
  thunderstorm: IconThunderstorm,
  hail: IconHail,
};

export function WeatherIcon({ iconId, className, ...props }: Props) {
  const Icon = ICONS[iconId] ?? IconCloudy;
  return <Icon className={className} {...props} />;
}
