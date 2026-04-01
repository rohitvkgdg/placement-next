# Blueprint: CampusConnect Production-Ready Features

**Objective:** Add USN-based year access control, annual batch data backup, and dynamic admin dashboard/settings.

**Mode:** Direct (no gh CLI — edits on `main` branch, no PR workflow)

**Total Steps:** 5
**Parallelism:** Steps 2, 3, 4 can run in parallel after Step 1. Step 5 depends on Steps 1 + 2 + 3.

```
Step 1 (Schema + Settings Cache)
   ├── Step 2 (USN Gating)      ← parallel
   ├── Step 3 (Admin Settings)   ← parallel
   └── Step 4 (Batch Backup)     ← parallel
         │
         └── Step 5 (Dynamic Dashboard) ← depends on 1 + 2 + 3
```

### Review Findings Applied

The following critical/high issues from adversarial review have been incorporated:
- **C2:** Singleton enforcement for AdminSettings/SiteSettings (fixed ID pattern)
- **C3:** BackupLog status tracking for failed exports
- **C4:** JWT USN refresh on profile update (trigger === "update" branch)
- **H1:** Step 5 dependency corrected to include Step 2 (needs `lib/settings.ts`)
- **H2:** Cache invalidation via `revalidateTag` on settings save
- **H3:** Year-gate check moved to a shared `(student)` layout group
- **H4:** Batch filtering uses `startsWith` instead of `contains`
- **H6:** Added `@@map` table name annotations to match existing convention

---

## Step 1: Prisma Schema — New Models & Migration

**Model tier:** Default (Sonnet)
**Estimated files:** 3 (schema.prisma, migration SQL, lib/settings.ts)
**Rollback:** `pnpm db:push` with reverted schema

### Context Brief

CampusConnect uses Prisma 7 with PostgreSQL on Neon. The schema at `prisma/schema.prisma` has ~700 lines with models for User, Profile, Job, Application, Placement, Attendance, etc. **No settings or config model exists yet.** USN is a `String? @unique` on the Profile model (line 246). Batch is `String? @default("2022 - 2026")` on Profile (line 264).

### Tasks

1. Add `AdminSettings` model to `prisma/schema.prisma` (singleton pattern — use fixed ID `"default"` in all upserts):
   ```prisma
   model AdminSettings {
     id                   String   @id @default("default")
     activeAdmissionYears String[] @default(["22"])
     collegeCode          String   @default("2SD")
     updatedAt            DateTime @updatedAt
     updatedBy            String?

     @@map("admin_settings")
   }
   ```

2. Add `SiteSettings` model (singleton — same fixed ID pattern):
   ```prisma
   model SiteSettings {
     id                    String   @id @default("default")
     placementSeasonName   String   @default("Placement Season 2025-26")
     activeBatch           String   @default("2022 - 2026")
     announcementText      String?
     announcementActive    Boolean  @default(false)
     registrationOpen      Boolean  @default(true)
     dashboardWidgets      Json     @default("{}")
     updatedAt             DateTime @updatedAt
     updatedBy             String?

     @@map("site_settings")
   }
   ```

3. Add `BackupLog` model for audit trail (includes status tracking for failed exports):
   ```prisma
   model BackupLog {
     id           String       @id @default(cuid())
     adminId      String
     admin        User         @relation(fields: [adminId], references: [id])
     batchYear    String
     status       BackupStatus @default(PENDING)
     recordCount  Int          @default(0)
     fileSize     Int?
     fields       String[]
     errorMessage String?
     createdAt    DateTime     @default(now())
     completedAt  DateTime?

     @@map("backup_logs")
   }

   enum BackupStatus {
     PENDING
     COMPLETED
     FAILED
   }
   ```

4. Add `backupLogs BackupLog[]` relation to the `User` model.

5. **Create settings cache utility** — `lib/settings.ts`:
   - `getAdminSettings()` — uses `prisma.adminSettings.upsert({ where: { id: "default" }, create: {}, update: {} })` with `unstable_cache` (tag: `"admin-settings"`, revalidate: 60)
   - `getSiteSettings()` — same pattern with tag `"site-settings"`
   - `invalidateSettingsCache(type: "admin" | "site")` — calls `revalidateTag()` for the specified type
   - This file is created in Step 1 because both Steps 2, 3, and 5 depend on it

