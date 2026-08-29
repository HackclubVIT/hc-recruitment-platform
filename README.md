# HackClub VIT Recruitment and Interview Management Platform

The HackClub VIT Recruitment Platform is built on a strictly decoupled 3-tier architecture. It comprises a Next.js Frontend for recruitment and administration, an independent Express API to securely manage all business logic, and a PostgreSQL database.

## Architecture Overview

Main Website
       |
       v
Independent Express API
       |
       v
PostgreSQL
       ^
       |
Recruitment Website

- **Recruitment Frontend**: Built with Next.js (App Router), deployed independently. Handles purely presentation and UX. All recruitment data is fetched securely from the Independent Express API.
- **Independent Express API**: Located in `api/`. This is the authoritative source for authentication, authorization, session management, scheduling, candidate logic, and database interactions.
- **Database**: PostgreSQL (managed via Prisma ORM exclusively inside the API).

---

## 📖 System Functioning & Logic

### 1. Role-Based Access Control (RBAC)
The system uses a strict hierarchy: `ADMIN` $\rightarrow$ `LEAD` $\rightarrow$ `RECRUITER` $\rightarrow$ `PANEL` $\rightarrow$ `CANDIDATE`.

- **Department Isolation**: Users (excluding ADMIN) are locked to their `department` field. The `requireDeptAccess` guard in `api/src/lib/auth.ts` ensures that no user can access application or interview data from another department, even if they have the correct role.
- **Permission Checks**: Every API route uses `requireRoles(...)` to verify the user's rank and `requireApplicationAccess(...)` to verify their department ownership of the resource.

### 2. State Machine: Application Statuses
The recruitment flow is managed as a finite state machine.

**The Flow:**
`APPLIED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW_SCHEDULED` $\rightarrow$ `INTERVIEWED` $\rightarrow$ `SELECTED`/`WAITLISTED`/`REJECTED`

**Crucial Logic:**
- **Transitions**: Defined in the API logic. A status cannot be skipped (e.g., you cannot move from `APPLIED` directly to `INTERVIEWED`).
- **Role Constraints**: Only **LEADs** can schedule interviews or make final decisions.
- **Terminal States**: `SELECTED` and `REJECTED` are terminal; no further transitions are allowed.

### 3. Interview Scheduling & Conflict Detection
The API handles the complex logic of ensuring no double-booking.

- **Candidate Conflict**: Checks if the applicant already has an interview scheduled during the requested time slot.
- **Panelist Conflict**: Checks if *any* of the assigned panelists are already booked in another interview during that slot.
- **Logic**: It uses a "time overlap" formula: `(start1 < end2) AND (end1 > start2)`.

### 4. Feedback & Decision Loop
1. **Interview Completion**: An interview is marked as `COMPLETED` by a Lead.
2. **Feedback Submission**: Panelists submit ratings and a `FeedbackRecommendation` (e.g., `STRONG_HIRE`).
3. **Decision Guard**: The `/api/lead/applications/[id]/decision` route prevents a final decision unless at least one completed interview has associated feedback, unless the `override` flag is passed.

---

## 🔌 Integration Guide

### 1. Authentication Integration
The platform is designed to be a companion to a "Main Site". 

- **Auth Proxy**: The `/api/auth/login` route acts as a proxy. It sends credentials to the `MAIN_SITE_API` and receives a JWT.
- **Token Sync**: The system stores the JWT in both `localStorage` (for client-side API calls) and an `httpOnly` cookie (for server-side rendering/guards).
- **User Sync**: The `getUserFromToken` function in the API layer fetches the latest user data from the database using the email in the JWT to ensure role/department changes are reflected immediately.

### 2. Database Integration
- **Prisma ORM**: Used exclusively inside the `api/` directory.
- **BigInt Handling**: The `User` model uses `BigInt` for IDs. All API routes convert `BigInt` to `Number` or `String` before returning JSON.

### 3. Email & Notifications
- **SMTP**: Uses `nodemailer`. If `SMTP_USER` is missing, it fails gracefully by logging the email content to the console.
- **Event Triggers**: Notifications are triggered inside the same database transaction as the status update to ensure consistency.

---

## 🛠️ Setup Instructions

### 1. Database & Environment
Ensure you have a PostgreSQL instance running.

Create a `.env` file at the root of the project for the Frontend:
```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Create a `.env` file inside `api/` for the Backend:
```env
# Backend Configuration
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/hackclub_db"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
```

### 2. Independent API Setup
The API is fully self-contained.
```bash
cd api
pnpm install
npx prisma generate
npx prisma db push
pnpm run dev
```
*The API will start on `http://localhost:3001`.*

### 3. Frontend Setup
```bash
# From the root directory
pnpm install
pnpm run dev
```
*The Frontend will start on `http://localhost:3000`.*

---

## ⚠️ Known Bugs & Technical Debt
- **Department Filter Leak**: The `ApplicationTable` filter is client-side based on the current page.
- **Notification Type Casting**: Some mismatches between `bigint` and `number` IDs.
- **Checkbox Logic**: "Select All" functionality doesn't correctly calculate partial selections across paginated data.
- **Lead Dashboard Routing**: Internal tab state is not fully synchronized with URL query parameters.
- **Recruiter Stats**: Statistics card in the Recruiter view is currently a UI placeholder.

---

## 🛠️ Maintenance Checklist
- **To add a new status**: Update the status enum in the API $\rightarrow$ update `VALID_TRANSITIONS` $\rightarrow$ update `ROLE_TRANSITION_PERMISSIONS`.
- **To add a new role**: Update the Role enum in the API $\rightarrow$ update `requireRoles` in relevant API routes.
- **To change DB schema**: Modify `api/prisma/schema.prisma` $\rightarrow$ `npx prisma migrate dev` $\rightarrow$ `npx prisma generate`.

---

## 📜 API Documentation
For full details on the registered API endpoints, architecture, and environment configuration, please see [API.md](./API.md).
