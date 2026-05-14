# StatStriker UI — Implementation Handoff Document

**Audience:** Engineers and AI coding agents implementing the frontend.  
**Scope:** Visual design system, information architecture, and screen-level behavior **strictly derived from the existing backend** (Express + MongoDB) and the separate AI service.  
**Non-scope:** Do not add product features (e.g. public player DB, “Wonderkids,” live matches) unless the backend gains equivalent models and routes.

**Reference visual:** Professional dark UI (high contrast, minimal decoration, pill search and filter chips). Concept still image: `assets/statstriker-ui-concept-tracker-caliber.png` (spacing and hierarchy target only; implement against this document and live APIs).

---

## 1. System context

### 1.1 Repository layout

| Area | Path | Role |
|------|------|------|
| Main API | `backend/` | Auth, users, teams, players, stats |
| AI API | `ai/` | Squad analysis via Gemini; reads team payload from main API |
| Frontend | `frontend/` | React + Vite (current shell is illustrative only) |

### 1.2 Base URLs (configure per environment)

- Main API: default `http://localhost:3000` (see `backend/index.js` — `PORT` env).
- AI API: separate process (see `ai/`); squad analysis calls main backend using `MAIN_BACKEND_URL`.
- Frontend: typically Vite dev server; CORS allows `FRONTEND_URL` or `http://localhost:3000` for API (see `backend/app.js`).

### 1.3 Authentication

- **JWT** in `Authorization: Bearer <token>` after login/register.
- Token payload: `{ userId }` (see `authMiddleware.js`).
- **Token expiry:** 7 days (see `authController.js`).
- **401:** missing/invalid/expired token. **403:** deactivated account or mutation on resource user does not own.

Implement: secure token storage (httpOnly cookie preferred for production; if localStorage, document XSS risk), attach header on all protected requests, global handler to redirect to login on 401.

---

## 2. Domain model (what the UI represents)

### 2.1 User (`User`)

| Field | UI relevance |
|-------|----------------|
| `username` | Display name, nav avatar initial |
| `email` | Login, profile |
| `teams` | Array of `ObjectId` refs to teams — use `GET /api/users/teams` for owned teams list |
| `lastLogin` | Optional “Welcome back” / account activity |
| `isActive` | If false, API returns 403 |

**Not returned to client as secrets:** `password`, tokens for reset/verification (exist in schema only).

### 2.2 Team (`Team`)

| Field | Type / notes | UI |
|-------|----------------|-----|
| `name` | string 2–100 | Title, search |
| `country` | string 2–100 | Filter (matches `GET /api/teams?country=`), display |
| `city` | string 2–100 | Display |
| `foundedYear` | 1800–current year, optional | Display |
| `formation` | enum string | Select in forms; badge on cards |
| `description` | max 1000, optional | Detail page, expandable |
| `owner` | User ref | Authorization only |
| `players` | Player refs | Roster; list length vs squad cap |
| `avgOverallRating` | 0–99 | KPI, sort, badge |
| `budget` | integer ≥ 0 | Display, filters if product wants |
| `league` | string, optional | Display, filter |
| `isDeleted` / `deletedAt` | soft delete | Hide from lists |
| `createdAt` / `updatedAt` | timestamps | “Last updated,” sorting |

**Squad size:** Backend allows up to **100** active players per team (`playerController`).

### 2.3 Player (`Player`)

| Field | UI |
|-------|-----|
| `name` | Primary label, search |
| `age` | 16–45 |
| `position` | Enum — badge, filter, formation views |
| `preferredFoot` | Left / Right / Both |
| `pace` … `physical` | 0–99 — radar or table in detail |
| `overallRating` | Prominent OVR |
| `potentialRating` | Must be ≥ `overallRating` — “growth headroom” |
| `team` | Team context |
| `stats` | Stats record refs — navigate to seasons |
| `nationality` | Display |
| `jerseyNumber` | 1–99 optional |
| `dateOfBirth` | ISO date; must align with age rules |
| `status` | **Active | Injured | Bench | Loaned** — pills, filters, row color (subtle) |
| `timestamps`, soft delete | Same as team |

