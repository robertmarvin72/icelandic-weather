// src/config/researchQuizCsp.test.js
//
// Targeted config/security regression test for the #395 CSP change. No
// project-wide CSP existed before this ticket (audited — see
// docs/research/decision-quiz/README.md); this asserts the new header is
// scoped to exactly the one unlisted research route, restricts only
// connect-src to the exact audited Apps Script origins, and does not
// introduce a broad wildcard or touch any unrelated directive/route.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function readVercelConfig() {
  const raw = fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8");
  return JSON.parse(raw);
}

describe("vercel.json — research quiz CSP scoping", () => {
  it("defines exactly one headers rule, scoped to /research/decision-quiz", () => {
    const config = readVercelConfig();
    expect(Array.isArray(config.headers)).toBe(true);
    expect(config.headers).toHaveLength(1);
    expect(config.headers[0].source).toBe("/research/decision-quiz");
  });

  it("sets only a Content-Security-Policy header, with only a connect-src directive", () => {
    const config = readVercelConfig();
    const rule = config.headers[0];
    expect(rule.headers).toHaveLength(1);
    expect(rule.headers[0].key).toBe("Content-Security-Policy");
    expect(rule.headers[0].value.trim().startsWith("connect-src ")).toBe(true);
    // Only one directive — no default-src/script-src/unsafe-*/other directives touched.
    expect(rule.headers[0].value.split(";").length).toBe(1);
  });

  it("allow-lists only 'self' and the two exact audited Apps Script origins — no wildcard, no unrelated origin", () => {
    const config = readVercelConfig();
    const value = config.headers[0].headers[0].value;
    const sources = value.replace("connect-src", "").trim().split(/\s+/);
    expect(sources.sort()).toEqual(
      ["'self'", "https://script.google.com", "https://script.googleusercontent.com"].sort(),
    );
    expect(value).not.toMatch(/\*/);
  });
});
