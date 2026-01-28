// Translate compass directions to Icelandic abbreviations
export function translateCompass(dir, lang = "en") {
  if (!dir) return dir;

  if (lang !== "is") return dir; // English/default: do nothing

  const map = {
    N: "N",   // Norður
    NE: "NA", // Norðaustur
    E: "A",   // Austur
    SE: "SA", // Suðaustur
    S: "S",   // Suður
    SW: "SV", // Suðvestur
    W: "V",   // Vestur
    NW: "NV", // Norðvestur
  };

  return map[dir] ?? dir;
}
