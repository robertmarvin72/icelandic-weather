export function getPrecipitationLabel(type, mm, t) {
  if (mm == null || mm <= 0) return null;

  const isSnow = type === "snow";

  // --- SNOW (CampCast tuned) ---
  if (isSnow) {
    if (mm <= 1) return t("precipLightSnow");
    if (mm <= 5) return t("precipModerateSnow");
    if (mm <= 15) return t("precipHeavySnow");
    return t("precipVeryHeavySnow") || t("precipHeavySnow");
  }

  // --- RAIN (CampCast tuned) ---
  if (mm <= 1) return t("precipLightRain");
  if (mm <= 10) return t("precipModerateRain");
  if (mm <= 25) return t("precipHeavyRain");
  return t("precipVeryHeavyRain") || t("precipHeavyRain");
}
