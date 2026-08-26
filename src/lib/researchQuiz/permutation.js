// src/lib/researchQuiz/permutation.js
//
// Unbiased Fisher-Yates shuffle. `randomFn` is injectable so tests can
// assert a real, non-fixed-order permutation deterministically instead of
// relying on Math.random (approved prompt §"Quiz protocol" #3, tests §3).

export function fisherYatesShuffle(items, randomFn = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