### 2.4 Stats (`Stats`) — per player, per season

| Field | UI |
|-------|-----|
| `season` | String **`YYYY/YY`** per API validator (e.g. `2023/24`) — season picker, table columns |
| `matchesPlayed`, `goals`, `assists`, `manOfTheMatchAwards`, `cleanSheets` | Tables, charts |

**Constraint:** One stats document per `(player, season)` — UI must offer **edit** not second **create** for same season.

### 2.5 AI squad analysis (separate service)

- **Endpoint:** `POST` `{AI_BASE_URL}/squad-analysis` (see `ai/routes/aiRoutes.js`).
- **Body:** `{ "teamId": "<MongoId>" }`.
- **Success:** `{ success: true, analysis: "<markdown or plain string from Gemini>" }`.
- **Failure:** 400 if missing `teamId`; 404 if main API team fetch fails; 500 on AI errors.

Prompt content sent to the model includes team metadata and every player’s attributes (see `ai/prompts/squadPrompt.js`). UI should surface **analysis as structured reading** (sections, copy button) — the API returns a **single string**, not JSON sections; optional client-side parsing is out of contract unless backend changes.

---

## 3. API surface (implement all screens against this)

Prefix: **`/api`**. Most JSON responses use `{ success, message, data?, errors?, pagination? }`.

### 3.1 Auth

| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/api/auth/register` | No | `username`, `email`, `password`, `confirmPassword` | Password rules: ≥8, upper, lower, digit, special from `@$!%*?&` set per validator |
| POST | `/api/auth/login` | No | `email`, `password` | Returns `token` + `user` |
| POST | `/api/auth/logout` | Bearer | — | Logout UX can clear client token |

**Screens:** Register, Login, validation error display from `errors` array (express-validator shape).

### 3.2 Teams

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/teams` | Bearer | Create; body must pass `validateTeam` |
| GET | `/api/teams` | No | Query: `page`, `limit` (max 50), optional `country`. Returns paginated teams; populates up to **11** players per team in list |
| GET | `/api/teams/:id` | No | Full team + all non-deleted players + `owner` username/email |
| PUT | `/api/teams/:id` | Bearer | Owner-only (controller enforces) |
| DELETE | `/api/teams/:id` | Bearer | Soft delete |

**Create/update body (required unless optional noted):**  
`name`, `country`, `city`, `formation` (must be in allowed list — Section 6.1), optional `foundedYear`, `description`, `budget`, `league`.

**Screens:** Team list (global or filtered), team create/edit wizard, team detail (roster, formation, budget, league, AI entry point).

### 3.3 Players

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/players/:teamId/create` | Bearer | Owner only; max 100 players |
| GET | `/api/players/:teamId/players` | No | Roster for team |
| GET | `/api/players/:id` | No | Single player |
| PUT | `/api/players/:id` | Bearer | Owner via team |
| DELETE | `/api/players/:id` | Bearer | Soft delete |

**Create/update body:**  
Required: `name`, `age`, `position`, `nationality`, `dateOfBirth` (ISO 8601), `overallRating`, `potentialRating` (0–99, potential ≥ overall per model).  
Optional: `preferredFoot`, attribute fields, `jerseyNumber`, `status`.

**Screens:** Roster table per team, player create/edit form (large form: attributes + ratings), player profile.

### 3.4 Stats

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/stats/:playerId/stats` | Bearer | Add season stats; duplicate season → 400 |
| GET | `/api/stats/:playerId/stats` | No | Paginated list |
| GET | `/api/stats/:playerId/growth` | No | Aggregates + `seasonalProgression` array |
| PUT | `/api/stats/:statsId` | Bearer | Update |
| DELETE | `/api/stats/:statsId` | Bearer | Soft delete |

**Body (add/update):**  
`season` required, format **`/^\d{4}\/\d{2}$/`** (e.g. `2023/24`). Optional counters: `matchesPlayed`, `goals`, `assists`, `manOfTheMatchAwards`, `cleanSheets` (non-negative integers).

