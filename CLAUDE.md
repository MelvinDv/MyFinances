# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
quasar dev           # Start dev server (opens browser automatically, port 3000)

# Build
quasar build         # Production build (PWA)

# Code quality
npm run lint         # ESLint on src/
npm run format       # Prettier on JS, Vue, CSS, SCSS, HTML, MD, JSON
```

No tests are implemented (`npm test` is a no-op).

---

## What this app is

Personal finance app focused on **passive expense tracking**.
Core principle: the best expense entry is the one the user never had to make.

The main differentiator is not design — it's that expenses register themselves or
require minimum friction (Apple Pay → shortcut_queue → 1 confirmation tap).

### Subscription plans

| Feature | Free | Premium |
|---------|------|---------|
| Debit/cash accounts | 2 | Unlimited |
| Credit cards | 1 | Unlimited |
| Recurring expenses | 2 | Unlimited |
| Analytics & charts | Basic | Full |
| Custom categories | No | Yes |

Limits are validated in DB via trigger (`enforce_plan_limits`) AND in client via `usePlan.js`.
Never trust the client alone for plan limits.

---

## Architecture

**Stack:** Vue 3 + Quasar 2 (PWA) + Pinia + Supabase

The app is a single-page personal finance manager with authentication. All routes except `/login` and `/confirmacion` require auth, enforced in `src/router/index.js` via `meta.requiresAuth`.

### Boot Sequence (`quasar.config.js` → `src/boot/`)

Quasar boots in this order before mounting:
1. `i18n.js` — sets up Vue I18n (es-MX default, en-US available)
2. `pinia.js` — creates and registers the Pinia instance
3. `auth.js` — calls `authStore.initialize()` to restore session from Supabase

### Pinia Stores (`src/stores/`)

Each store maps to a Supabase table and is user-scoped:

| Store | Table | Responsibility |
|-------|-------|----------------|
| `auth.store.js` | auth (Supabase built-in) | Session, sign in/up/out, Google OAuth |
| `profile.store.js` | profiles | User plan (`free`/`premium`), tour completion |
| `accounts.store.js` | accounts | Financial accounts and balances |
| `transactions.store.js` | transactions | Income/expense entries, installment plan generation |
| `settings.store.js` | categories | User categories (seeded with defaults on first use) |
| `recurring_transactions.store.js` | recurring_transactions | Recurring payment templates |

**Stores to add (not yet implemented):**

| Store | Table | Responsibility |
|-------|-------|----------------|
| `shortcut_queue.store.js` | shortcut_queue | Pre-filled transactions from Apple Pay / Shortcuts |
| `budget_periods.store.js` | budget_periods | Monthly budget vs actual spending |

### Composables (`src/composables/`)

- `useCurrency.js` — currency formatting helpers
- `usePlan.js` — checks `profile.store` plan to gate free vs. premium features
- `useTour.js` — wraps driver.js for the onboarding tour flow

**Composables to add:**
- `useShortcutQueue.js` — polls `shortcut_queue` for pending Apple Pay transactions
- `useAnalysis.js` — queries for the analytics module (uses Supabase views)
- `useMerchantMapping.js` — suggests category based on merchant name

### Supabase Client

Single shared client at `src/lib/supabase.js`. Credentials come from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Database

See `docs/schema.sql` for the full Supabase schema (tables, RLS, triggers, views).
See `docs/migration.sql` for the migration script from the existing schema.

**Key tables:**
- `accounts` — financial accounts (debit, cash, credit card)
- `categories` — with icon, color, optional monthly budget
- `transactions` — central table: type is `'gasto'`, `'ingreso'`, `'transferencia'`
- `installment_plans` — MSI plans linked to a transaction
- `recurring_transactions` — recurring expense/income templates
- `budget_periods` — monthly budget vs actual tracking
- `merchant_mappings` — learned merchant → category mappings
- `shortcut_queue` — pre-filled transactions from Apple Pay, status: `pending`/`confirmed`/`dismissed`

**Supabase conventions:**
- All tables use `user_id uuid` for RLS (not `profile_id`)
- RLS enabled on all tables — policy: `auth.uid() = user_id`
- Transaction types in Spanish: `'gasto'`, `'ingreso'`, `'transferencia'`
- Field `category` (text) coexists with `category_id` (FK uuid) for backwards compatibility — do not remove either
- Always include `.eq('user_id', user.value.id)` in queries — do not rely on RLS alone

---

## UI & Design

### Philosophy
Extreme minimalism. Numbers are the protagonist.
- Pure white background `#ffffff`
- Large typography for numbers, weight 500
- Borders 0.5px — never thicker
- No shadows, no gradients, no decorative effects
- Color only for categories (user-assigned) and semantic states

