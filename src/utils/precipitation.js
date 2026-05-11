function resolvePrecipLabel({ tmin, tmax, rain, baseLabel, t }) {
  const min = typeof tmin === "number" ? tmin : 0;
  const max = typeof tmax === "number" ? tmax : 0;
  const r = typeof rain === "number" ? rain : 0;
  if (r <= 0) return baseLabel;
  if (max <= 4 && min <= 1) {
    return t("precipShowers");
  }
  if (max > 4) {
    if (r >= 2) return t("precipIntermittentRain");
    if (r >= 0.5) return t("showers");
    return t("precipLight");
  }
  return baseLabel;
}

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

  let baseLabel;

  // 1) Mixed precipitation first
  if (isMixedPrecip) {
    baseLabel = t("precipMixed");
  }

  // 2) Very light / short-lived precipitation
  else if (mm < 1 || (precipDurationHours > 0 && precipDurationHours <= 2)) {
    baseLabel = t("precipLight");
  }

  // 3) Showery conditions (él)
  else if (precipDurationHours >= 2) {
    if (mm < 3) {
      baseLabel = t("precipShowers");
    } else if (isSnow && mm <= 5) {
      baseLabel = t("precipShowers");
    } else {
      baseLabel = null;
    }
  }

  // 4) Late precipitation
  else if (precipStartHour != null && precipStartHour >= 18 && mm < 10) {
    baseLabel = isSnow ? t("precipLateSnow") : t("precipLateRain");
  }

  // 5) Normal intensity-based labels
  else if (isSnow) {
    if (mm <= 1) baseLabel = t("precipLightSnow");
    else if (mm <= 5) baseLabel = t("precipModerateSnow");
    else if (mm <= 15) baseLabel = t("precipHeavySnow");
    else baseLabel = t("precipVeryHeavySnow") || t("precipHeavySnow");
  }

  else {
    if (mm <= 1) baseLabel = t("precipLightRain");
    else if (mm <= 10) baseLabel = t("precipModerateRain");
    else if (mm <= 25) baseLabel = t("precipHeavyRain");
    else baseLabel = t("precipVeryHeavyRain") || t("precipHeavyRain");
  }

  if (baseLabel == null) return null;

  return resolvePrecipLabel({ tmin, tmax, rain: mm, baseLabel, t });
}