6. Run `pnpm db:migrate` with migration name `add-settings-and-backup-log`.

7. Create a seed helper in `prisma/seed.ts` (or update existing) that upserts default AdminSettings and SiteSettings rows with `id: "default"`.

### Verification

```bash
pnpm db:generate
pnpm build  # confirms no type errors
```

### Exit Criteria

- `npx prisma validate` passes
- `pnpm build` succeeds
- AdminSettings, SiteSettings, and BackupLog tables exist in DB
- Default rows seeded

---

## Step 2: USN-Based Year Access Control

**Model tier:** Default (Sonnet)
**Estimated files:** 7
**Depends on:** Step 1
**Rollback:** Revert auth.ts, middleware changes, delete /not-authorized page

### Context Brief

NextAuth v5 config is in `lib/auth.ts`. JWT callback (lines 106-131) currently stores only `role` and `id` in the token. Session type augmentation in `types/next-auth.d.ts` only declares `id` and `role`. The middleware (`middleware.ts`) checks for session cookie presence and redirects unauthenticated users. Admin layout (`app/admin/layout.tsx`) checks `role !== "ADMIN"`. **USN and batch are NOT in the session — they live only on the Profile model.**

Auth helper pattern: `const { error, session } = await requireAdmin()`.

USN format example: `2SD22CS076` where `2SD` = college code (3 chars), `22` = admission year (2 chars), `CS` = branch, `076` = roll number.

### Tasks

