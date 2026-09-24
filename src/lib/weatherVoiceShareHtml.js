// src/lib/weatherVoiceShareHtml.js
//
// Ticket 417 (#417) — pure static-HTML template for one Weather Voice
// share page. No framework, no build step, no JavaScript required to
// render its content — the page IS the destination (approved prompt
// "Approved bounded design"): it shows the quote/mascot, identifies
// itself as a shared comment rather than a live forecast, and links to
// the public homepage. Every dynamic value is HTML/attribute-escaped.

export const WEATHER_VOICE_SHARE_HOMEPAGE_URL = "https://eltumvedrid.is/";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND_NAME = { is: "Eltum Veðrið", en: "Chase the Weather" };

const COPY = {
  is: {
    tjaldurSays: "Tjaldur segir:",
    sharedNotice: "Þetta er deilt ummæli frá Eltum Veðrið — ekki lifandi veðurspá fyrir tiltekinn stað eða dag.",
    homepageLinkText: "Skoða Eltum Veðrið",
    imageAltPrefix: "Teiknimynd af Tjaldri sem segir",
  },
  en: {
    tjaldurSays: "Tjaldur says:",
    sharedNotice: "This is a shared comment from Chase the Weather — not a live forecast for a specific place or day.",
    homepageLinkText: "Visit Chase the Weather",
    imageAltPrefix: "Cartoon of Tjaldur saying",
  },
};

function languageAppropriateQuote(text, language) {
  return language === "is" ? `„${text}“` : `“${text}”`;
}

/**
 * buildWeatherVoiceShareHtml({language, voiceId, text, pageUrl, imageUrl})
 * -> string (a complete, standalone HTML document)
 *
 * Pure. Exactly one each of og:title/og:description/og:image/og:url/
 * og:type=website/og:image:width=1200/og:image:height=630, plus a suitable
 * <title>, lang attribute, canonical link, robots noindex,follow, and an
 * alt text describing the image. Every value that could contain
 * user/content-derived text is escaped.
 */
export function buildWeatherVoiceShareHtml({ language, voiceId, text, pageUrl, imageUrl }) {
  const copy = COPY[language] || COPY.is;
  const brand = BRAND_NAME[language] || BRAND_NAME.is;
  const quoted = languageAppropriateQuote(text, language);
  const title = `${copy.tjaldurSays} ${quoted}`;
  const description = `${brand} — ${quoted}`;
  const imageAlt = `${copy.imageAltPrefix}: ${quoted}`;

  const escTitle = escapeHtml(title);
  const escDescription = escapeHtml(description);
  const escPageUrl = escapeHtml(pageUrl);
  const escImageUrl = escapeHtml(imageUrl);
  const escQuoted = escapeHtml(quoted);
  const escNotice = escapeHtml(copy.sharedNotice);
  const escHomeLinkText = escapeHtml(copy.homepageLinkText);
  const escHomeUrl = escapeHtml(WEATHER_VOICE_SHARE_HOMEPAGE_URL);
  const escImageAlt = escapeHtml(imageAlt);
  const escBrand = escapeHtml(brand);
  const escVoiceId = escapeHtml(voiceId);

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escTitle}</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${escPageUrl}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escTitle}">
<meta property="og:description" content="${escDescription}">
<meta property="og:image" content="${escImageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escPageUrl}">
<meta name="description" content="${escDescription}">
<meta data-weather-voice-id="${escVoiceId}" data-weather-voice-lang="${language}">
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 40px 16px; background: #FFFBEB; color: #1E293B; font-family: -apple-system, "Segoe UI", system-ui, sans-serif; text-align: center; }
  img.share-image { max-width: 100%; width: 600px; height: auto; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  p.quote { font-size: 1.5rem; font-weight: 700; max-width: 640px; margin: 28px auto 12px; line-height: 1.35; }
  p.notice { color: #78716C; font-size: 0.9rem; max-width: 520px; margin: 0 auto 8px; }
  a.home-link { display: inline-block; margin-top: 24px; padding: 12px 28px; border-radius: 999px; background: #EA580C; color: #fff; text-decoration: none; font-weight: 600; font-size: 1rem; }
  a.home-link:hover { background: #C2410C; }
  p.brand { margin-top: 32px; color: #A8A29E; font-size: 0.8rem; }
</style>
</head>
<body>
  <img class="share-image" src="${escImageUrl}" width="1200" height="630" alt="${escImageAlt}">
  <p class="quote">${escQuoted}</p>
  <p class="notice">${escNotice}</p>
  <p><a class="home-link" href="${escHomeUrl}">${escHomeLinkText}</a></p>
  <p class="brand">${escBrand} · eltumvedrid.is</p>
</body>
</html>
`;
}
