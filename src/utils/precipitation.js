export function getPrecipitationLabel(type, mm, t, opts = {}) {
  if (mm == null || mm <= 0) return null;

  const { precipStartHour = null, precipDurationHours = 0 } = opts;

  const isSnow = type === "snow";

  // Case 1: very light / short-lived precipitation
  if (mm < 1 || (precipDurationHours > 0 && precipDurationHours <= 2)) {
    return t("precipLight");
  }

  // Case 2: starts late and not a big precipitation day
  if (precipStartHour != null && precipStartHour >= 18 && mm < 10) {
    return isSnow ? t("precipLateSnow") : t("precipLateRain");
  }

  // Case 3: normal intensity-based labels
  if (isSnow) {
    if (mm <= 1) return t("precipLightSnow");
    if (mm <= 5) return t("precipModerateSnow");
    if (mm <= 15) return t("precipHeavySnow");
    return t("precipVeryHeavySnow") || t("precipHeavySnow");
  }

  if (mm <= 1) return t("precipLightRain");
  if (mm <= 10) return t("precipModerateRain");
  if (mm <= 25) return t("precipHeavyRain");
  return t("precipVeryHeavyRain") || t("precipHeavyRain");
}
