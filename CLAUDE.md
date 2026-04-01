# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CampusConnect — a placement management portal for SDMCET built with Next.js 16 (App Router), Prisma ORM, PostgreSQL (Neon), and shadcn/ui. Three roles: STUDENT, RECRUITER, ADMIN.

## Commands

```bash
# Development (Turbopack, port 3500)
pnpm dev

# Build (runs prisma generate first)
pnpm build

# Type checking
pnpm type-check

# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format
pnpm format:check

# Database
pnpm db:migrate      # Create and apply migration
pnpm db:push         # Push schema without migration
pnpm db:studio       # Open Prisma Studio
pnpm db:seed         # Seed database
pnpm db:reset        # Reset database (destructive)
pnpm db:generate     # Regenerate Prisma client
```

No test framework is configured yet (`pnpm test` is a placeholder).

## Architecture

### Routing (App Router)

- `app/(auth)/` — Public auth pages (login, signup, verify-email)
- `app/dashboard/`, `app/jobs/`, `app/applications/`, `app/profile/`, `app/settings/` — Student-facing pages
- `app/admin/` — Admin dashboard, job management, KYC queue, analytics, placements, attendance
- `app/api/` — RESTful API routes; admin endpoints under `api/admin/`

### Key Directories

- `components/ui/` — shadcn/ui primitives (new-york style, slate base color)
- `components/admin/` — Admin-specific components (job forms, applicant tables, analytics)
- `components/steps/` — Multi-step profile form (5 steps: personal, contact, academic, engineering, review)
- `hooks/` — Custom hooks (`use-file-upload`, `use-profile-form`, `use-profile-check`)
- `lib/` — Core utilities: `auth.ts` (NextAuth config), `prisma.ts` (client singleton), `email.ts` (AWS SES/Nodemailer), `r2-storage.ts` (Cloudflare R2)
- `lib/validations/` — Zod schemas for auth and job forms
- `types/` — TypeScript types including NextAuth augmentation (`next-auth.d.ts`) and profile types

### Auth

NextAuth.js v5 with Google OAuth + Credentials providers. JWT session strategy (30-day max age). Email verification required before login. Role injected into session via callbacks. Middleware (`middleware.ts`) adds security headers and redirects unauthenticated users to `/login`.

### Database

Prisma ORM with PostgreSQL on Neon. Key models: User, Profile (~280 fields), Job (tier system), Application (one-click apply with unique [jobId, userId] constraint), Placement, ScheduleEvent, Notification, Attendance, Company. Schema at `prisma/schema.prisma`.

### Tier-Based Placement Logic

Jobs are categorized: TIER_1 (>9 LPA), TIER_2 (5-9 LPA), TIER_3 (<=5 LPA), DREAM (>10 LPA). Once placed, students are tier-locked — higher-tier placement blocks lower-tier job access. Dream offers bypass tier restrictions.

### File Storage

Cloudflare R2 (S3-compatible) via `lib/r2-storage.ts`. Upload endpoint at `api/upload`, deletion at `api/delete-file`. Used for resumes, profile photos, marks cards, certificates.

### Path Alias

`@/*` maps to the project root (e.g., `@/components/ui/button`, `@/lib/utils`).