**Screens:** Player → Seasons table; add season modal; edit row; growth view using `growth` + `seasonalProgression` for simple line/bar charts.

### 3.5 Users (profile)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/users/profile` | Bearer | Response shape: `{ success, message, user: { id, username, email, teams[], isEmailVerified, createdAt, lastLogin } }` — note **`user`**, not `data` |
| PUT | `/api/users/profile` | Bearer | Optional `username`, `email` per validator |
| DELETE | `/api/users/profile` | Bearer | Hard-deletes user and cascades teams/players/stats per controller |
| GET | `/api/users/teams` | Bearer | **Authoritative paginated list** of current user’s teams (`data` + `pagination`); populates up to **11** players per team |

**Screens:** Settings / profile; “My squads” should prefer this endpoint over unfiltered `GET /api/teams` if the product is user-centric.

### 3.6 Health

- `GET /health` — public; use for status page or dev banner.

---

## 4. Information architecture (required routes / views)

Map **one primary nav** to backend capabilities (names can vary; behavior must not).

| Nav item | Purpose | Primary APIs |
|----------|---------|--------------|
| Overview | Cross-squad KPIs, search, quick filters, shortcuts | `GET /api/users/teams`, aggregate from teams/players/stats client-side or future BFF |
| My teams | Paginated list, create team | `GET /api/users/teams` or `GET /api/teams`, `POST /api/teams` |
| Team detail | Roster, formation, budget, edit team, add player | `GET /api/teams/:id`, `PUT`, player CRUD |
| Players | Optional global view only if product needs; else roster lives under team | `GET /api/players/:teamId/players` |
| Player detail | Attributes, ratings, status, stats list, growth | `GET /api/players/:id`, stats + growth |
| Seasons / Stats | Per-player season editor | Stats routes |
| AI Scout | Run analysis, show result for selected team | `POST {AI}/squad-analysis` with `teamId` |
| Settings | Profile, logout | User profile routes |

**Do not** add nav items for: Matches, Transfers, Public DB — **not in backend**.

---

## 5. Design system (implementation tokens)

Goal: **calm, data-first** dark UI — not “gamer HUD” (no neon rims, no heavy glassmorphism, no gradient meshes).

### 5.1 Color

| Token | Suggested hex | Use |
|-------|-----------------|-----|
| `bg-app` | `#050505` – `#0A0A0A` | Page background |
| `bg-elevated` | `#0F0F0F`, `#141414` | Cards, inputs |
| `border-subtle` | `#27272A` | Dividers, card borders |
| `text-primary` | `#FAFAFA` | Headings, values |
| `text-secondary` | `#A1A1AA` | Labels, help |
| `text-muted` | `#71717A` | Meta, timestamps |
| `accent-primary` | `#FAFAFA` (inverted) or single brand green sparingly | Primary CTA fill if brand requires; otherwise white/black inversion like reference |
| Semantic | Amber/red/green only | Map to `status` and errors — never decorative |

### 5.2 Typography

- One sans family (system or Inter).
- **Page title:** 24–28px semibold, tight tracking.
- **Section title:** 14px semibold.
- **Body:** 14px regular.
- **Meta / freshness line:** 12–13px muted.
- **Tabular numbers** for OVR, budget, stats columns (`font-variant-numeric: tabular-nums`).

### 5.3 Layout

- **App shell:** Optional persistent **sidebar** (~256px) + **top bar** (56–64px) OR top-nav-only pattern; pick one and keep consistent.
- **Content max-width:** ~1120px centered in main area for readability.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32px.

### 5.4 Components

| Component | Spec |
|-----------|------|
| **Primary search (pill)** | Full-width within content column, height 48–56px, radius 9999px, bg `#141414`, border `1px #27272A`, icon right; debounced query across teams/players names (client filter or future search API). |
| **Filter chips** | Height 32–36px, pill radius; **active:** white bg + dark text; **inactive:** transparent + `1px` zinc border. Chips must map to **real fields**: e.g. player `status`, `overallRating` threshold, `position`. |
| **Buttons** | Primary: high contrast solid; Secondary: outline; Destructive: red text/border only for delete. |
| **Tables** | Sticky header, hover row `#18181B`, right-align numeric columns. |
| **Forms** | Inline validation mirroring API rules; show `errors` array from API. |
| **Pagination** | Use API `page`, `limit`, `pages`, `total` for teams list, stats list. |

