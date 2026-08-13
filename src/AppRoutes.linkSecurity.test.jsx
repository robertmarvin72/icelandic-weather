import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";

// #217 — regression test for GHSA-wrjc-x8rr-h8h6 ("Open redirect via backslash in
// <Link> and useNavigate"), fixed upstream in react-router-dom 7.18.0.
//
// Before 7.18.0, react-router did not recognize a backslash-prefixed `to` value as
// an absolute/external URL — it resolved it as an ordinary internal path instead,
// prefixing it with "/" (verified empirically against the installed 7.12.0: the
// same case below rendered href="/\\evil.com"). That made a backslash-led target
// look like a same-origin internal route rather than what it actually is once a
// browser parses the URL: backslashes are normalized to "/", so "\\evil.com" is
// equivalent to "//evil.com" — a protocol-relative link to a different origin.
//
// This guards against a regression back to that pre-7.18.0 resolution: if a future
// dependency change ever reintroduces the "/"-prefixed internal-path resolution for
// a backslash-led `to`, this test goes red.
describe("react-router <Link> — backslash `to` resolution (GHSA-wrjc-x8rr-h8h6 regression)", () => {
  it("a backslash-prefixed `to` is resolved as absolute/protocol-relative, not as an internal path", () => {
    render(
      <MemoryRouter>
        <Link to="\\evil.com">go</Link>
      </MemoryRouter>
    );
    const href = screen.getByText("go").getAttribute("href");
    // Patched (>=7.18.0, verified against the installed react-router-dom@7.18.2):
    // no "/" prefix is added — the value is passed through as an absolute/
    // protocol-relative target instead of being folded into an internal path.
    expect(href).toBe("\\\\evil.com");
    expect(href.startsWith("/")).toBe(false);
  });
});
