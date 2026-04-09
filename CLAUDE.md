# CLAUDE.md — CampCast

Weather forecasting web app for Icelandic campsites. Provides 7-day forecasts, campsite scoring/ranking, interactive map, and route planning. Freemium model (free/pro tier) with Paddle payments.

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

---

## Gotchas

- Leaflet map is lazy-loaded — do not import directly
- Tailwind v4 dark mode requires `.dark` class on `<html>` — not `prefers-color-scheme`
- Webhook endpoint must be public (no session auth)
- `campsites.full.json` is large — do not import directly in frontend

---

## Constraints

Git workflow:

- Always stage and commit changes after implementation
- Use descriptive commit messages referencing issue number
- Never run git push — the user always pushes manually
- Show changes as diffs only, I manage git myself
