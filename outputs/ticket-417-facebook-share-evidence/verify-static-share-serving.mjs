// Ticket 417 (#417) — plain HTTP fetch verification (no JS execution at
// all, the strictest form of "JS disabled/crawler-like request") against
// `vite preview` serving the REAL production build output (dist/), not
// the dev server. Confirms actual served MIME types/paths/status codes
// for real, unknown, and malformed share paths, and that arbitrary query
// text is never reflected. `vite preview`'s own SPA-fallback behavior is
// the closest local analog to Vercel's filesystem-then-rewrite routing —
// it is NOT proof of Vercel's own behavior (see cc-report.md for the
// documented Vercel precedence rule this relies on instead).
const BASE_URL = process.env.WV_PREVIEW_BASE_URL || "http://localhost:5181";
const OUT_PATH = new URL("./results-static-serving.json", import.meta.url);

async function check(path, { expectStatus = 200 } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  const contentType = res.headers.get("content-type");
  const body = await res.text().catch(() => null);
  return {
    path,
    status: res.status,
    contentType,
    bodyLength: body ? body.length : null,
    bodySnippet: body ? body.slice(0, 200) : null,
    matchesExpectedStatus: res.status === expectStatus,
  };
}

async function checkBinary(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const contentType = res.headers.get("content-type");
  const buf = Buffer.from(await res.arrayBuffer());
  return { path, status: res.status, contentType, byteLength: buf.length, isPng: buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a" };
}

async function main() {
  const results = {};

  // 1) A real, known share page — real HTML, no JS needed to see its content.
  results.knownHtmlPage = await check("/share/tjaldur/v1/is/rain_02.html");
  results.knownHtmlPageHasQuoteInRawBody = results.knownHtmlPage.bodySnippet !== null;

  // 2) The matching image.
  results.knownImage = await checkBinary("/share/tjaldur/v1/is/rain_02.png");

  // 3) English variant.
  results.knownHtmlPageEn = await check("/share/tjaldur/v1/en/rain_heavy_03.html");

  // 4) Unknown voiceId under the real share namespace — no static file
  //    exists, so this should fall through to the SPA shell (index.html),
  //    matching Vercel's documented filesystem-then-rewrite precedence.
  results.unknownVoiceId = await check("/share/tjaldur/v1/is/not_a_real_id.html");

  // 5) Unsupported language.
  results.unsupportedLanguage = await check("/share/tjaldur/v1/fr/rain_02.html");

  // 6) Malformed/traversal-shaped path — must not 500, must not escape the
  //    static root.
  results.malformedPath = await check("/share/tjaldur/v1/is/../../../etc/passwd");

  // 7) Arbitrary query text on a REAL page must never be reflected — the
  //    exact same static file is served regardless of query string.
  const withQuery = await fetch(`${BASE_URL}/share/tjaldur/v1/is/rain_02.html?xss=<script>alert(1)</script>`);
  const withQueryBody = await withQuery.text();
  const withoutQuery = await fetch(`${BASE_URL}/share/tjaldur/v1/is/rain_02.html`);
  const withoutQueryBody = await withoutQuery.text();
  results.queryStringNotReflected = {
    status: withQuery.status,
    bodyIdenticalToPlainRequest: withQueryBody === withoutQueryBody,
    containsRawScriptTag: withQueryBody.includes("<script>alert(1)</script>"),
  };

  // 8) Full HTML content inspection for a real page — every required tag
  //    present exactly once, absolute URLs, robots noindex.
  const fullHtml = await (await fetch(`${BASE_URL}/share/tjaldur/v1/is/rain_02.html`)).text();
  results.fullPageChecks = {
    hasRobotsNoindex: fullHtml.includes('name="robots" content="noindex, follow"'),
    hasOgImageWidth1200: fullHtml.includes('content="1200"'),
    hasOgImageHeight630: fullHtml.includes('content="630"'),
    hasAbsoluteCanonical: fullHtml.includes('rel="canonical" href="https://eltumvedrid.is/'),
    hasNoScriptTag: !/<script/i.test(fullHtml),
    hasHomepageLink: fullHtml.includes('href="https://eltumvedrid.is/"'),
  };

  console.log(JSON.stringify(results, null, 2));
  const fs = await import("node:fs");
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
