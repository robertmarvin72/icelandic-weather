// ──────────────────────────────────────────────────────────────
// [SCORING] Weather scoring model (0..10 per day, 0..70 per week)
// ──────────────────────────────────────────────────────────────
export function scorePillClass(total) {
  if (total >= 60) return "bg-green-100 text-green-900 dark:bg-green-500/20 dark:text-green-200";
  if (total >= 45) return "bg-lime-100 text-lime-900 dark:bg-lime-500/20 dark:text-lime-200";
  if (total >= 30) return "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200";
  if (total >= 15) return "bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-200";
  return "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200";
}
