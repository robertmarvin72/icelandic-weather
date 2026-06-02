# CLAUDE.md — CampCast

Weather forecasting web app for Icelandic campsites. Provides 7-day forecasts, campsite scoring/ranking, interactive map, and route planning. Freemium model (free/pro tier) with Paddle payments.

---

## Dev Setup

```bash
npm install
npx playwright install chromium
gh auth login  # required for issue lookup
```

---

## Architecture

```
icelandic-weather/
├── api/                  # Vercel serverless functions (Node.js)
│   └── _lib/             # Shared utilities (auth, Paddle)
├── src/
│   ├── components/       # React UI components
│   ├── config/           # Feature flags, pricing, hazards
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # EN/IS translations
│   ├── lib/              # Core logic (scoring, routing, caching)
│   ├── pages/            # Full-page route components
│   └── utils/            # Pure utility functions
├── server_data/          # Static JSON campsite data (free/pro tiers)
├── scripts/              # Data import scripts (OSM)
└── public/               # Static assets, PWA manifest
```

---

## Tech Stack

**Frontend:**

- React 19 + Vite 7
- Tailwind CSS v4 (dark mode via `.dark` class)
- React Router v7
- Leaflet + react-leaflet (lazy-loaded map)
- Framer Motion (animations)
- Sentry (error tracking)

**Backend:**

- Vercel Serverless Functions (Node.js)
- PostgreSQL via Neon (raw SQL with `postgres` npm package, no ORM)
- Paddle (payments + subscriptions)
- Open-Meteo API (weather data)

**Testing & Tooling:**

- Vitest + @testing-library/react
- ESLint (flat config) + Prettier
- Vercel PWA Plugin + Workbox

---

## Key Concepts

### Campsite Tiers

- `server_data/campsites.limited.json` — free tier sites
- `server_data/campsites.full.json` — all sites (Pro)
- `/api/campsites` returns the appropriate list based on session

### Weather Scoring (`src/lib/scoring.js`)

Each campsite gets a numeric score from: temperature, wind penalty, rain penalty, season weighting. Used by `useLeaderboardScores` to rank the Top 5 sites.

### Feature Gating (`src/config/features.js`)

Centralized free/pro feature definitions. `RequireFeature` component wraps gated UI. Pro features: wind direction, shelter index, advanced route planning, full campsite list.

### Authentication

- Email-only login → `/api/login` creates user + session
- Session token (SHA256 hash) stored in `cc_session` cookie (30-day)
- Tables: `app_user`, `user_session`, `user_subscription`

### Payments (Paddle)

- `/api/checkout` creates Paddle transaction, returns checkout URL
- `/api/paddle-webhook` handles `transaction.completed`, `subscription.updated`, `customer.created`
- Webhook verified via HMAC-SHA256 (`api/_lib/paddle/verify.js`)

### Internationalization

- Languages: English (`en`) and Icelandic (`is`)
- Translations split across `src/i18n/translations*.js`
- `useT()` hook returns translation function

### Route Planner

- Pro feature — multi-day weather-based site relocation
- Core logic in `src/lib/relocationEngine.js` and `relocationService.js`
- Narrative generation in `routePlannerNarrative.js`

---

## UX Philosophy — Decision First

Eltum Veðrið is not a generic weather dashboard.

The primary UX goal is:
Help campers quickly decide whether they should stay or move.

Homepage hierarchy should prioritize:
1. Decision clarity
2. Nearby comparison
3. Recommendation confidence
4. Detailed forecast data
5. Advanced controls/settings

### Core UX Principles

- Show the recommendation before the raw data
- Show comparisons before detailed tables
- Avoid a "control panel" feeling above the fold
- Use progressive disclosure for advanced settings
- Primary first action must be obvious within 3-5 seconds
- Hero sections should communicate emotional outcome, not technical forecasting
- Nearby weather differences are the key product insight
- Mobile-first readability is more important than data density

### Homepage Rules

The homepage should prioritize:
- Hero message
- Primary CTA
- Stay/move recommendation
- Instant nearby comparison

The homepage should de-emphasize:
- Utility controls
- Advanced sliders
- Debug/scoring-style controls
- Secondary settings

