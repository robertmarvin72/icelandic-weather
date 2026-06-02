# AGENTS.md — Eltum Veðrið

Decision-first weather tool for campers, caravan owners and RV users in Iceland. Helps users decide whether to stay or move by comparing nearby campsite weather.

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

- Email-only login → `/api/login-email` creates user + session
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

### InstantComparison

Homepage component that compares current campsite against best nearby alternative.
- Candidates must be within active radiusKm (default 50 km) — no fallback to distant sites
- Uses haversine distance calculation, not top5 leaderboard directly
- Shows stay-positive state when no qualifying nearby candidate exists
- Selection logic lives in selectBestCandidate() inside InstantComparison.jsx
- Do NOT use top5[0] directly — it may be outside the active radius

### Analytics

- Analytics helper: `src/lib/analytics.js` (GA4 via react-ga4)
- Plausible has been fully removed — do not reintroduce
- Checkout source attribution: `src/lib/checkoutSource.js`
- Source persists via sessionStorage key: `"checkout_source"`
- TODO exists in checkoutSource.js for Paddle success_url source propagation
- Core homepage funnel: `homepage_loaded`, `homepage_hero_cta_click`, `comparison_viewed`, `better_nearby_found`, `stay_recommended`, `move_recommended`
- Core monetization funnel: `pricing_page_viewed`, `subscription_cta_clicked`, `checkout_started`, `checkout_completed`

### Blog — Bilingual

- IS posts served at `/blog/:slug`
- EN posts served at `/en/blog/:slug`
- Both language rows share `translation_group_id`
- `language=NULL` treated as `"is"` via `coalesce(language,'is')`
- Generation creates IS + EN rows with shared UUID
- EN generation failure is graceful — IS row always saved
- UI labels must use translation keys — never hardcode Icelandic strings in blog template

---

## UX Guardrails

Prioritize:
- hero clarity
- nearby comparison
- recommendation confidence
- emotional clarity
- mobile readability

Avoid:
- dashboard-like layouts
- excessive controls above the fold
- cluttered first-screen experiences
- overly technical weather terminology

---

## Copy Tone

Prefer emotional and comfort-oriented wording over technical terminology.

Prefer:
- "Rólegra"
- "Þurrara"
- "Hlýrra"

Avoid:
- "Minni vindur"

Users care more about practical comfort and decision-making than raw weather metrics.

---

## Analytics Conventions

Analytics events should:
- use snake_case
- avoid PII
- include lightweight metadata only
- avoid duplicate firing caused by rerenders/effects

Core homepage funnel:
- `homepage_loaded`
- `homepage_hero_cta_click`
- `comparison_viewed`
- `better_nearby_found`
- `stay_recommended`
- `move_recommended`

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
| `/api/paddle-webhook`              | POST     | signature      | Payment event handler                       |
| `/api/admin`                       | GET/POST | admin email    | Admin operations                            |
| `/api/blog-meta`                   | GET      | —              | OG meta injection for blog posts            |
| `/api/cron/generate-blog-draft`    | POST     | CRON_SECRET    | Weekly automated blog draft                 |

---

## Database Schema (Neon PostgreSQL)

```sql
app_user          -- id, email, tier, display_name, paddle_customer_id, created_at
user_session      -- id, user_id, token_hash, expires_at, revoked_at
user_subscription -- id, user_id, status, current_period_end, paddle_subscription_id, ...
blog_posts        -- id, slug, title, excerpt, content, meta_title, meta_description, cover_image, cta_hint, status, published_at, source_type, topic, cta_title, cta_text, cta_button, cta_target, nearby_highlights, nearby_attractions, created_at, updated_at
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

# Google Analytics 4 (frontend, must be prefixed VITE_)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# OpenAI (blog generation)
OPENAI_API_KEY=sk-proj-...

# Multi-domain support
ALLOWED_ORIGINS=https://campcast.is,https://www.campcast.is,https://eltumvedrid.is,https://www.eltumvedrid.is

# Cron job
CRON_SECRET=...
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

- `Codex --model haiku` git commits require a TTY — does not work non-interactively. Run `git add` + `git commit` manually or inside an active Codex session.
