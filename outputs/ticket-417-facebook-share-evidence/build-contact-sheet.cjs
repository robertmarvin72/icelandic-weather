// Ticket 417 (#417) — builds a single contact-sheet screenshot of all 54
// generated OG images (grid layout), for at-a-glance visual review, plus
// separately full-size screenshots of the two longest IS/EN comments and
// four representative condition images at reduced (Facebook-preview-like)
// size.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.WV_BASE_URL || "http://localhost:5180";
const OUT_DIR = __dirname;

function loadManifest() {
  const src = fs.readFileSync(`${OUT_DIR}/../../src/lib/weatherVoiceShareManifest.generated.js`, "utf8");
  const match = src.match(/export const WEATHER_VOICE_SHARE_MANIFEST = ([\s\S]*?);\s*$/m);
  return eval(`(${match[1]})`);
}

async function main() {
  const manifest = loadManifest();
  const entries = Object.values(manifest).sort((a, b) => (a.language + a.voiceId).localeCompare(b.language + b.voiceId));

  const gridHtml = `<!doctype html><html><head><style>
    body { margin:0; background:#f1f5f9; font-family: sans-serif; }
    .grid { display:grid; grid-template-columns: repeat(6, 1fr); gap: 4px; padding: 4px; }
    .cell { position: relative; }
    .cell img { width: 100%; display:block; border: 1px solid #ccc; }
    .cell .label { position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.6); color:#fff; font-size:9px; padding:1px 3px; }
  </style></head><body><div class="grid">
    ${entries.map((e) => `<div class="cell"><img src="${BASE_URL}/share/tjaldur/v1/${e.language}/${e.voiceId}.png"><span class="label">${e.language}/${e.voiceId}</span></div>`).join("\n")}
  </div></body></html>`;

  fs.writeFileSync(`${OUT_DIR}/_contact-sheet.html`, gridHtml);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 3200 } });
  await page.goto(`file://${OUT_DIR}/_contact-sheet.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT_DIR}/contact-sheet-all-54.png`, fullPage: true });
  await browser.close();

  fs.unlinkSync(`${OUT_DIR}/_contact-sheet.html`);
  console.log(`Contact sheet written: ${OUT_DIR}/contact-sheet-all-54.png (${entries.length} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