### Brochure / Landing Pages

Brochure and landing pages should:
- explain the product within 3–5 seconds
- prioritize emotional clarity over feature density
- use nearby comparison as the primary storytelling mechanism
- avoid dashboard-like layouts
- focus on practical camping outcomes and comfort

### Instant Comparison

InstantComparison exists to create an immediate "aha moment".

Goals:
- Compare current campsite vs nearby option visually
- Explain why a nearby option is better
- Use understandable metrics such as wind, rain and temperature
- Avoid overconfident recommendations when differences are weak or mixed
- Use softer language for weak improvements

#### Radius Rule
InstantComparison must ONLY compare campsites within the active Route Planner radius.
Never fall back to distant "best overall" campsites when no nearby option exists.
If no candidate exists within radius → show stay-positive state.

### Distance Display

Distance values use geographic/haversine distance, not driving distance.
UI wording should communicate approximate straight-line distance:

- IS: `~25 km í beinni línu`
- EN: `~25 km in a straight line`

Do not present haversine distance as exact driving distance.

### Progressive Disclosure

Advanced controls should:
- Default collapsed
- Be discoverable but not dominant
- Never compete visually with the main recommendation

Examples:
- Route planner sliders
- Utility/settings controls
- Experimental/debug controls

### Analytics Priorities

Homepage optimization should prioritize:
- engagement time
- CTA interaction
- scroll depth
- comparison interaction
- return visits

Key events:
- `homepage_hero_cta_click`
- `homepage_instant_comparison_cta_click`

#### Analytics Conventions

Analytics events should:
- use snake_case
- avoid personally identifiable information
- include lightweight metadata only
- avoid duplicate firing caused by rerenders/effects

Primary homepage funnel:
- `homepage_loaded`
- `homepage_hero_cta_click`
- `comparison_viewed`
- `better_nearby_found`
- `stay_recommended`
- `move_recommended`

Primary monetization funnel:
- `pricing_page_viewed`
- `subscription_cta_clicked`
- `checkout_started`
- `checkout_completed`

### Tone

User-facing copy should:
- sound human
- avoid generic weather-app language
- focus on practical camping decisions
- avoid overwhelming technical terminology

### Semantic Weather Labels

Prefer emotional and comfort-oriented wording over technical terminology.

Prefer:
- "Rólegra"
- "Þurrara"
- "Hlýrra"

Avoid overly technical labels such as:
- "Minni vindur"

Users care about comfort and practical camping experience, not raw metrics alone.

### Analytics — Plausible Removed

Plausible has been fully removed. Do not reintroduce `window.plausible` calls.
All event tracking goes through `trackEvent()` in `src/lib/analytics.js` → GA4.

### Blog — Bilingual Support

Generated blog posts create two rows (IS + EN) with shared `translation_group_id`.
UI labels must use translation keys — never hardcode Icelandic strings in blog template.
Post language determines UI chrome language, not global localStorage lang alone.
`/blog/:slug` serves IS, `/en/blog/:slug` serves EN.
`coalesce(language,'is')` pattern ensures existing NULL posts remain readable.

---

## API Routes

| Route                 | Method   | Auth           | Purpose                         |
| --------------------- | -------- | -------------- | ------------------------------- |
| `/api/forecast`       | GET      | —              | 7-day weather from Open-Meteo   |
| `/api/campsites`      | GET      | session cookie | Site list (tier-filtered)       |
| `/api/login`          | POST     | —              | Create/find user, issue session |
| `/api/logout`         | POST     | session cookie | Revoke session                  |
| `/api/me`             | GET      | session cookie | Current user profile            |
| `/api/checkout`       | POST     | session cookie | Initiate Paddle payment         |
| `/api/billing-portal` | GET      | session cookie | Paddle customer portal link     |
| `/api/paddle-webhook` | POST     | signature      | Payment event handler           |
| `/api/users`          | GET      | admin email    | List users (admin)              |
| `/api/db-health`      | GET      | —              | Database health check           |
| `/api/admin`          | GET/POST | admin email    | Admin operations                |

---

## Database Schema (Neon PostgreSQL)

