// Ticket 420 (#420) — cheap, TEST-ONLY heuristic guards over the active
// personality text. These are regression tripwires, not editorial proof:
// - emoji: any pictograph is rejected.
// - second person: rejected except good_21, which the issue explicitly
//   approves as addressed to the weather (documented standalone-card caveat).
// - imperatives: a narrow list of sentence-initial imperative verbs.
// - time/season: narrow words that would assert a time of day or season.
// - length: the approved maxima (IS 59 characters, EN 50), a regression
//   check only, not an editorial cap or permission to trim text.
// Heuristics can miss things and can also flag legitimate wording; they never
// replace the editorial review in docs/ai/tasks/ticket-420/content-validation.md.
import { describe, it, expect } from "vitest";
import { is as rawIs } from "../i18n/weatherVoice/is";
import { en as rawEn } from "../i18n/weatherVoice/en";
import { WEATHER_VOICE_LEDGER } from "../test-fixtures/weatherVoiceLedger";

const ACTIVE = WEATHER_VOICE_LEDGER.filter((r) => r.status === "retained" || r.status === "new");
const isText = Object.fromEntries(rawIs.map((e) => [e.id, e.text]));
const enText = Object.fromEntries(rawEn.map((e) => [e.id, e.text]));
const GOOD_21_EXCEPTION = "good_21";