### 5.5 Motion and accessibility

- Transitions ≤ 200ms on color/border only.
- Focus visible on interactive elements.
- Chart colors distinguishable without relying on color alone (patterns or labels).

---

## 6. Enumerations (must match backend exactly)

### 6.1 Formations (team create/update)

Allowed values (from `teamModel` / `teamRoutes` — keep in sync with API):

`3-1-4-2`, `3-4-1-2`, `3-4-2-1`, `3-4-3`, `3-5-2`,  
`4-1-2-1-2`, `4-1-2-1-2(2)`, `4-1-3-2`, `4-1-4-1`, `4-2-1-3`, `4-2-2-2`, `4-2-3-1`, `4-2-3-1(2)`, `4-2-4`, `4-3-1-2`, `4-3-2-1`, `4-3-3`, `4-3-3(2)`, `4-3-3(3)`, `4-3-3(4)`, `4-3-3(5)`, `4-4-1-1`, `4-4-1-1(2)`, `4-4-2`, `4-4-2(2)`, `4-5-1`, `4-5-1(2)`,  
`5-2-1-2`, `5-2-3`, `5-3-2`, `5-4-1`

UI: searchable select or grouped dropdown (3ATB / 4ATB / 5ATB).

### 6.2 Positions (player)

`GK`, `RB`, `LB`, `CB`, `RWB`, `LWB`, `DM`, `CM`, `CAM`, `RW`, `LW`, `CF`, `ST`

### 6.3 Preferred foot

`Left`, `Right`, `Both`

### 6.4 Player status

`Active`, `Injured`, `Bench`, `Loaned`

---

## 7. Screen specifications

### 7.1 Auth — Register / Login

- **Register:** fields per Section 3.1; inline password rule hint matching regex expectation.
- **Login:** email + password; on success store token and user; route to Overview.
- **Errors:** Map `message` and `errors[].msg` (or equivalent) to field-level and toast.

### 7.2 Overview (authenticated home)

**Data**

- Load `GET /api/users/teams?page=&limit=` for current user’s teams (same pagination pattern as global teams list; `total` is length of `user.teams` array).
- For KPIs (goals, assists, clean sheets, matches): aggregate from each team’s players’ stats via additional `GET /api/stats/:playerId/stats` or `growth` — **note:** N+1 calls; acceptable for MVP with caching or lazy load; document for backend team if a dashboard aggregate endpoint is added later.

**UI blocks**

1. **Eyebrow + title + subtitle** (product copy).
2. **Freshness line:** e.g. latest `updatedAt` among loaded teams, or static copy until server provides sync field.
3. **Pill search:** filter client-side across team names and (if loaded) player names — scope clearly (“Searching squads…”).
4. **Chips:** `All` + player `status` filters + optional `High OVR` (e.g. ≥ 85) + `Rising potential` (`potentialRating - overallRating` ≥ threshold) — all **client-side** on loaded data unless new APIs appear.
5. **KPI row:** suggest four tiles: **Teams**, **Players** (sum roster), **Season goals** (sum), **Avg squad OVR** (average of `avgOverallRating` across teams or computed).
6. **Team cards grid:** each card — name, formation, league, country, `avgOverallRating`, player count, budget; link to team detail.
7. **Primary CTA:** Create team → navigate to team create flow.

### 7.3 Team list (global)

- `GET /api/teams?page=&limit=&country=`.
- Table or cards with pagination controls bound to `pagination.pages`.
- Read-only for non-owned teams unless you add permission UI (mutations still 403).

### 7.4 Team create / edit

- **Form fields:** match Section 3.2 body.
- **Formation:** Section 6.1 only.
- **Submit:** POST create; PUT update with team id.
- **Success:** redirect to team detail.

### 7.5 Team detail

