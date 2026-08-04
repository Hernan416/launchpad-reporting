# SOP — Launchpad AI Reporting System

**Read this before touching anything.** This app has a small codebase but a *lot*
of hard-won, non-obvious business logic baked into `config/clients.ts` and
`lib/ghl.ts`. Almost every weird-looking line of code or comment in this repo
exists because something was silently wrong in production and got debugged
against real client data. Don't "clean up" a comment or a stage-name array
without reading why it's there first.

---

## 1. What this is

A multi-tenant reporting dashboard for **Launchpad AI**, showing Meta Ads +
GoHighLevel (GHL) performance data to roofing/home-services clients. One
master login sees every client; each client login sees only their own
7-day/30-day report.

Current clients (see `config/clients.ts`):

| Slug | Name | Dashboard type |
|---|---|---|
| `excel-roofing` | Excel Roofing | Custom GHL-only funnel (no Meta Ads section) |
| `one-day-roofing` | One Day Roofing | Standard (Meta Ads + GHL) |
| `us-home-pro` | US Home Pro | Standard (Meta Ads + GHL) |
| `jj-roofing` | JJ Roofing | Standard (Meta Ads + GHL) |

## 2. Tech stack & non-negotiable constraints

- **Next.js 16 (App Router)**, TypeScript, Tailwind v4, deployed on Vercel.
- **No database.** This is deliberate, not a shortcut — everything is either
  a static config file in the repo (`config/clients.ts`), an env var
  (secrets), or fetched live from Meta/GHL on every request (with Next's
  `fetch` `revalidate: 3600` cache doing the "don't hammer the API" job a DB
  would otherwise do). If you're tempted to add a DB to "cache" or "store"
  something, stop and ask first — it's a project-level decision, not a code
  review nit.
- **AGENTS.md at repo root says this Next.js version has training-data-breaking
  changes.** Two concrete ones you'll hit immediately: `middleware.ts` is now
  `proxy.ts`, and `error.tsx`'s retry callback is `unstable_retry()`, not
  `reset()`. Check `node_modules/next/dist/docs/` before assuming your Next.js
  knowledge is current.
- **Server Components stream via Suspense.** Every dashboard page kicks off
  its data-fetching promises *without awaiting them* at the top of the page,
  then passes each promise to a separate async Server Component wrapped in
  its own `<Suspense>` — that's why the "cards" section of a dashboard often
  appears before the "charts" section finishes loading. See
  `app/dashboard/[clientSlug]/page.tsx`.

## 3. Repo map

```
app/
  login/page.tsx                    Login form (username + password)
  page.tsx                          "/" — redirects by role (master → /dashboard, client → /dashboard/<slug>)
  dashboard/page.tsx                Master-only "all clients" list
  dashboard/[clientSlug]/page.tsx   The actual report — branches on client.showMetaAds
  api/auth/[...nextauth]/route.ts   NextAuth handler
proxy.ts                            Route protection (was middleware.ts pre-Next-16)
config/
  clients.ts                        THE most important file — one entry per client, see §9
lib/
  auth.ts                           NextAuth config (Credentials provider, JWT session)
  users.ts                          Decodes APP_USERS_BASE64 into AppUser[]
  meta.ts                           Meta Graph API client (Insights)
  ghl.ts                            GoHighLevel API client — see §8, this is where the scars are
  metrics.ts                        Combines meta.ts + ghl.ts into the shapes the UI consumes
  accents.ts                        Brand color system (blue/gold) + dark-mode CSS vars for charts
  format.ts / weeks.ts              Formatting helpers, week-bucket math for trend charts
types/index.ts                      Every shared type — ClientConfig, ClientReport, etc.
components/
  DashboardShell, MetricCard, MetricGroup, ChartCard, WeeklyTable, ThemeToggle, ...
  sections/    SnapshotSections + TrendsSections (standard clients), Pipeline* (Excel Roofing)
  charts/      One Recharts component per metric — deliberately simple, see §10
  skeletons/   Suspense fallbacks
scripts/
  hash-password.mjs, build-app-users.mjs   See §5 for the login-credential workflow
```

## 4. Architecture: two dashboard "shapes"

