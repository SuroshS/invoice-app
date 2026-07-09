# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Payvle (branded "Paivle" in some assets — see *Naming inconsistency* below) is a single-page invoicing and quoting SaaS aimed at Australian trade/small businesses (GST, ABN, QBCC licence numbers, BSB/account bank details, `en-AU` number/date formatting). Users sign up, get a 14-day free trial, add their business details, and create invoices/quotes as branded PDFs. After the trial, the app goes read-only until the user subscribes via Stripe ($12.99/mo or $49.99/yr).

Core loop: Auth (Supabase) → business Settings → CreateInvoice (form → PDF) → Invoices list (preview/download/print/convert quote→invoice) → Dashboard (revenue analytics derived client-side from invoice history).

## Tech stack

- **React 18** + **Vite 7**, plain JS/JSX (no TypeScript on the frontend)
- **react-router-dom v7** for routing
- **Supabase** (`@supabase/supabase-js`) — Postgres DB, Auth, Storage, and Deno Edge Functions
- **@react-pdf/renderer** — generates the actual invoice/quote PDF (`src/pages/InvoicePDF.jsx`)
- **pdf.js**, loaded lazily from a CDN (`cdnjs.cloudflare.com/.../pdf.js`) at runtime — rasterizes the generated PDF into `<img>` pages for in-app previews (not bundled via npm)
- **Stripe** — subscription billing, handled entirely through Supabase Edge Functions (Deno/TypeScript), never client-side
- No CSS framework, no component library, no state management library beyond React Context
- `use-places-autocomplete` is in `package.json` but currently **unused** anywhere in `src/`

## Architecture

- **Single global context** (`src/context/AppContext.jsx`) owns all app data: `settings` (business profile/config) and `invoices` (array of invoice/quote records). It is the only place that talks to the `settings`/`invoices` Supabase tables.
- **Cache-then-network**: on load, `AppContext` reads a `localStorage` cache keyed by `payvle_data_<userId>` for an instant paint, then always re-fetches from Supabase in the background and overwrites both state and cache. The cache key includes the user ID specifically so switching accounts can never leak another user's cached data.
- **Auth gating** (`src/components/AuthGate.jsx`) wraps all protected routes. It does its own independent `supabase.auth` session check (separate from `AppContext`) and renders the login/signup UI when there's no session. It also owns the "trial expired → subscribe" upgrade modal, exposed globally via `window.__payvleShowUpgradePrompt` so other pages (`Invoices.jsx`, `CreateInvoice.jsx`) can trigger it without prop drilling.
- **Optimistic auth rendering**: `AuthGate` remembers the last signed-in user's ID in `localStorage` (`payvle_last_user_id`). On next load, if the *same* user ID is present it renders the app shell immediately (avoiding a login-form flash) before the real session check resolves; a different/unknown user always sees the login form first.
- **Route-level code splitting**: `App.jsx` eagerly imports only `ResetPassword`, `Terms`, `PrivacyPolicy` (public, lightweight, reachable pre-login); `Dashboard`, `Settings`, `CreateInvoice`, `Invoices` are `React.lazy`-loaded behind `AuthGate` + `Suspense` (`fallback={null}` — each page renders its own loading state instead).
- **Layout shell** (`src/layout/Layout.jsx`) renders the sidebar/mobile nav plus the entire "Account Settings" modal (profile, subscription, danger zone) as one large component.
- **Read-only mode**: `isReadOnly = trialExpired && !subscriptionActive` (computed in `AppContext`). Pages consuming it (`Invoices.jsx`, `CreateInvoice.jsx`) intercept create/edit/convert actions and show the upgrade modal instead of navigating — view/download/print of existing records always stays allowed.
- **PDF generation is fully client-side**: `InvoicePDF.jsx` (a `@react-pdf/renderer` component) is the single source of truth for invoice/quote layout, reused for on-screen preview, download, print, and the base64 blob stored in the DB and sent through the quote→invoice conversion flow.

## Folder structure

