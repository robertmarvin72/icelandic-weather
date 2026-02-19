// src/config/availability.js

const DEFAULT_SEASON = {
  openFrom: { month: 5, day: 1 },   // May 1
  openTo: { month: 9, day: 30 },    // Sep 30
  mode: "seasonal",                 // "seasonal" | "allYear"
};

// --- ALL YEAR CAMPSITES (CONFIRMED) ---
const ALL_YEAR_BY_ID = {
  laugardalur_reykjavik: {
    mode: "allYear",
    winterStatus: "year_round_full",
    winterNotes:
      "Full þjónusta allt árið. Sturtur, rafmagn og eldhús opin.",
  },

  akureyri: {
    mode: "allYear",
    winterStatus: "year_round_limited",
    winterNotes:
      "Opið allt árið en þjónusta getur verið takmörkuð yfir hávetur.",
  },

  egilsstadir: {
    mode: "allYear",
    winterStatus: "year_round_limited",
    winterNotes:
      "Yfirleitt opið allt árið, aðallega fyrir camper-vans.",
  },

  hofn: {
    mode: "allYear",
    winterStatus: "year_round_limited",
    winterNotes:
      "Oft opið allt árið, staðfesta þarf yfir djúpan vetur.",
  },
};

// --- Helpers ---------------------------------------------------------------

function toYmd(d) {
  const dt = new Date(d);
  return {
    y: dt.getFullYear(),
    m: dt.getMonth() + 1,
    day: dt.getDate(),
  };
}

function isBetweenMonthDay(ymd, from, to) {
  const value = ymd.m * 100 + ymd.day;
  const start = from.month * 100 + from.day;
  const end = to.month * 100 + to.day;
  return value >= start && value <= end;
}

// ✅ Winter season check (Oct–Apr)
function isWinterSeason(date) {
  const m = new Date(date).getMonth() + 1; // 1–12
  return m >= 10 || m <= 4; // October through April
}

// --- Public API ------------------------------------------------------------

export function getSiteAvailability(siteId, date = new Date()) {
  const override = ALL_YEAR_BY_ID[siteId];
  const winter = isWinterSeason(date);

  // --- ALL YEAR ---
  if (override?.mode === "allYear") {
    return {
      status: "open",
      mode: "allYear",
      winterStatus: override.winterStatus,
      winterNotes: override.winterNotes,

      // ✅ new meta flags (UI friendly)
      isClosed: false,
      isWinter: winter,
    };
  }

  // --- WINTER GATE (seasonal sites closed Oct–Apr) ---
  if (winter) {
    return {
      status: "closed",
      mode: "seasonal",
      reopenHint: "availabilityMostOpenInMay",
      reason: "winter_season",

      // ✅ new meta flags
      isClosed: true,
      isWinter: true,
    };
  }

  // --- SUMMER SEASON (May–Sep) ---
  const ymd = toYmd(date);
  const open = isBetweenMonthDay(
    ymd,
    DEFAULT_SEASON.openFrom,
    DEFAULT_SEASON.openTo
  );

  if (open) {
    return {
      status: "open",
      mode: "seasonal",

      // ✅ meta
      isClosed: false,
      isWinter: false,
    };
  }

  return {
    status: "closed",
    mode: "seasonal",
    reopenHint: "availabilityMostOpenInMay",

    // ✅ meta
    isClosed: true,
    isWinter: false,
  };
}

export function isSiteOpenOnDate(siteId, date) {
  return getSiteAvailability(siteId, date).status === "open";
}