- Fetch `GET /api/teams/:id` — use populated `players` for roster.
- **Header:** name, formation badge, league, country/city, budget, avg OVR.
- **Actions (owner):** Edit team, Delete team (confirm), Add player, **Run AI analysis** (calls AI service).
- **Roster table:** columns — Name, Pos, OVR, POT, Status, Age, Nationality, Jersey; row → player detail.
- **Capacity indicator:** `players.length` / 100.

### 7.6 Player create / edit

- Large form: all required + optional fields; **potentialRating ≥ overallRating** validated before submit.
- **DOB picker** outputting ISO 8601 date string.
- **Attributes:** sliders or number inputs 0–99.
- **Status** select: Section 6.4.

### 7.7 Player detail

- `GET /api/players/:id`.
- Sections: Summary (ratings, status, team link), **Attributes** grid or radar, **Season stats** table from `GET /api/stats/:id/stats` with pagination, **Growth** from `GET /api/stats/:id/growth` (totals + per-season mini chart).
- Owner actions: Edit player, Add stat season, Edit stat, Delete player.

### 7.8 Stats — add / edit season

- **Add:** POST with new `season`; block duplicate season with user-friendly message from API.
- **Edit:** PUT `/api/stats/:statsId` — need `statsId` from list items (expose `_id` in table).
- **Season input:** mask or helper for `YYYY/YY` with example `2023/24`.

### 7.9 AI Scout

- Team picker (from user’s teams).
- **Request:** `POST` to AI base URL with `{ teamId }` and same Bearer pattern only if AI service is secured that way in deployment; **current `aiController` does not show auth** — confirm deployment contract; if open, still use HTTPS in production.
- **Response:** Render `analysis` as prose; optional markdown renderer if Gemini returns markdown.
- **Loading / error:** distinct states; retry on 500.

### 7.10 Settings / profile

- GET/PUT profile; show username, email; enforce client validation mirroring backend optional updates.
- Logout clears session.

---

## 8. Error and empty states

| HTTP | User-facing behavior |
|------|----------------------|
| 400 | Show `message` + field errors from `errors` array |
| 401 | Clear token; redirect login |
| 403 | Toast: no permission |
| 404 | Not found inline |
| 429 / rate limit | Backoff message (general limiter on `/api/`) |
| 500 | Generic failure + retry; dev details only in dev mode |

**Empty states:** No teams → CTA create team; no players → CTA add player; no stats → explain how to add first season.

---

## 9. Implementation checklist (for AI coder)

1. [ ] Environment config: `VITE_API_URL`, `VITE_AI_API_URL` (or proxy in Vite to avoid CORS in dev).
2. [ ] API client with `Authorization` header from auth store.
3. [ ] All screens in Section 4 wired to documented endpoints.
4. [ ] Forms validate enums and formats before submit (Section 6, season format).
5. [ ] Pagination components for teams and stats lists.
6. [ ] Owner-only actions hidden or disabled when `team.owner` ≠ current user (compare `req.user` equivalent: store `user.id` from login).
7. [ ] Design tokens in Section 5 applied globally (CSS variables or Tailwind theme).
8. [ ] No features without backend support (declare out of scope in PR if needed).

---

## 10. Known backend nuances (UI must handle)

- `GET /api/teams` is **public** and returns **all** non-deleted teams — for “my dashboard” prefer **`GET /api/users/teams`**.
- Team list response populates **at most 11 players** per team — do not assume full roster count from list endpoint; use team detail for full squad.
- `potentialRating` must be ≥ `overallRating` — show helper text in player form.
- Stats `season` format is strict — validate `^\d{4}/\d{2}$` on client.
- AI service depends on **`MAIN_BACKEND_URL`** reaching the main API’s `GET /api/teams/:id` — if analysis fails, surface configuration hint for operators, not end users.

---

## 11. Document maintenance

When backend routes, validators, or enums change, update **Sections 3, 6, and 7** in the same PR as the API change. This file is the **contract** between backend and UI until OpenAPI is generated.

---

*Generated from repository state: `backend/models`, `backend/routes`, `backend/controllers`, `ai/routes`, `ai/controllers`, `ai/prompts/squadPrompt.js`.*