```
src/
  App.jsx              # route table, lazy-loading boundary
  main.jsx             # ReactDOM root, wraps app in BrowserRouter + AppProvider
  context/AppContext.jsx  # global data store, all Supabase reads/writes for settings+invoices
  lib/supabase.js      # single supabase client instance
  components/
    AuthGate.jsx        # login/signup/forgot-password + upgrade modal
    PolicyPage.jsx       # shared layout for Terms/Privacy pages
    InvoicePreview.jsx    # EMPTY / unused file (see Known technical debt)
  layout/Layout.jsx     # sidebar/topbar/mobile-nav shell + account settings modal
  pages/
    Dashboard.jsx        # revenue analytics, computed client-side via useMemo over `invoices`
    Invoices.jsx          # list/filter/search/preview/delete/convert
    CreateInvoice.jsx      # create + edit form for both Invoice and Quote types
    InvoicePDF.jsx           # @react-pdf/renderer document definition (shared PDF template)
    Settings.jsx            # business profile, bank details, terms, logo upload
    ResetPassword.jsx        # handles Supabase password-recovery redirect links
    Terms.jsx / PrivacyPolicy.jsx  # static legal pages, public routes
  assets/               # logo images (multiple variants: black/white/transparent bg)
supabase/
  config.toml           # local Supabase CLI config; only Edge Functions are declared here
  functions/
    create-checkout-session/   # starts a Stripe Checkout session for the authenticated user
    create-portal-session/     # opens the Stripe billing portal for the authenticated user
    stripe-webhook/             # sole writer of settings.data.subscriptionActive
  .temp/                # Supabase CLI local link metadata (not meaningful source)
```

Note: there is **no `supabase/migrations/`** directory — the Postgres schema is not version-controlled in this repo (see Known technical debt).

## Database overview

Two Postgres tables, both schema-light (JSONB blob + `user_id`):

- **`settings`** — one row per user (`user_id` unique, upserted with `onConflict: "user_id"`). The `data` JSONB column holds *everything*: business profile (`businessName`, `abn`, `qbcc`, `address`), bank details (`bankName`, `bsb`, `accountNumber`), branding (`logoUrl`), numbering counters (`invoicePrefix`/`nextInvoiceNumber`, `quotePrefix`/`nextQuoteNumber`), per-type terms (`invoiceTerms`, `quoteTerms`), terms-acceptance record (`termsAcceptedAt`, `policyVersions`), and billing state (`subscriptionActive`, `subscriptionStatus`, `stripeCustomerId`, `subscriptionUpdatedAt`).
- **`invoices`** — one row per invoice/quote (`id`, `user_id`, `data` JSONB, `created_at`). `data` holds the full invoice/quote record including `type` (`"Invoice"` | `"Quote"`), line `items`, computed `total`/`subtotal`/`gst`, and — when saved — a base64-encoded PDF snapshot (`pdfBase64`). Quote→invoice conversion links records both ways via `convertedFromQuoteId`/`convertedFromQuoteNumber` and `convertedToInvoiceId`/`convertedToInvoiceNumber` stored inside `data`.
- **Storage bucket `logos`** — user-uploaded logo images at `<userId>/logo.<ext>`, served via `getPublicUrl` (public bucket).
- Queries only ever fetch the newest 50 invoices (`.order("created_at", { ascending: false }).limit(50)`) — older records exist in the DB but the app never loads them into `AppContext`.
- `subscriptionActive` is written **only** by `stripe-webhook` (via the Supabase service-role key) — the frontend only ever reads it. Never set this flag from client code.
- Because the schema lives only in the hosted Supabase project (not in this repo), always ask before assuming a column/field exists — verify against `AppContext.jsx`'s read/write shape or by checking the live project.

## Authentication flow