```sql
app_user          -- id, email, tier, display_name, paddle_customer_id, created_at
user_session      -- id, user_id, token_hash, expires_at, revoked_at
user_subscription -- id, user_id, status, current_period_end, paddle_subscription_id, ...
blog_posts        -- blog content managed via admin panel
```

No ORM — all queries use tagged template literals via the `postgres` package.

---

## Environment Variables

```bash
# Database (Neon)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Paddle
PADDLE_API_KEY=sk_...
PADDLE_ENV=production
PADDLE_WEBHOOK_SECRET=webhk_...
PADDLE_PRICE_ID_MONTHLY=pri_...
PADDLE_PRICE_ID_YEARLY=pri_...

# App
APP_URL=https://campcast.is
PAY_URL=https://pay.campcast.is
ADMIN_EMAILS=robert@...

# Sentry (frontend, must be prefixed VITE_)
VITE_SENTRY_DSN=https://...
VITE_SENTRY_TRACES_SAMPLE_RATE=0.05

# OpenAI (blog generation)
OPENAI_API_KEY=sk-proj-...
```

---

## Development

```bash
npm install
npm run dev       # Vite dev server + Vercel dev (API proxy)
npm test          # Vitest (watch mode)
npm run build     # Production build to dist/
npm run lint      # ESLint
```

Unit tests live alongside their modules as `*.test.js` files (e.g. `src/lib/scoring.test.js`). Test coverage is configured for `src/utils/**/*.js`.

Vite proxies `/api/forecast` → Open-Meteo and `/api/*` → Vercel dev server during development.

Deployment is via Vercel Git integration — push to `main` deploys automatically.

---

## Conventions

- Raw SQL only — no ORM, use `postgres` tagged templates
- Components in PascalCase, hooks prefixed with `use`
- Feature gating always through `RequireFeature` / `features.js`
- Translations always in `i18n/` — never hardcode text in components
- Before implementing: ask 'does the user have a UI entrypoint to reach this feature?'
- If a bug fix reveals an adjacent UX gap, fix it in the same commit if < 25 lines — note it in the commit message
- Cross-reference related issue numbers in commit messages when two fixes address the same root cause

---

## Gotchas

- Leaflet map is lazy-loaded — do not import directly
- Tailwind v4 dark mode requires `.dark` class on `<html>` — not `prefers-color-scheme`
- Webhook endpoint must be public (no session auth)
- `campsites.full.json` is large — do not import directly in frontend
- When writing Playwright stubs, match the hook's response parsing contract — not the raw endpoint shape. Check the hook source before stubbing.

---

## Project Rules

- This project uses .jsx not .tsx — never create .tsx files
- Never use TypeScript type annotations in any file
- Never use explicit file extensions in imports
- Routes must be registered in AppRoutes.jsx when adding a new page
- Keep everything client-side, no backend, no new libraries
- Follow existing file and component patterns before introducing anything new

---

## Constraints

Git workflow:

- Always stage and commit changes after implementation
- Use descriptive commit messages referencing issue number
- Never run git push — the user always pushes manually
- Show changes as diffs only, I manage git myself

Subagent git ops:

- `claude --model haiku` git commits require a TTY — does not work non-interactively. Run `git add` + `git commit` manually or inside an active Claude Code session.

---

## Branding — CampCast → Eltum Veðrið / Chase the Weather

Rebranding is in progress. Both domains are live simultaneously.

### Active domains
- campcast.is — still live, do not redirect
- eltumvedrid.is — new domain, fully supported

### Logo assets
Language and dark mode aware. Pattern:
- IS + light → /eltumvedrid-light-is.png
- IS + dark  → /eltumvedrid-dark-is.png
- EN + light → /chasetheweather-light-en.png
- EN + dark  → /chasetheweather-dark-en.png

Default language is "is". Stored in localStorage key "lang".

### Brand name in UI
- lang === "is" → "Eltum Veðrið"
- lang === "en" → "Chase the Weather"
- Never use "CampCast" in new user-facing IS/EN strings

### Translation files
- src/i18n/translations.common.js — main app
- src/i18n/translations.landing.js — landing page only

### Do not change
- campcast-light.png / campcast-dark.png — legacy, still referenced in some places
- logo.png — legacy
- Any string containing "formerly CampCast"