1. **Create USN parser utility** — `lib/usn.ts`:
   - `parseUSN(usn: string, collegeCode: string)` returns `{ admissionYear: string, branch: string, rollNumber: string } | null`
   - Extract admission year from characters at index `collegeCode.length` to `collegeCode.length + 2`
   - Return `null` for malformed/missing USNs
   - Export `isYearAuthorized(usn: string | null, activeYears: string[], collegeCode: string): boolean`
     - Returns `true` if USN is null (graceful handling — student hasn't set USN yet)
     - Returns `true` if parsed year is in `activeYears`
     - Returns `false` otherwise

2. **Update JWT callback** in `lib/auth.ts`:
   - In the `if (user)` block (initial sign-in): fetch `profile.usn` for STUDENT role, add to token
   - **CRITICAL:** In the `trigger === "update"` block: also fetch `profile.usn` and update `token.usn` — this ensures USN changes are reflected without re-login
   - Add `usn` to JWT token

3. **Update session callback** in `lib/auth.ts`:
   - Pass `token.usn` to `session.user.usn`

4. **Update types** in `types/next-auth.d.ts`:
   - Add `usn?: string | null` to Session user interface
   - Add `usn?: string | null` to JWT interface

5. **Create year-gating server utility** — `lib/year-gate.ts`:
   - `checkYearAccess(session)` — async function that:
     - Returns `{ authorized: true }` if role is ADMIN, RECRUITER, or SUPER_ADMIN (note: SUPER_ADMIN is a string convention in auth-helpers, not a Prisma enum value)
     - Returns `{ authorized: true }` if USN is null/undefined (student hasn't completed profile)
     - Fetches AdminSettings via `getAdminSettings()` from `lib/settings.ts` (created in Step 1)
     - Calls `isYearAuthorized(session.user.usn, settings.activeAdmissionYears, settings.collegeCode)`
     - Returns `{ authorized: false, reason: "Your batch is not active for this placement season" }` if denied
   - **Do NOT put this in middleware** — middleware runs at Edge and can't reliably query Prisma. Instead, call from a shared layout.

6. **Create a shared student route group layout** for year-gating:
   - Create `app/(student)/layout.tsx` — shared layout that calls `checkYearAccess(session)` once
   - Move `dashboard`, `jobs`, `applications`, `profile` routes under `app/(student)/`
   - This avoids duplicating the check in every page and ensures future student pages are automatically gated
   - **Alternative (if moving routes is too disruptive):** Create a `components/year-gate-wrapper.tsx` server component and import it at the top of each student page. Less ideal but lower blast radius.
   - Use your judgment — if existing imports/links reference `/dashboard` etc., the route group approach preserves URLs (parenthesized groups don't affect the URL path)

7. **Create `/not-authorized` page** — `app/not-authorized/page.tsx`:
   - Simple page with message: "Access not available for your batch"
   - Fetch and show which batch years are currently active
   - Link to contact placement cell
   - Add `/not-authorized` to middleware skip list in `middleware.ts`

8. **Trigger session refresh after USN update** — in the profile form submission handler (wherever USN is saved), call `session.update()` to trigger the JWT `trigger === "update"` flow so the new USN is immediately reflected

### Verification

```bash
pnpm build
# Manual test: create student with USN "2SD21CS001", set activeAdmissionYears to ["22"]
# Expected: student sees /not-authorized when accessing /dashboard
```

### Exit Criteria

- Students with USN year NOT in `activeAdmissionYears` are redirected to `/not-authorized`
- Students without USN can still access dashboard (graceful handling)
- Admin and Recruiter roles bypass year-gating entirely
- `pnpm build` passes

---

## Step 3: Admin Settings Page — Batch Access Control & Site Config

**Model tier:** Default (Sonnet)
**Estimated files:** 8
**Depends on:** Step 1
**Rollback:** Remove settings page, revert sidebar

### Context Brief

Admin sidebar navigation is in `components/admin-sidebar.tsx` (lines 34-70) with items like Dashboard, Students, Jobs, etc. Admin pages follow the pattern: server component page fetches data, passes to client component for interactivity. Auth check uses `requireAdmin()` from `lib/auth-helpers.ts`. Forms use React Hook Form + Zod validation. UI uses shadcn/ui components (Card, Input, Button, Switch, Badge, etc.).

No admin settings page exists yet. The SiteSettings and AdminSettings models were created in Step 1.

### Tasks

1. **Add sidebar navigation entry** — in `components/admin-sidebar.tsx`:
   - Add "Settings" item with `Settings` icon from lucide-react, URL `/admin/settings`
   - Place at bottom of navigation list (natural position for settings)

2. **Create Zod validation schemas** — `lib/validations/settings.ts`:
   - `adminSettingsSchema`: `activeAdmissionYears` (array of 2-digit strings), `collegeCode` (string, 2-4 chars)
   - `siteSettingsSchema`: `placementSeasonName` (string), `activeBatch` (string), `announcementText` (optional string), `announcementActive` (boolean), `registrationOpen` (boolean), `dashboardWidgets` (object)

3. **Create API routes**:
   - `app/api/admin/settings/route.ts`:
     - `GET` — returns both AdminSettings and SiteSettings (upsert defaults if missing)
     - `PUT` — accepts `{ type: "admin" | "site", data: ... }`, validates with Zod, updates DB, **calls `invalidateSettingsCache(type)` from `lib/settings.ts`** to bust the cached values, logs security event
   - Auth: `requireAdmin()` on both

4. **Create admin settings server page** — `app/admin/settings/page.tsx`:
   - Fetch AdminSettings and SiteSettings via Prisma
   - Upsert defaults if none exist
   - Pass to client component

5. **Create admin settings client component** — `components/admin/admin-settings-view.tsx`:
   - Two tabs/sections: "Batch Access Control" and "Site Configuration"
   - **Batch Access Control section:**
     - Multi-select for active admission years (checkboxes for "20", "21", "22", "23", "24", "25")
     - College code input (text field, default "2SD")
     - Preview: "Students with USNs like 2SD22XXYYY will have access"
     - Save button with loading state and toast feedback
   - **Site Configuration section:**
     - Placement season name (text input)
     - Active batch (dropdown or text, e.g., "2022 - 2026")
     - Announcement text (textarea) + active toggle (switch)
     - Registration open/closed (switch)
     - Save button with loading state and toast feedback
   - Use shadcn/ui: Card, CardHeader, CardContent, Input, Switch, Button, Badge, Tabs

6. **Add "Backup" sidebar entry** (for Step 4) — add to sidebar now since we're editing it:
   - "Backup" item with `Download` icon, URL `/admin/backup`
   - Place before Settings

### Verification

```bash
pnpm build
# Manual: navigate to /admin/settings, toggle years, save, verify DB update
```

### Exit Criteria

- `/admin/settings` page renders with both sections
- Saving AdminSettings updates DB and reflects on next page load
- Saving SiteSettings updates DB
- Sidebar shows Settings and Backup links
- `pnpm build` passes

---

## Step 4: Annual Batch Data Backup System

**Model tier:** Default (Sonnet)
**Estimated files:** 6
**Depends on:** Step 1
**Rollback:** Remove backup page and API route

### Context Brief

The existing XLSX export pattern is in `app/api/admin/jobs/[id]/applicants/export/route.ts`. It uses the `xlsx` package (already in dependencies) to create workbooks, add worksheets via `XLSX.utils.json_to_sheet()`, and return as a `NextResponse` with content-disposition header. Auth check uses `requireAdmin()`. The BackupLog model was created in Step 1.

Profile model has ~280 fields. Key fields for export: personal info (name, DOB, gender), contact (phone, email, address), academic (USN, branch, batch, CGPA, marks), professional (skills, resume, LinkedIn). Application model tracks job applications. Placement model tracks offers/packages. Attendance model tracks event attendance.

### Tasks

1. **Create backup API route** — `app/api/admin/backup/route.ts`:
   - `POST` handler accepting `{ batchYear: string, includeSheets: string[] }`
   - `includeSheets` options: `"profiles"`, `"applications"`, `"placements"`, `"attendance"`
   - Validate with Zod
   - **Create BackupLog entry with status PENDING** at the start of the export
   - Query logic per sheet (use `startsWith` not `contains` to avoid matching end-year):
     - **Profiles:** `prisma.profile.findMany({ where: { batch: { startsWith: batchYear } } })` — select relevant fields, flatten nested data
     - **Applications:** `prisma.application.findMany()` joined with user profile filtered by `batch: { startsWith: batchYear }`
     - **Placements:** `prisma.placement.findMany()` joined with user profile filtered by batch
     - **Attendance:** `prisma.attendance.findMany()` joined with user profile filtered by batch
   - Create XLSX workbook with one sheet per included type
   - **On success:** update BackupLog status to COMPLETED, set recordCount, fileSize, completedAt
   - **On failure:** update BackupLog status to FAILED, set errorMessage
   - Security event logging
   - Return XLSX buffer with content-disposition header

2. **Create backup history API** — `app/api/admin/backup/history/route.ts`:
   - `GET` — returns recent BackupLog entries with admin name, ordered by createdAt desc
   - Paginated (limit 20)

3. **Create backup server page** — `app/admin/backup/page.tsx`:
   - Fetch recent BackupLog entries
   - Pass to client component

4. **Create backup client component** — `components/admin/backup-view.tsx`:
   - **Export section:**
     - Batch year selector (dropdown: "2020", "2021", "2022", "2023", "2024", "2025")
     - Checkbox group for sheets to include (Profiles, Applications, Placements, Attendance)
     - "Export" button with loading spinner
     - On click: POST to API, receive blob, trigger download
   - **History section:**
     - Table showing: date, admin name, batch year, record count, sheets included
     - Uses shadcn/ui Table component
   - Use shadcn/ui: Card, Select, Checkbox, Button, Table, Badge

5. **Handle large exports** — if record count > 5000:
   - Show warning before export
   - Use chunked Prisma queries (take/skip) to avoid memory spikes
   - Consider streaming the response for very large datasets

### Verification

```bash
pnpm build
# Manual: go to /admin/backup, select batch "2022", check all sheets, export
# Verify: XLSX file downloads with correct sheets and data
# Verify: BackupLog entry created in DB
```

### Exit Criteria

- `/admin/backup` page renders with export form and history table
- XLSX export downloads with separate sheets per data type
- BackupLog audit trail records every export
- Large export (>5000 records) handled without crash
- `pnpm build` passes

---

## Step 5: Dynamic Admin Dashboard & Student-Facing Settings

**Model tier:** Default (Sonnet)
**Estimated files:** 6
**Depends on:** Steps 1 + 2 + 3 (needs `lib/settings.ts` from Step 1, `getSiteSettings` used in student dashboard)
**Rollback:** Revert dashboard page and component changes

### Context Brief

The admin dashboard page is at `app/admin/dashboard/page.tsx` (155 lines). It queries Prisma for stats: student count, verified count, pending KYC, events, applications, placed students, upcoming events, recent activities, branch distribution, monthly trends. **Known bugs:** line 60-66 uses `scheduleEvent` count for "active jobs" (should be `job` model), and line 68 uses profile count for "applications" (should be `application` model).

The dashboard view component is `components/admin/admin-dashboard-view.tsx` (395 lines) using Recharts for charts and shadcn/ui Cards for metrics. It receives all data as props.

The student dashboard is `app/dashboard/page.tsx` (415 lines). It shows profile completion, KYC status, job count, application count, and upcoming events. Currently no awareness of SiteSettings.

SiteSettings model was created in Step 1 and the admin settings page in Step 3.

### Tasks

1. **Fix existing dashboard bugs** in `app/admin/dashboard/page.tsx`:
   - Replace `scheduleEvent` count with `job` count for active jobs metric
   - Replace profile count with `application` count for applications metric
   - Fix "placed students" metric — currently uses `kycStatus: 'VERIFIED'` profile count; should use `prisma.placement.count()` instead

2. **Add batch-filtered stats** to `app/admin/dashboard/page.tsx`:
   - Fetch SiteSettings to get `activeBatch`
   - Add queries filtered by active batch:
     - Total students in active batch
     - Placed students in active batch
     - Average package for active batch
     - Tier distribution (TIER_1, TIER_2, TIER_3, DREAM counts)
   - Pass batch-specific stats alongside existing all-time stats

3. **Update dashboard view component** — `components/admin/admin-dashboard-view.tsx`:
   - Add a "Current Season" section at top showing placement season name from SiteSettings
   - Show batch-specific stats cards: students in batch, placed in batch, avg package, placement rate %
   - Add tier distribution breakdown (could be a simple bar chart or stat cards)
   - Keep existing all-time stats below as "All Time" section
   - If `announcementActive`, show announcement banner at top

4. **Add branch-wise placement breakdown** — enhance existing branch distribution:
   - Show placed vs total per branch for active batch
   - Use existing Recharts bar chart pattern

5. **Update student dashboard** — `app/dashboard/page.tsx`:
   - Fetch SiteSettings via `getSiteSettings()` (from Step 2's `lib/settings.ts`)
   - If `announcementActive` and `announcementText` exists, show alert banner at top
   - If `registrationOpen === false`, disable/hide "Apply" actions on job cards
   - Show placement season name in header

6. **Wire SiteSettings into job listing** — `app/jobs/page.tsx`:
   - If `registrationOpen === false`, show info banner: "Applications are currently closed"
   - Disable apply buttons

### Verification

```bash
pnpm build
# Manual: update SiteSettings via /admin/settings
# Verify: admin dashboard shows correct batch-filtered stats
# Verify: student dashboard shows announcement when active
# Verify: job listing respects registrationOpen flag
```

### Exit Criteria

- Admin dashboard shows accurate, batch-filtered live stats
- Dashboard bugs fixed (correct job count and application count)
- Tier distribution visible on dashboard
- Student dashboard respects SiteSettings (announcements, registration toggle)
- `pnpm build` passes

---

## Invariants (Verified After Every Step)

1. `pnpm build` passes with zero errors
2. `pnpm lint` passes (or only pre-existing warnings)
3. No hardcoded secrets introduced
4. All new API routes use `requireAdmin()` auth check
5. All user input validated with Zod before DB writes
6. Security events logged for sensitive operations (settings changes, data exports)

---

## Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|---|---|
| Putting DB queries in middleware (Edge runtime) | Use server component layouts or API routes for year-gating |
| Hardcoding admission years | Store in AdminSettings, configurable via admin UI |
| Single monolithic settings page component | Split into focused sections with tabs |
| Exporting all 280 Profile fields | Select only relevant fields per sheet type |
| No audit trail for backups | Always log to BackupLog with admin ID and timestamp |
| Caching settings forever | TTL-based cache (60s) with manual invalidation on save |
| Mutating objects in React state | Create new objects/arrays (immutable pattern) |

---

## Execution Order Summary

| Phase | Steps | Can Parallelize? |
|-------|-------|-----------------|
| 1 | Step 1 (Schema) | No — foundation |
| 2 | Steps 2 + 3 + 4 | Yes — independent after Step 1 |
| 3 | Step 5 (Dashboard) | No — depends on Steps 1 + 2 + 3 |

**Total estimated sessions:** 3 (one per phase, or 5 if executing serially)
