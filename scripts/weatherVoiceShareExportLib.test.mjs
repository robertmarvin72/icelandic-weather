// scripts/weatherVoiceShareExportLib.test.mjs
//
// Ticket 417 (#417) Round 2 correction — real, unmocked tests against real
// temporary files on disk (this repo's actual OS — Windows during this
// ticket's own execution), proving the P1 manifest-loading defect is fixed
// for real, not merely with a mocked empty manifest. Importing this file
// (and the library it tests) never launches Chromium or the export main
// routine — no Playwright import exists anywhere in this file's import
// graph.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadExistingManifest,
  describeManifestShapeProblem,
  detectExistingReleasedFilesWithoutManifest,
  classifyEntryAction,
  isValidPngSignature,
  readPngDimensions,
} from "./weatherVoiceShareExportLib.mjs";

// Fixtures live INSIDE the repo tree (not the OS tmpdir) — confirmed by
// probe that Vitest's dynamic-import resolution cannot reach arbitrary
// paths outside its project root, even though plain `node` (what the real
// export script actually runs under) handles a genuine OS-tmpdir
// file:// URL correctly. This directory is gitignored-equivalent: created
// fresh per test and removed in afterEach, never committed.
const FIXTURE_ROOT = join(process.cwd(), "scripts", ".tmp-export-lib-test");
let dir;
beforeEach(() => {
  mkdirSync(FIXTURE_ROOT, { recursive: true });
  dir = mkdtempSync(join(FIXTURE_ROOT, "case-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeManifestFile(path, source) {
  writeFileSync(path, source, "utf8");
}

const VALID_MANIFEST_SOURCE = `export const WEATHER_VOICE_SHARE_MANIFEST_VERSION = "v1";
export const WEATHER_VOICE_SHARE_MANIFEST = {
  "is|rain_02": {
    voiceId: "rain_02",
    language: "is",
    mood: "unimpressed",
    text: "Regnjakki með aðalhlutverk.",
    pageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.html",
    imageUrl: "https://eltumvedrid.is/share/tjaldur/v1/is/rain_02.png"
  }
};
`;

describe("loadExistingManifest — Ticket 417 (#417) Round 2: real Windows-compatible file:// loading (P1 fix)", () => {
  it("a genuinely absent manifest file returns status:'absent', not an error", async () => {
    const result = await loadExistingManifest(join(dir, "does-not-exist.js"));
    expect(result).toEqual({ status: "absent" });
  });

  it("a REAL, valid manifest file on THIS machine's real filesystem loads successfully via pathToFileURL — the exact Windows drive-letter path the Round 1 defect broke on", async () => {
    const manifestPath = join(dir, "manifest.generated.js");
    writeManifestFile(manifestPath, VALID_MANIFEST_SOURCE);

    // This exercises the real absolute path this OS gives us (a Windows
    // "C:\..." path during this ticket's own execution) — the Round 1 bug
    // was `new URL(path, "file://")` mis-parsing exactly this shape.
    const result = await loadExistingManifest(manifestPath);
    expect(result.status).toBe("ok");
    expect(result.version).toBe("v1");
    expect(result.manifest["is|rain_02"].text).toBe("Regnjakki með aðalhlutverk.");
  });

  it("an existing file that fails to import (syntax error) returns status:'invalid', never treated as absent", async () => {
    const manifestPath = join(dir, "broken.js");
    writeManifestFile(manifestPath, "this is not valid javascript {{{");
    const result = await loadExistingManifest(manifestPath);
    expect(result.status).toBe("invalid");
    expect(result.error).toBeTruthy();
  });

  it("an existing file with no WEATHER_VOICE_SHARE_MANIFEST export returns status:'invalid'", async () => {
    const manifestPath = join(dir, "no-export.js");
    writeManifestFile(manifestPath, "export const SOMETHING_ELSE = 42;\n");
    const result = await loadExistingManifest(manifestPath);
    expect(result.status).toBe("invalid");
    expect(result.error).toContain("missing or not a plain object");
  });

  it("an existing file whose manifest export is an array (wrong shape) returns status:'invalid'", async () => {
    const manifestPath = join(dir, "array-shape.js");
    writeManifestFile(manifestPath, "export const WEATHER_VOICE_SHARE_MANIFEST = [1, 2, 3];\n");
    const result = await loadExistingManifest(manifestPath);
    expect(result.status).toBe("invalid");
  });

  it("an existing file whose entries are missing required fields returns status:'invalid'", async () => {
    const manifestPath = join(dir, "bad-entry.js");
    writeManifestFile(
      manifestPath,
      `export const WEATHER_VOICE_SHARE_MANIFEST = { "is|rain_02": { voiceId: "rain_02" } };\n`
    );
    const result = await loadExistingManifest(manifestPath);
    expect(result.status).toBe("invalid");
    expect(result.error).toContain("missing a non-empty string field");
  });
});

describe("describeManifestShapeProblem", () => {
  it("returns null for a well-formed manifest object", () => {
    const problem = describeManifestShapeProblem({
      "is|rain_02": {
        voiceId: "rain_02",
        language: "is",
        mood: "unimpressed",
        text: "x",
        pageUrl: "https://eltumvedrid.is/x.html",
        imageUrl: "https://eltumvedrid.is/x.png",
      },
    });
    expect(problem).toBeNull();
  });

  it("flags null/undefined/non-object manifests", () => {
    expect(describeManifestShapeProblem(null)).toBeTruthy();
    expect(describeManifestShapeProblem(undefined)).toBeTruthy();
    expect(describeManifestShapeProblem("a string")).toBeTruthy();
  });
});

describe("detectExistingReleasedFilesWithoutManifest — Ticket 417 (#417) Round 2: missing/invalid manifest with existing exports", () => {
  it("returns false when none of the given paths exist", () => {
    expect(detectExistingReleasedFilesWithoutManifest([join(dir, "a.html"), join(dir, "a.png")])).toBe(false);
  });

  it("returns true when at least one real released file already exists on disk — the inconsistent state that must abort before any writes", () => {
    const htmlPath = join(dir, "rain_02.html");
    writeFileSync(htmlPath, "<html></html>", "utf8");
    expect(detectExistingReleasedFilesWithoutManifest([htmlPath, join(dir, "rain_02.png")])).toBe(true);
  });
});

describe("classifyEntryAction — Ticket 417 (#417) Round 2: byte-level, version-aware protection", () => {
  it("'create' when nothing exists yet at the destination path", () => {
    const action = classifyEntryAction({ destinationPath: join(dir, "new.html"), newContent: "<html>hi</html>" });
    expect(action).toBe("create");
  });

  it("'reuse' — unchanged rerun preservation: identical bytes on an ordinary regeneration are never rewritten", () => {
    const path = join(dir, "same.html");
    writeFileSync(path, "<html>same content</html>", "utf8");
    const action = classifyEntryAction({ destinationPath: path, newContent: "<html>same content</html>" });
    expect(action).toBe("reuse");
  });

  it("'mismatch' — same-version changed quote/mood (different rendered bytes) is rejected before any write", () => {
    const path = join(dir, "changed.html");
    writeFileSync(path, "<html>„Regnjakki með aðalhlutverk.“</html>", "utf8");
    const action = classifyEntryAction({ destinationPath: path, newContent: "<html>„Alveg nýr texti.“</html>" });
    expect(action).toBe("mismatch");
  });

  it("'mismatch' also catches a changed TEMPLATE/artwork even when the underlying text is unchanged — byte comparison, not a text/mood-only check", () => {
    const path = join(dir, "template-drift.html");
    writeFileSync(path, "<html><body>„Sama setning.“</body></html>", "utf8");
    // Same quote text, but the surrounding markup changed (a template
    // edit) — a text/mood-only comparison would miss this entirely.
    const action = classifyEntryAction({ destinationPath: path, newContent: "<html><body class=\"v2\">„Sama setning.“</body></html>" });
    expect(action).toBe("mismatch");
  });

  it("works identically for binary (PNG buffer) content, not just strings", () => {
    const path = join(dir, "same.png");
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
    writeFileSync(path, bytes);
    expect(classifyEntryAction({ destinationPath: path, newContent: Buffer.from(bytes) })).toBe("reuse");
    expect(classifyEntryAction({ destinationPath: path, newContent: Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 9, 9, 9]) })).toBe("mismatch");
  });
});

describe("Ticket 417 (#417) Round 2: a v1-to-v2 example retains all v1 bytes untouched", () => {
  it("classifying a v2-versioned destination path never reads or is affected by an existing v1 file's content", () => {
    const v1Dir = join(dir, "v1", "is");
    const v2Dir = join(dir, "v2", "is");
    mkdirSync(v1Dir, { recursive: true });
    mkdirSync(v2Dir, { recursive: true });

    const v1Path = join(v1Dir, "rain_02.html");
    const v1OriginalBytes = "<html>v1 released content — must never change</html>";
    writeFileSync(v1Path, v1OriginalBytes, "utf8");

    const v2Path = join(v2Dir, "rain_02.html");
    // A genuinely different v2 quote for the same voiceId/language.
    const action = classifyEntryAction({ destinationPath: v2Path, newContent: "<html>v2 completely different content</html>" });

    expect(action).toBe("create"); // v2 path doesn't exist yet — a fresh, independent artifact
    expect(readFileSync(v1Path, "utf8")).toBe(v1OriginalBytes); // v1 bytes are byte-for-byte untouched
    expect(existsSync(v2Path)).toBe(false); // classifyEntryAction never writes — that's phase 2's job
  });
});

describe("isValidPngSignature / readPngDimensions — Ticket 417 (#417) Round 2: real signature/IHDR checks, not trusting HTML metadata", () => {
  function fakePng(width, height) {
    const buf = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
    buf.writeUInt32BE(width, 16);
    buf.writeUInt32BE(height, 20);
    return buf;
  }

  it("recognizes a real PNG signature", () => {
    expect(isValidPngSignature(fakePng(1200, 630))).toBe(true);
  });

  it("rejects a buffer with the wrong signature", () => {
    expect(isValidPngSignature(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]))).toBe(false);
  });

  it("rejects a truncated buffer", () => {
    expect(isValidPngSignature(Buffer.from([0x89, 0x50]))).toBe(false);
  });

  it("reads the real width/height from the IHDR chunk", () => {
    expect(readPngDimensions(fakePng(1200, 630))).toEqual({ width: 1200, height: 630 });
  });

  it("returns null for a non-PNG buffer rather than throwing", () => {
    expect(readPngDimensions(Buffer.from("not a png"))).toBeNull();
  });
});
