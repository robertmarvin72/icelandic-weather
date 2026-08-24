// api/_lib/aurora/parseAurora.js
//
// Hand-written, purpose-built parser for the Icelandic Met Office aurora XML
// feed (https://xmlweather.vedur.is/aurora?op=xml&type=index). Not a general
// XML parser — no XML library is installed in this project, and the
// confirmed live schema is small, flat, and has no attributes/CDATA/
// namespaces, so a small regex-based extractor is safer and dependency-free
// rather than adding a library for one feed.
//
// Contract: every field is independently nullable. Empty upstream tags
// (<moonrise/>, <moonrise></moonrise>) are valid contract state, confirmed
// both by Vedur's own XML documentation and a live fetch — never treated as
// errors. `activity_forecast: 0` is a real, distinct value and must never be
// confused with "missing" (null).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const INT_RE = /^-?\d+$/;

function extractBlock(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1] : null;
}

function extractAllBlocks(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

// Handles both <tag>value</tag> and empty/self-closing <tag/>, <tag></tag>.
// Returns null for anything empty/absent — never throws.
function extractLeaf(xml, tag) {
  if (typeof xml !== "string") return null;

  if (new RegExp(`<${tag}\\s*/>`).test(xml)) return null;

  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  if (!m) return null;

  const trimmed = m[1].trim();
  return trimmed === "" ? null : trimmed;
}

function isValidIsoDate(str) {
  if (!str || !DATE_RE.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  // Round-trip check catches calendar-invalid dates (e.g. 2026-02-30) that
  // Date would otherwise silently roll over into the next month.
  return d.toISOString().slice(0, 10) === str;
}

function toValidatedDate(raw) {
  return isValidIsoDate(raw) ? raw : null;
}

function toValidatedTime(raw) {
  return raw && TIME_RE.test(raw) ? raw : null;
}

function toValidatedInt(raw) {
  if (raw == null || !INT_RE.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseSun(sunBlock) {
  if (!sunBlock) {
    return { sunset: null, darknessStart: null, dawn: null, sunrise: null };
  }
  return {
    sunset: toValidatedTime(extractLeaf(sunBlock, "sunset")),
    darknessStart: toValidatedTime(extractLeaf(sunBlock, "darkness")),
    dawn: toValidatedTime(extractLeaf(sunBlock, "dawn")),
    sunrise: toValidatedTime(extractLeaf(sunBlock, "sunrise")),
  };
}

function parseMoon(moonBlock) {
  if (!moonBlock) {
    return { ageDays: null, rise: null, set: null, scheduleType: null };
  }
  return {
    ageDays: toValidatedInt(extractLeaf(moonBlock, "age")),
    rise: toValidatedTime(extractLeaf(moonBlock, "moonrise")),
    set: toValidatedTime(extractLeaf(moonBlock, "moonset")),
    // Raw numeric code preserved as-is. Known values (1-4) are documented by
    // Vedur, but unknown values must be preserved, not rejected or guessed
    // at — mapping to human copy is a presentation-layer concern (later
    // ticket), not this parser's job.
    scheduleType: toValidatedInt(extractLeaf(moonBlock, "schedule_type")),
  };
}

// Parses one <night_data>...</night_data> inner block. Returns null if the
// night has no valid evening_date — without a valid date the entry can't be
// meaningfully consumed downstream, so the whole night is dropped rather
// than kept with a null date. Every other field degrades independently to
// null; one bad field never discards its siblings.
function parseNight(nightBlock) {
  const eveningDate = toValidatedDate(extractLeaf(nightBlock, "evening_date"));
  if (!eveningDate) return null;

  return {
    eveningDate,
    auroraActivity: toValidatedInt(extractLeaf(nightBlock, "activity_forecast")),
    sun: parseSun(extractBlock(nightBlock, "sun")),
    moon: parseMoon(extractBlock(nightBlock, "moon")),
  };
}

/**
 * Parses the full aurora XML document into an array of normalized nights.
 * Never throws for malformed individual fields or nights — a bad single
 * night is dropped, valid siblings are kept. Unknown/extra tags anywhere in
 * the document are silently ignored (forward-compatible with upstream
 * schema additions). Returns [] (never null, never throws) if nothing
 * usable was found, so callers can uniformly check `.length`.
 */
export function parseAuroraSnapshot(xml) {
  if (typeof xml !== "string" || !xml.includes("<night_data>")) {
    return [];
  }

  const nightBlocks = extractAllBlocks(xml, "night_data");

  return nightBlocks
    .map((block) => {
      try {
        return parseNight(block);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