`ClientConfig.showMetaAds` (default `true`) decides which of two completely
separate code paths a client's dashboard uses. This branch happens in
`app/dashboard/[clientSlug]/page.tsx`.

### Standard (Meta Ads + GHL) — `showMetaAds` unset/true

Used by One Day Roofing, US Home Pro, JJ Roofing. Data comes from:
- `lib/meta.ts` → ad spend, clicks, impressions, CPC, CTR, landing page views
- `lib/ghl.ts`'s **generic model** (`getAppointmentStats`, `getSalesStats`,
  and their weekly counterparts) → appointments, shows, "leads" (see below),
  quotes sent, closed, revenue
- Combined in `lib/metrics.ts`'s `getClientReport` / `getClientTrends` into
  a `ClientReport` / `WeeklyDataPoint[]`
- Rendered by `SnapshotSections` (cards) + `TrendsSections` (table + 14
  single-metric charts)

**Important: "Leads" is NOT Meta's own `lead` action count.** It's the
number of opportunities GHL created in `ghlPipelineName` for the period.
Why: Meta counts every raw form submission (duplicates included — someone
re-submitting after seeing a retargeting ad counts twice), while GHL
de-duplicates by contact (email/phone) before ever creating an opportunity.
Confirmed against real One Day Roofing data 2026-07-28: Meta said 34 leads
in a 30-day window where GHL only ever created 24 opportunities. `Cost per
Lead` and `Opt-in Rate` both derive from this same GHL-based number, not
Meta's. This applies to every standard-dashboard client — it does **not**
apply to Excel Roofing, which never goes through this code path at all.

### Custom funnel (GHL-only) — `showMetaAds: false`

Used only by Excel Roofing today. No Meta Ads section at all — everything
comes from `ClientConfig.customFunnel` (a `CustomFunnelConfig`) via
`lib/ghl.ts`'s `getPipelineFunnelStats`/`getWeeklyPipelineFunnelStats`, combined
in `lib/metrics.ts`'s `getPipelineFunnelReport`/`getPipelineFunnelTrends`,
rendered by `PipelineSnapshotSections` + `PipelineTrendsSections`. This model
supports things the generic model doesn't: a lead-source breakdown, a
"direct quote" lead category (see §9), and two pipelines combined into one
lead count. It exists because Excel Roofing's actual GHL setup (two
pipelines, contact-source-based lead attribution, a lead-source breakdown
the client explicitly wants) doesn't fit the single-pipeline generic model
at all. **Don't try to generalize the two models into one** — they solve
different problems and forcing them together will make both worse.

## 5. Auth system

NextAuth (Auth.js v5 beta), Credentials provider, JWT session, **no
database**. Login is **username + password** (changed from email+password
2026-07-30 — if you find old code/docs mentioning "email" for login, it's
stale).

- `APP_USERS_BASE64` env var = base64-encoded JSON array of
  `{ username, passwordHash, role, clientSlug?, name? }`.
- **Why base64 and not raw JSON in the env var**: bcrypt hashes contain `$`
  characters (`$2b$10$...`). Next.js's `.env` loader treats `$word` as
  variable interpolation and silently strips it if the variable doesn't
  exist, corrupting the hash. Base64-encoding the whole array sidesteps this
  entirely. **Never store a raw passwordHash directly in an env var in this
  project.**
- `role: "master"` can view any client slug. `role: "client"` is locked to
  its own `clientSlug` — enforced in `proxy.ts` (route-level redirect) *and*
  again inside `app/dashboard/[clientSlug]/page.tsx` (defense in depth, in
  case something reaches the page without going through the proxy).

**To add or rotate a user's password:**
```bash
npm run hash-password -- "the-new-password"
```
Copy the hash into `users.local.json` (gitignored — copy the shape from
`users.example.json`, using `username` not `email`), then:
```bash
npm run build-app-users -- users.local.json
```
Paste the printed base64 string into `.env.local`'s (and Vercel's)
`APP_USERS_BASE64`. Delete `users.local.json` afterward — it's gitignored
but there's no reason to leave a plaintext-password-adjacent file sitting
in the working directory once the hash is baked in.

## 6. Data flow / how a page renders

