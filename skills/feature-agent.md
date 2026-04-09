# Feature Agent — Best Practices (CampCast)

Use this when briefing a coding subagent to implement a feature in this repo.

---

## Before writing any code

1. **Read the target files first.** Never edit based on assumptions — read the function, match its patterns (SQL style, error handling, response shape).
2. **Identify the UI entrypoint.** Ask: does the feature need a button, link, or route to be reachable? If yes, include it in scope.
3. **Check for existing helpers.** Auth (`requireAdmin`, `getMe`), SQL (`postgres` tagged templates), i18n (`useT` + `useLanguage`) — reuse what exists, don't reinvent.

## Coding rules for this repo

- **SQL**: raw tagged template literals via `postgres` package. No ORM, no query builders.
- **Text**: never hardcode UI strings. Add keys to `src/i18n/translations.common.js` in both `en` and `is` blocks, near related keys.
- **i18n in components**: `const { lang } = useLanguage(); const t = useT(lang);` — both hooks are in `src/hooks/`.
- **Feature gating**: use `RequireFeature` / `src/config/features.js` for pro features. Admin-only features use server-side `requireAdmin` — no frontend flag needed.
- **Map**: Leaflet is lazy-loaded — never import directly.
- **Dark mode**: Tailwind v4, requires `.dark` class on `<html>`.

## API changes

- Extend existing actions via query params (e.g. `?preview=draft`) before adding new endpoints.
- Admin auth: call `requireAdmin(req, res)` and `return` immediately if it returns null (it writes the 403 itself).
- Public endpoints that gain an optional admin path: keep the public path completely unchanged — gate only the new branch.

## Security checklist

- [ ] Is sensitive data (draft existence, user emails) hidden from non-authorized clients?
- [ ] Does a 403 look identical to a 404 from the client's perspective when appropriate?
- [ ] Is the webhook endpoint free of session auth (it must be public)?
- [ ] No user-controlled input interpolated outside tagged template literals.

## What NOT to do

- Don't create new files unless unavoidable.
- Don't add error handling for impossible cases.
- Don't add backwards-compat shims.
- Don't run `git add`, `git commit`, or `git push` — the CLAUDE.md constraint governs this per session.
