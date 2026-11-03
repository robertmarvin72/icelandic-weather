// api/_lib/winterRoute/roadFetch.js
//
// Ticket #486 — fetches and filters Vegagerðin's two fixed road-condition
// feeds to exactly our 13 IDBUTUR. Deliberately returns raw-ish field
// values (never interprets a code here — see roadConditionCodes.js) and
// never carries Aths/AthsEn at all (S2 decision (a): not displayed, so they
// are dropped here, at the earliest possible point, rather than filtered
// out only at render time).

import { fetchJsonBounded } from "./boundedFetch.js";
import { WINTER_ROUTE_IDBUTUR_LIST } from "./segments.js";
import { categorizeAstandYfirbord, categorizeAstandVidbotaruppl, SEGMENT_CATEGORY } from "./roadConditionCodes.js";

export const FAERD_URL = "https://gagnaveita.vegagerdin.is/api/faerd2017_1";
export const FAERDPUNKTAR_URL = "https://gagnaveita.vegagerdin.is/api/faerdpunktar2017_1";

const MAX_TEXT_FIELD_LENGTH = 300;

function truncatedText(value) {
  return typeof value === "string" ? value.slice(0, MAX_TEXT_FIELD_LENGTH) : null;
}

// S5(d)/R2 correction: retained samples carry IDBUTUR/IDPUNKTUR as a
// float with a trailing .0 (e.g. 252090037.0) — JS numbers have no
// separate integer type, so that value IS already an integer and
// Number.isInteger() accepts it. A GENUINE fraction (e.g. 252090037.4,
// seen in Jonesy's attack sample) must be rejected outright, never rounded
// into matching a real segment — rounding previously let a malformed value
// silently collide with a real IDBUTUR.
export function normalizeIdButur(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function normalizeConditionFields(row) {
  return {
    astandYfirbord: typeof row.AstandYfirbord === "string" ? row.AstandYfirbord : null,
    astandVidbotaruppl: typeof row.AstandVidbotaruppl === "string" ? row.AstandVidbotaruppl : null,
    astandLysing: truncatedText(row.AstandLysing),
    astandLysingEn: truncatedText(row.AstandLysingEn),
    dagsSkrad: typeof row.DagsSkrad === "string" ? row.DagsSkrad : null,
    dagsKeyrtUt: typeof row.DagsKeyrtUt === "string" ? row.DagsKeyrtUt : null,
  };
}

function rowIsClosed(fields) {
  return (
    categorizeAstandYfirbord(fields.astandYfirbord) === SEGMENT_CATEGORY.CLOSED ||
    categorizeAstandVidbotaruppl(fields.astandVidbotaruppl) === SEGMENT_CATEGORY.CLOSED
  );
}

export async function fetchRoadSegments(fetchOptions) {
  const result = await fetchJsonBounded(FAERD_URL, fetchOptions);
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) return { ok: false, reason: "invalid_shape" };

  // R2: group ALL rows per id first — a duplicate/contradictory IDBUTUR
  // must never resolve to whichever row happened to appear first.
  const groups = new Map();
  for (const row of result.data) {
    const id = normalizeIdButur(row?.IdButur);
    if (id == null) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  }

  const rows = WINTER_ROUTE_IDBUTUR_LIST.map((id) => {
    const group = groups.get(id);
    if (!group || group.length === 0) return { idButur: id, found: false };

    const candidates = group.map(normalizeConditionFields);
    const distinctConditionKeys = new Set(candidates.map((c) => `${c.astandYfirbord}\u0000${c.astandVidbotaruppl}`));

    if (distinctConditionKeys.size <= 1) {
      // Either one row, or several rows that all agree — not a real
      // contradiction, use the first as-is.
      return { idButur: id, found: true, ambiguous: false, ...candidates[0] };
    }

    // Genuinely contradictory duplicate rows for the same IDBUTUR (e.g.
    // GREIDFAERT and LOKAD both present). A known closure among the
    // duplicates is preserved/prioritized rather than hidden under
    // "unknown" (Ripley's final decision on R2) — any other disagreement
    // without a closure present becomes unknown, with no positive style.
    const closedCandidate = candidates.find(rowIsClosed);
    const representative = closedCandidate ?? candidates[0];

    return {
      idButur: id,
      found: true,
      ambiguous: true,
      forcedCategory: closedCandidate ? SEGMENT_CATEGORY.CLOSED : null,
      ...representative,
    };
  });

  // Documented/observed: every row in one export shares the same
  // DagsKeyrtUt — any matched row's value represents the whole feed's
  // export time. Missing entirely (e.g. our corridor had zero matches, or
  // the feed was empty) is reported as null, never guessed from "now".
  const feedDagsKeyrtUt = result.data.find((r) => typeof r?.DagsKeyrtUt === "string")?.DagsKeyrtUt ?? null;

  return { ok: true, rows, feedDagsKeyrtUt };
}

export async function fetchRoadPoints(fetchOptions) {
  const result = await fetchJsonBounded(FAERDPUNKTAR_URL, fetchOptions);
  if (!result.ok) return result;
  if (!Array.isArray(result.data)) return { ok: false, reason: "invalid_shape" };

  const idSet = new Set(WINTER_ROUTE_IDBUTUR_LIST);
  const points = [];
  for (const row of result.data) {
    const idButur = normalizeIdButur(row?.IdButur);
    if (idButur == null || !idSet.has(idButur)) continue;
    points.push({
      idButur,
      idPunktur: normalizeIdButur(row?.IdPunktur),
      astand: typeof row.Astand === "string" ? row.Astand : null,
      lysing: truncatedText(row.Lysing),
      lysingEn: truncatedText(row.LysingEn),
      dagsSkrad: typeof row.DagsSkrad === "string" ? row.DagsSkrad : null,
      gildirTil: typeof row.GildirTil === "string" ? row.GildirTil : null,
    });
  }

  const feedDagsKeyrtUt = result.data.find((r) => typeof r?.DagsKeyrtUt === "string")?.DagsKeyrtUt ?? null;

  return { ok: true, points, feedDagsKeyrtUt };
}
