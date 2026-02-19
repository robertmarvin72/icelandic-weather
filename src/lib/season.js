// src/lib/season.js

export function getSeason(date = new Date()) {
  const m = new Date(date).getMonth() + 1;

  if (m >= 10 || m <= 4) return "winter";
  return "summer";
}