`app/dashboard/[clientSlug]/page.tsx`:
1. Auth check (redirect to `/login` if unauthenticated; redirect a `client`
   role to their own slug if they requested someone else's).
2. Look up `ClientConfig` via `getClientBySlug`.
3. Kick off the report/trends promises **without awaiting them**.
4. Render `<Suspense>` boundaries around the components that `await` those
   promises, so the fast "snapshot" cards can paint before the slower
   "trends" charts finish. Each `Suspense` has a skeleton fallback matching
   the real content's layout (`CardGridSkeleton` / `ChartGridSkeleton`) — if
   you add/remove cards or charts, update the matching skeleton's `count` or
   it'll visibly jump/reflow when the real content streams in.

## 7. Meta Ads integration (`lib/meta.ts`)

Single shared System User token (`META_ACCESS_TOKEN`) across every client —
each client just has its own `metaAdAccountId` (format `act_<digits>`).
Before onboarding a new client's ad account, **the account owner must grant
our Business Manager/System User read access** (Business Settings → Ad
Accounts → assign partner, or add the System User directly) — until that
happens, requests 200 but return a permissions error, not a 401/404. Verify
with a plain Insights fetch before assuming a client is "done."

Two per-client override fields on `ClientConfig`, both default to sane
values and should only be set after checking real data:
- `metaLeadActionType` (default `"lead"`) — which Meta `actions[].action_type`
  counts as a lead. `"lead"` vs `"offsite_conversion.fb_pixel_lead"` are both
  common depending on whether the client runs on-platform Lead Ads or a
  website pixel.
- `metaLandingPageViewActionType` (default `"landing_page_view"`) — override
  when a client's funnel doesn't actually use landing pages (e.g. One Day
  Roofing runs mostly Facebook Instant Forms, where `landing_page_view`
  never fires at all since the user never leaves Facebook — leads exceeded
  landing_page_view and Opt-in Rate went over 100%. Fixed by switching to
  `"link_click"` as the best available proxy for "reached the conversion
  surface." Check a client's real `actions[]` breakdown before assuming
  either default is right).

## 8. GoHighLevel integration (`lib/ghl.ts`)

This is where almost every real bug in this project's history has lived.
Read this section fully before changing anything in here.

### Auth
One static **Private Integration Token per client**, env var
`GHL_TOKEN_<SLUG_UPPER_SNAKE>` (e.g. `GHL_TOKEN_JJ_ROOFING`). Generated from
that client's GHL sub-account: Settings → Private Integrations. GHL's old v1
shared agency key is EOL (2025-12-31) and v2 has no direct equivalent for an
agency token reading sub-account data without OAuth refresh-token handling
we can't do without a database — hence one token per client.

### The `/opportunities/search` snake_case bug (confirmed, real)
Every other GHL endpoint used here takes camelCase params (`locationId`).
**`/opportunities/search` alone wants snake_case** (`location_id`,
`pipeline_id`, `pipeline_stage_id`). Getting this wrong doesn't error
loudly — it silently returns 0 results (or a 422 depending on version). This
bit every client's "quotes sent"/"closed" numbers for a while before it was
caught. If you add a new call to this endpoint, copy the param names from an
existing working call — don't "clean up" them to camelCase to match the rest
of the file.

### Contact source, not opportunity source
An opportunity's own `source` field is usually `null`. The real lead source
lives on the linked **contact** (`getContactSource` fetches
`/contacts/{id}`). Same for most custom field data — see the US Home Pro
note below, opportunity `customFields` came back empty in every single
opportunity sampled; the real survey answers were all on the contact record.

### The calendar's `appointmentStatus` field is NOT reliable — confirmed
across every client checked so far (Excel Roofing, US Home Pro, One Day
Roofing, JJ Roofing). It sometimes has real values (`"showed"`, `"no-show"`,
`"cancelled"`) but isn't kept in sync with what actually happened — found
concrete cases on every client of an opportunity sitting at a "Closed" or
"Showed and Quoted" pipeline stage while its linked calendar event still
said `"confirmed"`. The theory (not confirmed, just the most consistent
explanation): outcome tracking happens via a staff member clicking a
trigger-link workflow that updates the **pipeline stage** directly, without
ever touching the calendar event's own status field.

**Rule of thumb: the pipeline stage is the source of truth for
show/no-show/cancelled, never the calendar's `appointmentStatus`.** This is
why `ClientConfig.ghlShowStageNames` exists — when set, `getAppointmentStats`
computes "shows" from pipeline-stage membership instead of calendar status
(`ghlShowStatus` is only used as a fallback for a client where no one has
verified this yet — don't assume it's safe to rely on for a new client
without checking, the way it was checked for all four current ones).

### Two dashboard-model code paths in this file
- **Generic model** (`getAppointmentStats`, `getSalesStats` +
  weekly versions) — single pipeline (`ghlPipelineName`), stage-name-array
  config (`ghlQuoteSentStageNames`, `ghlClosedStageNames`,
  `ghlShowStageNames`). Fetches the whole pipeline's opportunities for the
  period **once** (`getSalesPipelineOpportunities`) and derives everything
  (leads, quotes sent, closed, shows) from stage-name-set filters over that
  same list — not one API call per metric.
- **Custom funnel model** (`getPipelineFunnelStats` +
  weekly version) — Excel Roofing only, driven by `CustomFunnelConfig`. Two
  pipelines fetched once each; see §9 for the specific business rules baked
  in here (Roofr direct-quote leads, contact-source-based lead breakdown,
  default-to-"Website" for empty sources).

Both models bucket "when did this count happen" two different ways and it
matters which one a given metric uses:
- **Cumulative / created-date bucketing** (`createdAt`) — used for "leads"
  and "quotes sent," because these represent *when the opportunity entered
  the funnel*, and once counted they should stay counted in that week even
  if the stage changes later.
- **Current-stage-snapshot / last-change bucketing** (`lastStageChangeAt`) —
  used for show/no-show/cancelled/closed, because these represent *the
  week the opportunity reached its current status*.

If you're adding a new metric, decide explicitly which of these two it is —
mixing them up produces numbers that look plausible but don't reconcile with
manual counts (this exact class of bug is what caused the "0 leads when
there are actually 16" and "34 leads vs 24 opportunities" incidents in this
project's history).

## 9. Per-client playbook

Every client's GHL setup was reverse-engineered from real data (either via
the GHL MCP tool when available, or direct `/opportunities/pipelines` +
`/opportunities/search` + `/calendars/events` calls with the client's own
Private Integration Token). **Don't assume a new client's pipeline follows
the same shape as an existing one just because the stage names look
similar** — verify against real opportunities and calendar events every
time, the way every client below was verified.

### Excel Roofing (`showMetaAds: false`, custom funnel)
- Two pipelines: **"Website Leads"** (every incoming lead gets an
  opportunity here, this is where Booked/Cancelled/Lost appointment counts
  come from) and **"AI Quote Follow Up"** (only leads who already got a
  quote). A lead can independently exist in both — their counts are
  **summed, not deduplicated**, for total leads.
- **Roofr leads are a distinct case**: they go straight into "AI Quote
  Follow Up" and never touch "Website Leads" at all. Identified by checking
  BOTH the contact's *and* the opportunity's own `source` field for "Roofr"
  (neither one alone reliably carries it) — tracked separately as
  `directQuoteLeads`, not folded into the source breakdown.
- Contacts with no source at all default to "Website."
- Only "Signed and closed" counts as a real close — "Verbal Yes - Deposit
  Pending" does not (confirmed with the client: a verbal yes isn't a signed
  deal yet).