- Supabase email/password auth (`supabase.auth.signUp` / `signInWithPassword` / `resetPasswordForEmail` / `onAuthStateChange`), all driven from `AuthGate.jsx`.
- Sign-up requires checking a Terms & Privacy checkbox; on success the app immediately upserts a `settings` row recording `termsAcceptedAt` and `policyVersions: { terms: CURRENT_TERMS_VERSION, privacy: CURRENT_PRIVACY_VERSION }` (both currently `"1.0"`, defined at the top of `AuthGate.jsx`) — bump these constants if the legal text changes materially.
- Trial length is a client-side constant (`TRIAL_DAYS = 14` in `AppContext.jsx`), computed from `user.created_at` — there is no server-side trial enforcement beyond the UI's `isReadOnly` gate and whatever RLS policies exist on the live DB.
- Password reset: `resetPasswordForEmail` → emailed link → `/reset-password` (public route) → `ResetPassword.jsx` listens for the `PASSWORD_RECOVERY` auth event before allowing a new password to be set.
- Email/password changes happen from the Account Settings modal in `Layout.jsx`: email change re-authenticates with the current password first, then calls `supabase.auth.updateUser({ email })`; password change just re-sends a reset email (there is no "enter new password inline" flow).
- Subscription checkout/portal calls attach the user's current `session.access_token` as a Bearer token to the Edge Functions, which independently verify it by calling Supabase's `/auth/v1/user` REST endpoint (functions are deployed with `verify_jwt = false` and do their own manual verification instead).

## Coding standards / conventions

- Functional components + hooks only, no class components, no external state manager (Context + local `useState` throughout).
- **Styling is CSS-in-JS via template literal strings** injected per-file with `<style>{css}</style>` — there are no CSS Modules, no styled-components, no Tailwind. Each file/feature has its own class-name prefix to avoid collisions (`.dash-*` Dashboard, `.inv-*` Invoices, `.ci-*` CreateInvoice, `.sett-*` Settings, `.acct-*`/`.app-*` Layout, `.auth-*`/`.upgrade-*` AuthGate, `.policy-*` PolicyPage). Follow this prefix pattern for any new page/component rather than introducing a new styling approach.
- `src/index.css`/`src/App.css` are leftover Vite template boilerplate — they are not the actual styling system and mostly get overridden by component-level styles.
- Small helper subcomponents are defined inline at the bottom of the file that uses them rather than extracted (e.g. `Field` in `Settings.jsx`, `AutoTextarea` in `CreateInvoice.jsx`, `UpgradePromptController`/`UpgradePromptBridge` in `AuthGate.jsx`). Match this pattern for page-local helpers; only promote something to `src/components/` if it's genuinely reused across pages.
- File naming: PascalCase for components/pages (`CreateInvoice.jsx`), camelCase for libs/utilities (`supabase.js`).
- Comments are sparse and reserved for explaining *why* (business rules, ordering constraints, non-obvious trade-offs) — e.g. the cache-key-per-user comment in `AppContext.jsx`, or the "conversion is a dedicated action, not a type edit" comment in `CreateInvoice.jsx`. Match this style: don't add comments that restate what the code does.
- All money/date formatting goes through local `fmt`/`fmtShort`/`formatDate` helpers using `en-AU` locale — reuse these rather than reformatting inline when touching a page that already has them.

## UI/UX principles