const EMOJI = /\p{Extended_Pictographic}/u;
const IS_SECOND_PERSON = /(?<![\p{L}])(þú|þig|þér|þín|þitt|þína|þínum|þínar|þinn|þína)(?![\p{L}])/iu;
const EN_SECOND_PERSON = /\b(you|your|yours|yourself)\b/i;
const EN_IMPERATIVE = /^(go|take|wear|get|bring|check|remember|stay|grab|don't|do not|try|make)\b/i;
const IS_IMPERATIVE = /^(farðu|taktu|klæddu|fáðu|láttu|gerðu|passaðu|hafðu|mundu|athugaðu|skoðaðu|komdu|settu|finndu)(?![\p{L}])/iu;
const TIME_OF_DAY_OR_SEASON_IS = /(?<![\p{L}])(morgun|morgni|kvöld|kvöldi|nótt|nóttin|vetur|vetrar|sumar|sumri|haust|vor)(?![\p{L}])/iu;
const TIME_OF_DAY_OR_SEASON_EN = /\b(morning|evening|night|tonight|summer|winter|autumn|spring|tomorrow)\b/i;

const MAX_IS = 59;
const MAX_EN = 50;

describe("guards: emoji (#420)", () => {
  it("no active IS or EN text contains an emoji or pictograph", () => {
    for (const row of ACTIVE) {
      expect(EMOJI.test(row.is), `is ${row.id}`).toBe(false);
      expect(EMOJI.test(row.en), `en ${row.id}`).toBe(false);
    }
  });
});

describe("guards: second person (#420)", () => {
  it("no active text addresses the user, except the approved good_21 exception", () => {
    for (const row of ACTIVE) {
      if (row.id === GOOD_21_EXCEPTION) continue;
      expect(IS_SECOND_PERSON.test(row.is), `is ${row.id}`).toBe(false);
      expect(EN_SECOND_PERSON.test(row.en), `en ${row.id}`).toBe(false);
    }
  });

  it("good_21 is the sole exception and still matches the heuristic (documented, not hidden)", () => {
    const row = ACTIVE.find((r) => r.id === GOOD_21_EXCEPTION);
    expect(row).toBeDefined();
    expect(IS_SECOND_PERSON.test(row.is)).toBe(true);
    expect(EN_SECOND_PERSON.test(row.en)).toBe(true);
    expect(row.note).toMatch(/standalone card/);
  });
});

describe("guards: imperatives (#420)", () => {
  it("no active sentence opens with a listed imperative verb", () => {
    for (const row of ACTIVE) {
      expect(IS_IMPERATIVE.test(row.is), `is ${row.id}`).toBe(false);
      expect(EN_IMPERATIVE.test(row.en), `en ${row.id}`).toBe(false);
    }
  });
});

describe("guards: time of day and season (#420)", () => {
  it("no active text names a time of day or season (narrow list; temporal idioms are documented separately)", () => {
    for (const row of ACTIVE) {
      expect(TIME_OF_DAY_OR_SEASON_IS.test(row.is), `is ${row.id}`).toBe(false);
      expect(TIME_OF_DAY_OR_SEASON_EN.test(row.en), `en ${row.id}`).toBe(false);
    }
  });
});

describe("guards: approved length maxima (#420, regression only)", () => {
  it("every active IS line is at most 59 characters and every EN line at most 50", () => {
    for (const row of ACTIVE) {
      expect(row.is.length, `is ${row.id}`).toBeLessThanOrEqual(MAX_IS);
      expect(row.en.length, `en ${row.id}`).toBeLessThanOrEqual(MAX_EN);
    }
  });

  it("the longest active lines hit the approved maxima exactly (good_16 IS, the longest EN)", () => {
    expect(Math.max(...ACTIVE.map((r) => r.is.length))).toBe(MAX_IS);
    expect(Math.max(...ACTIVE.map((r) => r.en.length))).toBe(MAX_EN);
    expect(ACTIVE.find((r) => r.is.length === MAX_IS).id).toBe("good_16");
  });
});

describe("guards: raw list text stays aligned with the ledger (#420)", () => {
  it("raw texts used by these guards are exactly the ledger texts", () => {
    for (const row of ACTIVE) {
      expect(isText[row.id]).toBe(row.is);
      expect(enText[row.id]).toBe(row.en);
    }
  });
});

// The heavy-rain supplement (#420 Part B) goes through the same heuristics.
// The one exception is rain_heavy_29, whose EN "when you need him" is a generic
// "you" (the owner-authorised line; the exception is asserted, not hidden).
const SUPPLEMENT_ROWS = WEATHER_VOICE_LEDGER.filter((r) => r.status === "active_supplemental");
const SUPPLEMENT_SECOND_PERSON_EXCEPTION = "rain_heavy_29";

describe("guards: heavy-rain supplement (#420 Part B)", () => {
  it("the supplement set has exactly the three ledger IDs", () => {
    expect(SUPPLEMENT_ROWS.map((r) => r.id).sort()).toEqual(["rain_heavy_24", "rain_heavy_25", "rain_heavy_29"]);
  });

  it("supplement lines have no emoji, no imperatives, and no time-of-day or season words", () => {
    for (const row of SUPPLEMENT_ROWS) {
      expect(EMOJI.test(row.is), `is ${row.id}`).toBe(false);
      expect(EMOJI.test(row.en), `en ${row.id}`).toBe(false);
      expect(IS_IMPERATIVE.test(row.is), `is ${row.id}`).toBe(false);
      expect(EN_IMPERATIVE.test(row.en), `en ${row.id}`).toBe(false);
      expect(TIME_OF_DAY_OR_SEASON_IS.test(row.is), `is ${row.id}`).toBe(false);
      expect(TIME_OF_DAY_OR_SEASON_EN.test(row.en), `en ${row.id}`).toBe(false);
    }
  });

  it("supplement second person is absent, except the asserted rain_heavy_29 generic-you exception", () => {
    for (const row of SUPPLEMENT_ROWS) {
      expect(IS_SECOND_PERSON.test(row.is), `is ${row.id}`).toBe(false);
      if (row.id === SUPPLEMENT_SECOND_PERSON_EXCEPTION) {
        expect(EN_SECOND_PERSON.test(row.en), `en ${row.id} exception must still match`).toBe(true);
      } else {
        expect(EN_SECOND_PERSON.test(row.en), `en ${row.id}`).toBe(false);
      }
    }
  });
});
