# HACKCLUB RECRUITMENT & INTERVIEW MANAGEMENT PLATFORM
## Handoff Document — Recruiter & Lead Modules

---

## 1. Project Overview

This is the **Recruiter & Lead** module of the HackClub VIT Chennai Recruitment & Interview Management Platform, built as a Next.js 16 (App Router) application with Prisma ORM + SQLite (dev) / PostgreSQL (prod).

**Branch:** `feat/recruiter-lead-dashboard` (based on `main` at commit `607eb18`)

---

## 2. Quick Start

```bash
# Install dependencies
npm install

# Set up database
cp .env.example .env
npx prisma migrate deploy
npm run db:seed

# Start development server
npm run dev
```

**Demo credentials (password: `Hackclub@2026`):**

| Role | Email |
|------|-------|
| Admin | `admin@hackclub.in` |
| Lead (Technical) | `lead.technical@hackclub.in` |
| Lead (Design) | `lead.design@hackclub.in` |
| Lead (Operations) | `lead.operations@hackclub.in` |
| Lead (Projects) | `lead.projects@hackclub.in` |
| Lead (Finance) | `lead.finance@hackclub.in` |
| Lead (Research & Development) | `lead.research@hackclub.in` |
| Recruiter (Technical #1) | `recruiter1.technical@hackclub.in` |
| Recruiter (Technical #2) | `recruiter2.technical@hackclub.in` |
| ... | (2 recruiters per department) |
| Panelist (Technical #1) | `panelist1.technical@hackclub.in` |
| Panelist (Technical #2) | `panelist2.technical@hackclub.in` |
| ... | (2 panelists per department) |

---

## 3. Architecture Summary

### Stack
- **Framework:** Next.js 16.3.2 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Database:** Prisma 5.22.0 + SQLite (dev) → Neon PostgreSQL (prod)
- **Auth:** JWT in httpOnly cookie + Bearer header (compatible with main site's `hc_session_token`)
- **Styling:** Custom CSS variables (mirroring main site's dark/red theme)
- **Testing:** Vitest (13 tests passing)

### Key Directories
```
app/
├── (auth)/login/           # Login page
├── (dashboard)/
│   ├── recruiter/          # Recruiter dashboard
│   └── lead/               # Lead dashboard
├── api/
│   ├── auth/               # Login/me/logout
│   ├── recruiter/          # Recruiter APIs
│   ├── lead/               # Lead APIs
│   └── notifications/      # Notification bell
├── layout.tsx              # Root layout with AuthProvider
├── page.tsx                # Redirects to login/dashboard
├── globals.css             # Design tokens + component styles
lib/
├── auth.ts                 # JWT sign/verify, user lookup
├── guards.ts               # Auth + dept-scoped access checks
├── status.ts               # Status transition rules + permissions
├── conflict.ts             # Interview scheduling conflict checker
├── notifications.ts        # In-app notification CRUD
├── email.ts                # Nodemailer templates (console fallback)
├── prisma.ts               # Prisma client singleton
├── client/
│   ├── api.ts              # Frontend API client (mirrors main site)
│   └── auth.tsx            # React auth context + hooks
components/ui/
├── StatusBadge.tsx
├── ApplicationTable.tsx
├── NotesThread.tsx
├── StatusHistoryTimeline.tsx
├── ConfirmDialog.tsx
├── PanelistPicker.tsx
├── InterviewSchedulerModal.tsx
├── FeedbackSummary.tsx
prisma/
├── schema.prisma           # Complete schema
├── seed.js                 # Demo data generator
└── migrations/             # Migration history
tests/
└── core.test.ts            # 13 passing tests
```

---

## 4. Data Model (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Auth + role (`ADMIN`, `LEAD`, `RECRUITER`, `PANEL`, `CANDIDATE`) |
| `Department` | 6 HackClub departments (Technical, Design, Operations, Projects, Finance, R&D) |
| `UserDepartment` | Many-to-many user ↔ department (scoping) |
| `Application` | Candidate submission (mirrors main site's RecruitmentApplication fields) |
| `ApplicationNote` | Internal reviewer notes |
| `StatusHistory` | Audit trail (from→to, actor, timestamp, reason) |
| `Interview` | Scheduled session (time, mode, location/link, status) |
| `InterviewPanelist` | Interview ↔ Panelist many-to-many |
| `Feedback` | Panelist evaluation (ratings, overall, recommendation, comments) |
| `Notification` | In-app alerts (read/unread, typed) |

**Enums as Strings** (SQLite-compatible): `Role`, `ApplicationStatus`, `InterviewStatus`, `InterviewMode`, `FeedbackRecommendation`

---

## 5. Application Status Lifecycle

```
APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW_SCHEDULED → INTERVIEWED → SELECTED/WAITLISTED/REJECTED
           ↓                    ↓
        ON_HOLD ←──────────────┘
```

- **RECRUITER:** Applied→Under Review, Under Review→Shortlisted/On Hold/Rejected, On Hold→Under Review/Rejected, Shortlisted→Rejected
- **LEAD:** All RECRUITER transitions + Shortlisted→Interview Scheduled, Interview Scheduled→Interviewed/Shortlisted, Interviewed→Selected/Waitlisted/Rejected, Waitlisted→Selected/Rejected
- Every transition writes `StatusHistory` (actor, timestamp, reason)

---

## 6. API Surface (Auth: Bearer JWT)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email/password → JWT cookie + token |
| GET | `/api/auth/me` | Validate token → user + deptIds |
| POST | `/api/auth/logout` | Clear cookie |

### Recruiter (RECRUITER, LEAD, ADMIN)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recruiter/applications` | List (filter: status, search, roleAppliedFor, page) |
| GET | `/api/recruiter/applications/:id` | Detail (notes, history, interviews, feedbacks) |
| PATCH | `/api/recruiter/applications/:id/status` | Transition status (validated) |
| POST | `/api/recruiter/applications/:id/notes` | Add internal note |
| POST | `/api/recruiter/applications/bulk-status` | Bulk transition |

### Lead (LEAD, ADMIN)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lead/dashboard` | Funnel counts, recruiter load, recent activity |
| GET | `/api/lead/recruiters` | Team members + active app counts |
| GET | `/api/lead/panel-candidates` | Available panelists (with availability for time slot) |
| GET | `/api/lead/interviews` | List interviews (filter status, application) |
| POST | `/api/lead/interviews` | Schedule (conflict check) |
| PATCH | `/api/lead/interviews/:id` | Reschedule/cancel/complete (conflict check on reschedule) |
| GET | `/api/lead/applications/:id/feedback` | Aggregated panel feedback |
| POST | `/api/lead/applications/:id/decision` | Final decision (Select/Reject/Waitlist; feedback required unless override) |
| GET | `/api/lead/analytics` | Funnel, panel workload, recommendation distribution |
| GET | `/api/lead/applications/export` | CSV export |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List (limit, offset, unreadOnly) |
| PATCH | `/api/notifications/:id` | Mark read |

---

## 7. Key Business Logic

### Scheduling Conflict Prevention
Before creating/rescheduling an interview, the system checks:
- **Panelist conflicts:** Any panelist already booked in overlapping time range (status SCHEDULED/RESCHEDULED)
- **Candidate conflicts:** Candidate has another interview in overlapping range
- Returns detailed conflict info (which panelist/interview collides) for UI display

### Department Scoping
- Every request validated via `requireDeptAccess` / `requireApplicationAccess`
- Users only see data from their assigned departments
- Cross-department access → 403 (not filtered 200)

### Notifications (in-app + email stub)
Triggered on: shortlist, interview scheduled/rescheduled/cancelled, final decision, feedback submitted
- Email: Nodemailer (Gmail SMTP) — falls back to console.log if SMTP not configured

---

## 8. Frontend Pages

| Route | Role | Description |
|-------|------|-------------|
| `/login` | All | Email/password form, redirects by role |
| `/recruiter` | RECRUITER, LEAD | Application table (search, filter, paginate), detail drawer (notes, history, interviews), bulk actions |
| `/lead` | LEAD | Tabs: Overview (funnel, team), Applications (full table), Team (recruiter workload), Scheduling (panel picker + conflict UI), Analytics (funnel, panel load, recommendations) |

**Shared Components:** `StatusBadge`, `ApplicationTable`, `NotesThread`, `StatusHistoryTimeline`, `ConfirmDialog`, `PanelistPicker` (with live availability), `InterviewSchedulerModal`, `FeedbackSummary`

---

## 9. Testing

```bash
npm run test
# or
npx vitest run tests/core.test.ts
```

**13 tests covering:**
- Status transition validity (RECRUITER vs LEAD permissions)
- Invalid transition rejection (Applied→Selected, RECRUITER scheduling, etc.)
- Cross-department access control (403 enforcement)
- Scheduling conflict detection (panelist double-book, candidate double-book, reschedule exclusion, availability API)

---

## 10. Deployment Notes

### Environment Variables (`.env`)
```env
DATABASE_URL="file:./dev.db"                    # SQLite dev; use Neon Postgres URL for prod
JWT_SECRET="dev-secret-change-in-production..."  # Min 32 chars
SMTP_USER=""                                     # Optional: Gmail for emails
SMTP_PASS=""                                     # Optional: Gmail App Password
FRONTEND_URL="http://localhost:3000"
```

### Build & Deploy
```bash
npm run build       # TypeScript + Next.js build
npm start           # Production server
```

### Render (matching main site)
- Single web service, Node 20
- Build: `npm install --include=dev && npm run build && cd server && npm install --include=dev && npx prisma generate && npx prisma db push`
- Start: `node server.js` (or adapt for Next.js standalone output)

---

## 11. Known Limitations / Follow-ups

| Area | Note |
|------|------|
| Email | Nodemailer stubbed to console.log if SMTP not configured; configure SMTP for real emails |
| Panel UI | Panel member "conduct interview + submit feedback" screens out of scope (main site or separate) |
| Candidate Portal | Out of scope — main site handles application submission |
| Admin Dashboard | Out of scope — separate team |
| Migrations | Prisma `migrate dev` used in dev; `migrate deploy` for prod |
| Real-time | No WebSocket/push; polling or manual refresh for now |
| File uploads | Resume upload not implemented (URL field only) |

---

## 12. Commit History (this branch)

```bash
# Baseline
chore: normalize line endings from Windows checkout

# Core
feat: Prisma schema + SQLite migration
feat: Domain libs (status, conflict, auth, guards, notifications, email)
feat: Auth APIs (login/me/logout)
feat: Recruiter APIs (list/detail/status/notes/bulk)
feat: Lead APIs (dashboard/recruiters/panel/interviews/feedback/decision/analytics/export)
feat: Notifications API
feat: Vitest suite (13 tests: transitions, scoping, conflicts)
feat: Seed script (6 depts, 1 lead+2 recruiters+2 panelists each, 108 apps, interviews w/ feedback)
feat: Frontend (login, recruiter dashboard, lead dashboard, shared UI components)
```

---

## 13. Contact

Built on `feat/recruiter-lead-dashboard` branch. Ready for review/merge.

**Key files to review first:**
- `prisma/schema.prisma` — data model
- `lib/status.ts` — transition rules
- `lib/conflict.ts` — scheduling logic
- `lib/guards.ts` — access control
- `app/api/lead/interviews/route.ts` — scheduling + conflict check
- `tests/core.test.ts` — test coverage