- Dark sidebar (`#111`) + light content area (`#f7f7f7`) with white cards (`#fff`, 1px `#ebebeb` border, ~12px radius) — this palette is consistent across every page.
- Every page is responsive with its own `@media (max-width: 768px)` / `640px` block rather than a shared responsive utility; mobile nav becomes a bottom tab bar + slide-up sheet (see `.app-mobile-*`/`.app-sheet-*` in `Layout.jsx`), desktop nav is the sidebar.
- Loading states are per-page skeletons/spinners rather than a global spinner (this is why `Suspense fallback={null}` in `App.jsx` is intentional — a global fallback would double up with the page's own loading UI).
- Destructive actions (delete invoice, delete data, delete account) go through a confirm modal pattern (`.confirm-overlay`/`.confirm-modal` or `.mini-overlay`/`.mini-modal`) — reuse these class names for new destructive flows rather than `window.confirm`.
- Toasts (`Layout.jsx`'s `showToast`) are used for transient success/status messages in the account modal; inline `.{prefix}-error`/`.{prefix}-success` banners are used for in-form validation feedback elsewhere.

## Performance guidelines

- Protected pages are lazy-loaded (see Architecture) — keep new authenticated pages behind `React.lazy` in `App.jsx` rather than eager imports.
- `pdf.js` is loaded from a CDN on first use (`loadPdfJs()`, duplicated in both `Invoices.jsx` and `CreateInvoice.jsx`) instead of bundled, to avoid it in the main bundle — don't switch this to an npm import without checking bundle size impact.
- `writeCache` in `AppContext.jsx` deliberately strips `pdfBase64` blobs before writing to `localStorage` to avoid hitting storage quota; if you add other large fields to invoice records, strip them here too.
- Invoice list queries are capped at 50 rows — if you need "load more" or full history, that's new work, not something already wired up.
- Dashboard analytics (`Dashboard.jsx`) recompute via `useMemo` over the in-memory `invoices` array — fine at current scale (≤50 loaded records) but will not reflect anything beyond what's been fetched.

## Security guidelines

- ⚠️ **`.env`'s `VITE_SUPABASE_ANON_KEY` currently decodes to a Supabase `service_role` JWT, not an anon key.** Because it's `VITE_`-prefixed, Vite inlines it into the client bundle, meaning the service-role key (which bypasses Row Level Security) is shipped to every browser. Do not treat this as a normal anon key, do not copy this pattern elsewhere, and flag/fix this before writing security-sensitive code against `src/lib/supabase.js` — the fix is to replace it with the project's actual `anon`/`public` key and ensure RLS policies on `settings`/`invoices`/the `logos` bucket correctly scope rows to `auth.uid()`.
- The real Supabase **service role key** is (correctly) only used server-side, inside the Deno Edge Functions (`stripe-webhook`, `create-checkout-session`, `create-portal-session`) via `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` — never expose it to the frontend.
- Stripe secret keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs) live only in Supabase Edge Function secrets, never in frontend code or `.env`.
- Edge functions are deployed with `verify_jwt = false` and instead manually validate the caller's bearer token against `/auth/v1/user` — if you add a new Edge Function that should be user-authenticated, follow this same manual-verification pattern (or explicitly decide it should be public, like the webhook).
- `stripe-webhook` verifies Stripe's signature via `stripe.webhooks.constructEventAsync` before trusting any event payload — never remove or weaken that check.
- Client-side Supabase calls filter by `user_id` (e.g. `.eq("user_id", userId)`) but this is not a substitute for RLS — assume (and verify against the live project) that Postgres RLS is the actual enforcement boundary, not the client-side filters.

## Development workflow

- No CI configuration exists in this repo.
- Deployed to Netlify (`public/_redirects` does the SPA fallback `/* /index.html 200`); Edge Functions/Stripe code references both `payvle.com.au` and an `invoicehelp.netlify.app` origin as fallbacks — check both when changing redirect/origin logic.
- Supabase Edge Functions are deployed independently of the frontend build via the Supabase CLI (see Common commands) — a frontend PR touching billing logic is not complete until the corresponding function is deployed and its secrets are set.

## Testing checklist

There is **no automated test suite** in this repo (no test runner/framework configured, no `*.test.*` files). Before shipping a change, manually verify the relevant paths:

- [ ] Sign up (with/without accepting terms), email confirmation, sign in, sign out, forgot/reset password
- [ ] Returning-user optimistic render (no login flash) vs. a genuinely new/different user (must see login first)
- [ ] Trial countdown badge and `isReadOnly` gating once trial is expired (create/edit/convert blocked + upgrade modal; view/download/print still allowed)
- [ ] Create, edit, and save both an Invoice and a Quote; verify sequential numbering (`nextInvoiceNumber`/`nextQuoteNumber`) increments correctly and independently
- [ ] Quote → Invoice conversion: original quote is preserved and linked, new invoice gets its own number
- [ ] PDF preview, download, and print for both document types, including multi-line item descriptions
- [ ] Settings: business info, bank details, per-type terms, logo upload/replace
- [ ] Stripe checkout (monthly + yearly) and billing portal round-trip, and webhook-driven `subscriptionActive` flips
- [ ] Responsive layouts at the breakpoints used across the app (420px, 640px, 768px, 1100px)
- [ ] Delete invoice (real) vs. Delete data / Delete account in the Danger Zone (currently UI-only stubs — see Known technical debt; don't assume they work end-to-end)

## Things to never change without permission

- The `settings`/`invoices` JSONB shape consumed by `AppContext.jsx` — it's read by the frontend, written by three separate Edge Functions, and cached in users' `localStorage`; an incompatible shape change can break existing cached sessions and the Stripe webhook simultaneously.
- Invoice/quote numbering logic (`nextInvoiceNumber`/`nextQuoteNumber` increments in `AppContext.jsx`) — these are sequential business-facing numbers; gaps or collisions have real accounting consequences for users.
- `subscriptionActive`/`subscriptionStatus`/`stripeCustomerId` — these are only ever meant to be written by `stripe-webhook`; don't add a frontend code path that sets them directly.
- Stripe price IDs, webhook event handling, or signature verification in `supabase/functions/` without testing against Stripe test mode first.
- `CURRENT_TERMS_VERSION`/`CURRENT_PRIVACY_VERSION` in `AuthGate.jsx` — only bump these in lockstep with an actual legal-text change, since they're recorded against each user's acceptance record.
- The Supabase keys in `.env` — given the service-role-key issue above, rotating/regenerating keys is a coordinated, user-facing action (it can invalidate live sessions/API access), not something to do unilaterally while investigating.

## Common commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # eslint over the whole repo
npm run preview   # preview the production build locally

# Supabase Edge Functions (from supabase/functions/<name>/index.ts comments)
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session --no-verify-jwt
supabase functions deploy stripe-webhook
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Project-specific conventions

- Australian market specifics throughout: GST (10%, `gstRate: 0.1`), ABN, QBCC licence field, BSB + account number bank fields, `en-AU` locale formatting for currency and dates.
- **Naming inconsistency**: the product is referred to as both "Paivle" (e.g. `paivleblack.png`, page titles like "Welcome to Paivle") and "Payvle" (e.g. `payvle.com.au`, `support@payvle.com.au`, `payvle_upgrade_prompt_shown`, `window.__payvleShowUpgradePrompt`) roughly evenly across the codebase. Confirm the canonical name with the user before introducing more of either spelling.
- The upgrade/subscribe modal is triggered globally via `window.__payvleShowUpgradePrompt` (set up in `AuthGate.jsx`'s `UpgradePromptBridge`) rather than through props/context — an intentional escape hatch so any deeply-nested page can trigger it; follow the same pattern if you need to trigger it from a new page instead of threading it through props.
- `_id` (Supabase row id) is distinct from the invoice's human-facing `invoiceNumber` — always key operations (`deleteInvoice`, `updateInvoice`, linking conversions) off `_id`, never off `invoiceNumber`.

## Known technical debt

- **Critical security issue**: `.env`'s `VITE_SUPABASE_ANON_KEY` is a `service_role` key, not an anon key (see Security guidelines) — this ships elevated DB privileges to every client.
- `src/components/InvoicePreview.jsx` is an empty file (0 bytes) — dead/unused, not wired into any route or import.
- "Delete all data" and "Delete account" in the Account Settings danger zone (`Layout.jsx`) are UI-only: clicking through just shows a toast (`"All data deleted"`) or signs the user out — neither actually deletes anything server-side. Any user hitting these today gets a false confirmation.
- "Report a bug" in the Help submenu just shows a `"Bug report coming soon"` toast.
- The subscription renewal date shown in the Account Settings modal (`Layout.jsx`, `"Renews 8 July 2027"`) is a hardcoded string, not derived from the actual Stripe subscription — will be wrong for every user.
- `use-places-autocomplete` is an installed dependency with zero usages in `src/` — either wire it into the address fields (`billToAddress`/business `address`) or remove it.
- No `supabase/migrations/` — the Postgres schema (tables, RLS policies, storage bucket policies) exists only in the live hosted project, not in version control, so schema drift/rollback isn't tracked here.
- `CreateInvoice.jsx` (~930 lines) and `Layout.jsx` (~790 lines) are large monoliths mixing styles, markup, and logic in one file; expect to read the whole file when working in either.
- `loadPdfJs()` (the CDN-script-loader for pdf.js) is duplicated verbatim in both `Invoices.jsx` and `CreateInvoice.jsx` rather than shared.
- No automated tests of any kind.

## Future roadmap (inferred from stubs/comments, not confirmed)

- Real account/data deletion backing the existing Danger Zone UI.
- In-app bug reporting (currently a placeholder toast).
- Possibly Google Places address autocomplete on client address fields, given the unused `use-places-autocomplete` dependency.
- Loading/paginating beyond the current 50-most-recent-invoices cap, if usage grows.