### One Day Roofing (standard model)
- **7 pipelines exist in this account** — only **"Meta Ads"** has real sales
  data. "AI Quote Follow Up" and "Website Leads" exist but are completely
  dormant (0 opportunities) — legacy/future-feature scaffolding, same
  pattern GHL snapshots seem to ship with. The other four "AI ... Tracking"
  pipelines are internal bot-orchestration plumbing (one, "AI Setting
  Tracking," has real opportunity volume but mirrors the same contacts
  already in "Meta Ads" — not a separate lead source, don't count it).
- `metaLandingPageViewActionType: "link_click"` override — see §7.
- Calendar: only "In-Home Roof Estimate" is real; a "Testing" calendar
  exists with 0 events, confirmed dummy, excluded from `ghlCalendarIds`.

### US Home Pro (standard model)
- Single active pipeline: **"Meta Ads"**. A second pipeline, "AI Quote
  Follow Up," exists (structurally identical to Excel Roofing's own
  pipeline of the same name) but has 0 opportunities — intentionally
  ignored per the client.
- **Showing up and getting quoted are the same event here** — the stage is
  literally named "Showed and Quoted." There's no separate "quote sent"
  step, so `ghlQuoteSentStageNames` and `ghlShowStageNames` are the exact
  same array.
- Single active service line: kitchen cabinet refacing. The location's
  custom fields also define a full roofing survey (roof age, moss growth,
  shingle damage) but it's unused/legacy — every sampled contact only had
  kitchen-cabinet answers populated. Don't build a roofing branch for this
  client based on those fields existing.
