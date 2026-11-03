// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchRoadSegments, fetchRoadPoints, normalizeIdButur } from "./roadFetch.js";
import { WINTER_ROUTE_IDBUTUR_LIST } from "./segments.js";

function jsonResponse(body) {
  return { ok: true, text: async () => JSON.stringify(body) };
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("normalizeIdButur — handles the real .0 float shape (S5d), rejects genuine fractions (R2)", () => {
  it("normalizes a float with a trailing .0 (it IS an integer value in JS)", () => {
    expect(normalizeIdButur(902030037.0)).toBe(902030037);
  });

  it("normalizes a numeric string, including a .0-suffixed string", () => {
    expect(normalizeIdButur("902030037")).toBe(902030037);
    expect(normalizeIdButur("252090037.0")).toBe(252090037);
  });

  it("returns null for unparsable input", () => {
    expect(normalizeIdButur("not-a-number")).toBeNull();
    expect(normalizeIdButur(null)).toBeNull();
    expect(normalizeIdButur(undefined)).toBeNull();
  });

  it("Round 2 (R2): rejects a genuine fraction outright — never rounds it into matching a real segment", () => {
    expect(normalizeIdButur(252090037.4)).toBeNull();
    expect(normalizeIdButur("252090037.4")).toBeNull();
  });
});

describe("fetchRoadSegments — fixed 13 IDBUTUR, in fixed order, regardless of feed order", () => {
  it("returns exactly the 13 fixed segments in fixed order even when the feed is shuffled/nationwide", () => {
    const shuffled = [...WINTER_ROUTE_IDBUTUR_LIST].reverse().map((id) => ({
      IdButur: id,
      AstandYfirbord: "GREIDFAERT",
      AstandVidbotaruppl: null,
      DagsSkrad: "2026-11-02T02:55:00Z",
      DagsKeyrtUt: "2026-11-02T13:21:00Z",
    }));
    // Add unrelated nationwide noise that must be ignored.
    shuffled.push({ IdButur: 999999999, AstandYfirbord: "LOKAD" });

    global.fetch.mockResolvedValue(jsonResponse(shuffled));

    return fetchRoadSegments().then((result) => {
      expect(result.ok).toBe(true);
      expect(result.rows.map((r) => r.idButur)).toEqual(WINTER_ROUTE_IDBUTUR_LIST);
    });
  });

  it("marks a segment not found in the feed as found:false, never defaulting to passable", async () => {
    global.fetch.mockResolvedValue(jsonResponse([]));
    const result = await fetchRoadSegments();
    expect(result.ok).toBe(true);
    expect(result.rows.every((r) => r.found === false)).toBe(true);
  });

  it("Round 2 (R2): a genuinely contradictory duplicate (GREIDFAERT then LOKAD) is ambiguous, with the closure preserved/forced, regardless of order", async () => {
    const id = WINTER_ROUTE_IDBUTUR_LIST[3];
    for (const rows of [
      [
        { IdButur: id, AstandYfirbord: "GREIDFAERT" },
        { IdButur: id, AstandYfirbord: "LOKAD" },
      ],
      [
        { IdButur: id, AstandYfirbord: "LOKAD" },
        { IdButur: id, AstandYfirbord: "GREIDFAERT" },
      ],
    ]) {
      global.fetch.mockResolvedValue(jsonResponse(rows));
      const result = await fetchRoadSegments();
      const row = result.rows.find((r) => r.idButur === id);
      expect(row.ambiguous).toBe(true);
      expect(row.forcedCategory).toBe("closed");
    }
  });

  it("Round 2 (R2): a contradictory duplicate with no closure among the candidates is ambiguous with no forced category", async () => {
    const id = WINTER_ROUTE_IDBUTUR_LIST[3];
    global.fetch.mockResolvedValue(
      jsonResponse([
        { IdButur: id, AstandYfirbord: "GREIDFAERT" },
        { IdButur: id, AstandYfirbord: "OFAERT_ANNAD" },
      ])
    );
    const result = await fetchRoadSegments();
    const row = result.rows.find((r) => r.idButur === id);
    expect(row.ambiguous).toBe(true);
    expect(row.forcedCategory).toBeNull();
  });

  it("two IDENTICAL duplicate rows for the same id are not treated as ambiguous", async () => {
    const id = WINTER_ROUTE_IDBUTUR_LIST[3];
    global.fetch.mockResolvedValue(
      jsonResponse([
        { IdButur: id, AstandYfirbord: "GREIDFAERT", DagsSkrad: "2026-11-02T02:55:00Z" },
        { IdButur: id, AstandYfirbord: "GREIDFAERT", DagsSkrad: "2026-11-02T02:55:00Z" },
      ])
    );
    const result = await fetchRoadSegments();
    const row = result.rows.find((r) => r.idButur === id);
    expect(row.ambiguous).toBe(false);
  });

  it("truncates AstandLysing/AstandLysingEn to 300 characters", async () => {
    const longText = "x".repeat(500);
    global.fetch.mockResolvedValue(
      jsonResponse([
        {
          IdButur: WINTER_ROUTE_IDBUTUR_LIST[0],
          AstandYfirbord: "GREIDFAERT",
          AstandLysing: longText,
          AstandLysingEn: longText,
        },
      ])
    );
    const result = await fetchRoadSegments();
    expect(result.rows[0].astandLysing.length).toBe(300);
  });
});

describe("fetchRoadPoints — filters to our 13 IDBUTUR, never carries Aths/AthsEn", () => {
  it("drops points on segments outside our corridor", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([
        { IdButur: WINTER_ROUTE_IDBUTUR_LIST[0], IdPunktur: 1, Astand: "VEGAVINNA" },
        { IdButur: 999999999, IdPunktur: 2, Astand: "VEGAVINNA" },
      ])
    );
    const result = await fetchRoadPoints();
    expect(result.ok).toBe(true);
    expect(result.points).toHaveLength(1);
    expect(result.points[0].idButur).toBe(WINTER_ROUTE_IDBUTUR_LIST[0]);
  });

  it("never includes Aths/AthsEn in the mapped point shape, even if present upstream", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([
        {
          IdButur: WINTER_ROUTE_IDBUTUR_LIST[0],
          IdPunktur: 1,
          Astand: "VEGAVINNA",
          Aths: "free text third-party notice",
          AthsEn: "free text third-party notice (en)",
        },
      ])
    );
    const result = await fetchRoadPoints();
    expect(result.points[0]).not.toHaveProperty("Aths");
    expect(result.points[0]).not.toHaveProperty("AthsEn");
    expect(result.points[0]).not.toHaveProperty("aths");
    expect(JSON.stringify(result.points[0])).not.toContain("free text");
  });

  it("normalizes real .0-suffixed IdButur/IdPunktur values from the retained sample shape", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([{ IdButur: WINTER_ROUTE_IDBUTUR_LIST[4] + 0.0, IdPunktur: 67861.0, Astand: "VEGAVINNA" }])
    );
    const result = await fetchRoadPoints();
    expect(result.points[0].idButur).toBe(WINTER_ROUTE_IDBUTUR_LIST[4]);
    expect(result.points[0].idPunktur).toBe(67861);
  });
});
