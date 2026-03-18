export function getPrecipitationLabel(type, mm, t, opts = {}) {
  if (mm == null || mm <= 0) return null;

  const { precipStartHour = null, precipDurationHours = 0, tmin = null, tmax = null } = opts;

  const isSnow = type === "snow";

  const hasValidTemps =
    typeof tmin === "number" &&
    Number.isFinite(tmin) &&
    typeof tmax === "number" &&
    Number.isFinite(tmax);

  const isMixedPrecip = hasValidTemps && mm >= 5 && tmin <= 1 && tmax >= 3;

  // 1) Mixed precipitation first
  if (isMixedPrecip) {
    return t("precipMixed");
  }

  // 2) Very light / short-lived precipitation
  if (mm < 1 || (precipDurationHours > 0 && precipDurationHours <= 2)) {
    return t("precipLight");
  }

  // 3) Late precipitation
  if (precipStartHour != null && precipStartHour >= 18 && mm < 10) {
    return isSnow ? t("precipLateSnow") : t("precipLateRain");
  }

  // 4) Normal intensity-based labels
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