- Custom field data lives entirely on the **contact** record — every
  opportunity's own `customFields` array came back empty in every sample
  checked.

### JJ Roofing (standard model)
- Single pipeline: **"Home Services Pipeline"**, single service line (roof
  estimates). Stage names here are unusually literal/self-explanatory
  compared to the other clients.
- Unlike US Home Pro, showing up and getting a quote are **two separate,
  sequential stages** ("Appt Showed - Quote Requested" happens first, "Quote
  Delivered" is a later, distinct stage) — so `ghlQuoteSentStageNames` and
  `ghlShowStageNames` differ here.
- "Long Term Nurture" and "Dead Lead" both occur after the appointment
  chronologically, but only **Long Term Nurture** implies the lead actually
  showed up (confirmed with the client) — Dead Lead does not count toward
  shows. This is a business-logic nuance that isn't derivable from the stage
  name alone; it was confirmed by asking, not inferred.
- "Deposit Collected" and "Job Completed" are post-sale fulfillment stages
  of an already-won deal — they count as Closed the same as "Quote Closed"
  itself (confirmed with the client).

## 10. UI system

- **Brand palette**: blue `#0067eb` / gold `#ffcf00` / near-black, sourced
  from golaunchpad.co. `lib/accents.ts` is the single source of truth —
  `Accent = "blue" | "gold"` only, used to color-code MetricGroup/ChartCard
  sections consistently (e.g. "Meta Ads" section = blue, "Funnel" = gold).
- **Dark mode**: class-based (`.dark` on `<html>`), toggled by
  `components/ThemeToggle.tsx` (pure CSS — both light/dark SVG icons always
  render, `dark:` variants show/hide the right one; no `useState`/`useEffect`
  needed, which also avoids a React "setState in effect" lint violation). An
  inline script in `app/layout.tsx`'s `<head>` applies the saved/system
  theme *before* React hydrates, to avoid a flash of the wrong theme — this
  is why `<html>` has `suppressHydrationWarning`. Chart colors use CSS
  variables (`--chart-blue-strong` etc., defined per-theme in
  `globals.css`) instead of literal hex, so Recharts SVGs follow the active
  theme automatically without any chart component needing to know which
  theme is active.
- **Charts are deliberately simple** — one metric per chart, one Y-axis,
  `BarChart` almost everywhere. This is a direct response to user feedback:
  an earlier version used `ComposedChart` with dual Y-axes to cram two
  differently-scaled metrics (e.g. CAC in $ and ROAS in "x") into one chart,
  which was hard to read. If a metric pair shares a unit (Ad Spend $ vs.
  Revenue Closed $, Show Rate % vs. Close Rate %), they can share one
  grouped-bar chart; otherwise, split them into two separate single-metric
  charts. Don't reintroduce dual-axis composed charts without being asked.
- **`ChartGridSkeleton`/`CardGridSkeleton` counts must match the real
  content.** These are hardcoded numbers in `app/dashboard/[clientSlug]/page.tsx`
  — if you add/remove a card or chart in a section, update the matching
  skeleton's `count` prop or the loading state will visibly reflow when the
  real content streams in.

## 11. Environment variables reference

See `.env.example` for the authoritative list with setup instructions. Summary:

| Var | Purpose |
|---|---|
| `AUTH_SECRET` | NextAuth JWT signing secret |
| `APP_USERS_BASE64` | Login credentials, see §5 |
| `META_ACCESS_TOKEN` | Shared Meta Business Manager System User token |
| `GHL_TOKEN_<SLUG>` | One per client, GHL Private Integration Token |

## 12. How to onboard a new client — checklist

This exact sequence was followed for JJ Roofing and worked cleanly; follow
it in order rather than skipping ahead to writing config.

1. **Get the Meta Ad Account ID** (`act_<digits>`) from the client/agency.
   Verify it resolves: `GET /act_<id>?fields=name` with `META_ACCESS_TOKEN`.
   If you get a permissions error (not "does not exist"), the account owner
   needs to grant our Business Manager/System User access — tell them how
   (Business Settings → Ad Accounts → Assign Partner, or add the System User
   directly with `ads_read`). Once granted, verify a real Insights fetch
   works (spend/clicks/actions present) before moving on.
2. **Get the GHL Location ID and a Private Integration Token** — the client
   generates the token themselves (Settings → Private Integrations, read
   access to Opportunities/Contacts/Calendars/Locations) and sends both to
   you. Add the token to `.env.local` (and Vercel) as `GHL_TOKEN_<SLUG>`.
3. **Reconnaissance before writing any config** — either via the GHL MCP
   (if set up for this client) or direct API calls with the new token:
   - `GET /opportunities/pipelines` — list every pipeline. Don't assume the
     first/only-obviously-named one is right; check opportunity *counts*
     per pipeline over a real window (30–60 days) to find which one(s)
     actually have data. Every client so far has had at least one dormant
     "looks important" pipeline with 0 opportunities.
   - `GET /opportunities/search` on the real pipeline — sample stage
     distribution, check `monetaryValue` population, note which stages are
     ambiguous (e.g. does "Nurture" mean before or after the appointment?)
     and **ask the client rather than guess** — every ambiguous stage in
     this project's history that got guessed wrong caused a real, reported
     bug.
   - `GET /calendars/events` — cross-check calendar `appointmentStatus`
     against the pipeline stage for a handful of opportunities that should
     have shown/closed. Expect it to be unreliable (§8) — confirm this
     explicitly for the new client rather than assuming.
4. **Write the `config/clients.ts` entry.** Comment the *why* behind every
   non-default field, the way the existing four entries do — the next
   person (possibly you, in six months) needs the reasoning, not just the
   stage-name array.
5. **Verify end-to-end in the browser** with a master login before calling
   it done — check both `?period=7d` and `?period=30d`, confirm no warning
   banner (data-source fetch failure), and sanity-check that numbers that
   should be internally consistent actually are (e.g. `closedCount/shownCount`
   sublabel matching the Close Rate percentage).
6. **Add login credentials** for the client (§5) once they're ready to be
   given access — this is a separate, deliberate step; don't create logins
   preemptively.

## 13. Known non-issues (don't waste time on these)

- **A hydration warning mentioning an attribute like
  `__processed_<uuid>__="true"` on `<body>`** is a browser extension
  injecting a marker into the DOM before React hydrates (confirmed
  2026-07-30) — not application code, not fixable from our side beyond
  adding `suppressHydrationWarning` to `<body>` if the console noise is
  annoying. It's cosmetic; the extension's attribute isn't rendered or used
  by anything.
- The dev environment used for building this project has a quirk where a
  long-running `next dev` process sometimes doesn't pick up file changes
  reliably (stale Turbopack compilation) — if a change that should be
  reflected in the browser doesn't show up, restart the dev server before
  assuming the code is wrong.

## 14. What's not done yet

- **Not deployed to Vercel** — everything so far has been verified against
  `next dev` locally. Env vars need to be mirrored into Vercel's project
  settings before a production deploy.
- **No automated tests.** Verification has been manual (browser + direct
  API scripts cross-checking real data) throughout this project's history.
  If you add tests, the GHL data-reconciliation logic in §8 (stage-name-set
  filtering, createdAt vs. lastStageChangeAt bucketing) is the highest-value
  place to start — it's where every real bug so far has lived.
- Master-role UX for switching between clients is minimal (`ClientNav`) —
  no cross-client comparison view exists.
