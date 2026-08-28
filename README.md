# HackClub VIT Recruitment & Interview Management Platform

A production-ready Full-Stack platform designed to digitize and centralize the complete recruitment lifecycle.

## System Architecture Overview

The system is built as a monolithic Full-Stack application using Next.js 15 App Router.
- **Frontend & Backend API**: Next.js App Router (`app/api` for backend routes, `app/(role)` for frontend).
- **Database**: PostgreSQL (Relational Database)
- **ORM**: Prisma
- **Authentication**: JWT-based session tokens using `jose` at the Edge, with passwords hashed using `bcryptjs`.
- **Styling**: Pure CSS Custom Properties and Tailwind v4 engine configured for dark cinematic aesthetics.

## Project Setup Instructions

### Prerequisites
- Node.js (v18+)
- pnpm (recommended)
- PostgreSQL Server

### Installation
1. Clone the repository.
2. Run `pnpm install` to install all dependencies.

### Environment Variables
Create a `.env` file in the root directory and configure the following variables:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/hc_recruitment?schema=public"

# JWT Secret for encrypting auth cookies
JWT_SECRET="your_very_long_secure_secret_string"
```

### Database Migration
The application requires the PostgreSQL database schema to be initialized before running.
```bash
npx prisma db push
# or
pnpm dlx prisma db push
```
*(Alternatively, use `npx prisma migrate dev` in a formal production environment).*

### Seed Credentials
When the database is empty, you need an Administrator account to bootstrap the platform (create recruiters and panels).
We provide a setup seed script:
```bash
npx prisma db seed
# Ensure you configure seed in package.json, or manually inject a row into the User table.
```

**Manual Seed fallback (SQL):**
```sql
INSERT INTO "User" (id, name, email, password, role, "updated_at") 
VALUES (gen_random_uuid(), 'System Admin', 'admin@hackclubvit.com', '$2a$10$wN...hashed...', 'ADMIN', NOW());
```

## How to Run

Because this is a Next.js Full-Stack App, running the application boots both the frontend and backend simultaneously.

### Development Mode
```bash
pnpm run dev
```
The platform will be available at `http://localhost:3000`.

### Production Build
```bash
pnpm run build
pnpm run start
```

## Completed Feature List (100% PDF Compliance)
- [x] Secure Authentication & Role-based edge routing (`middleware.ts`)
- [x] Administrator Dashboard & Global Analytics Engine
- [x] Admin Interview Panel Creation and Member Assignment
- [x] Admin Dynamic Form Question Builder
- [x] Admin System Audit Logs UI
- [x] Global Candidate and Application view for Admins
- [x] Department-Based Access Control for Recruiters
- [x] Recruiter Candidate Shortlisting and Review Flow
- [x] Double-Booking Prevention Algorithm for Interview Scheduling
- [x] Dedicated Meetings Dashboard for Recruiters
- [x] Panel Member Dedicated UI with Assigned Interview restrictions
- [x] Structured Evaluative Feedback Form for Panel Members (1-5 Scoring)
- [x] Candidate Final Decision workflow (Selected/Waitlisted/Rejected)
- [x] In-app Database Notifications & Audit Trail
- [x] High-fidelity Dark Cinematic UI with SVG iconography

## Known Limitations
- Email Notifications: The backend architecture supports it via the `src/lib/notify.ts` utility, but currently only writes to the DB. Integration with an SMTP provider (like Resend/SendGrid) is required for actual email delivery.
- File Storage: Resume uploads currently require the candidate to paste an external URL (Google Drive/Dropbox). S3 integration can be added easily on top of the string field.

## Testing Instructions
1. **Public Flow**: Visit `/recruitment` to submit an application as a candidate.
2. **Recruiter Flow**: Login as a Recruiter (`/login`). View applications, shortlist the candidate, and schedule an interview. Try scheduling two candidates for the exact same Panel at the same time to trigger the Double-Booking rejection.
3. **Panel Flow**: Login as a Panel Member. View your assigned interviews, click "JOIN MEETING", and submit the 5-point evaluation.
4. **Final Decision**: Login as Recruiter again, open the Candidate profile, review the aggregated feedback, and hit "FINAL SELECT".
5. **Audit Logs**: Login as Admin to `/admin/audit-logs` and verify the entire lifecycle is securely recorded.