Use Quasar components as bare as possible. Override styles via CSS variables, not Quasar utility classes. Do not use Quasar layout utility classes — use custom CSS.

### Navigation (5 tabs)
1. **Home** — horizontal swipe between "total summary" (first dot) and each account individually
2. **Accounts** — full detail list with credit bars, total net worth
3. **Transactions** — history grouped by day with type filters
4. **Analysis** — ApexCharts (horizontal bars by category, income vs expenses line)
5. **Settings** — profile, preferences, plan

Responsive behavior via `$q.screen`:
- Mobile: bottom navigation bar
- md+: icon-only sidebar
- lg+: sidebar with icons + labels

### Key component: QuickAddSheet ⚡
Bottom sheet triggered by the `+` button. 3-step flow:
1. **Type + amount** — numpad with frequent amount chips ($50/$100/$200/$500)
2. **Category** — 4-column grid, pre-selected by merchant mapping when available
3. **Save** — one tap

Slide sheet up to reveal optional fields: description, change account, change date, recurring toggle, MSI (installment plan) toggle.

When triggered from Apple Pay / shortcut_queue:
- Sheet opens automatically (via `useShortcutQueue`)
- Amount and merchant pre-filled
- "Apple Pay" badge visible
- Only category confirmation required → "Confirm" button

---

## Code Style

- No semicolons, single quotes, 100-char line width (`.prettierrc.json`)
- ESLint flat config (`eslint.config.js`) with `eslint-plugin-vue` essential rules
- Router uses **hash mode** (`/#/route`) — important for future Capacitor URL scheme: `finapp://app/#/add?amount=X&merchant=Y`
- i18n translation keys live in `src/i18n/es-MX/` and `src/i18n/en-US/`
- Never hardcode UI strings — always use i18n keys
- Never hardcode `user_id`
- Currency formatting via `useCurrency.js` with the user's profile currency

---

## Feature Roadmap

### MVP (no Swift required)
- [ ] QuickAddSheet — 3-tap expense entry
- [ ] Merchant mapping — automatic category suggestion by merchant name
- [ ] Automatic recurring transactions
- [ ] Basic URL Scheme for Shortcuts (`finapp://add?amount=X&merchant=Y`)
- [ ] Home dashboard with account swipe
- [ ] Basic analytics module
- [ ] Budget by category

### v2 — Swift Plugin (App Intents)
- [ ] Apple Pay → shortcut_queue automatic (without opening the app)
- [ ] Bank notification parsing (BBVA, Nu, Banamex)
- [ ] Home screen widget (WidgetKit)
- [ ] Quick Actions on app icon long press

### v3 — AI
- [ ] Siri — voice registration and queries
- [ ] Future expense prediction
- [ ] Intelligent weekly summary (Claude API)

---

## What NOT to do
- Do not duplicate components already in `src/components/`
- Do not hardcode user_id or UI strings
- Do not validate plan limits on the frontend only
- Do not use `position: fixed` in sheets/modals — use Quasar's `QDialog` / `QBottomSheet`
- Do not remove the `category` (text) field from transactions — it coexists with `category_id`
- Do not change hash mode to history without coordinating with the Swift plugin
- Do not use Quasar layout utility classes for custom UI — write CSS instead
