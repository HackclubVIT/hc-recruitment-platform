# 🛠️ HC Recruitment Platform: Integration & Technical Guide

This document provides a deep technical dive into the HackClub VIT Chennai Recruitment Platform. It is intended for developers who need to integrate, maintain, or extend the system.

---

## 📖 System Functioning & Logic

### 1. Role-Based Access Control (RBAC)
The system uses a strict hierarchy: `ADMIN` $\rightarrow$ `LEAD` $\rightarrow$ `RECRUITER` $\rightarrow$ `PANEL` $\rightarrow$ `CANDIDATE`.

- **Department Isolation**: Users (excluding ADMIN) are locked to their `department` field. The `requireDeptAccess` guard in `lib/guards.ts` ensures that no user can access application or interview data from another department, even if they have the correct role.
- **Permission Checks**: Every API route uses `requireRoles(...)` to verify the user's rank and `requireApplicationAccess(...)` to verify their department ownership of the resource.

### 2. State Machine: Application Statuses
The recruitment flow is managed as a finite state machine defined in `lib/status.ts`.

**The Flow:**
`APPLIED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `SHORTLISTED` $\rightarrow$ `INTERVIEW_SCHEDULED` $\rightarrow$ `INTERVIEWED` $\rightarrow$ `SELECTED`/`WAITLISTED`/`REJECTED`

**Crucial Logic:**
- **Transitions**: Defined in `VALID_TRANSITIONS`. A status cannot be skipped (e.g., you cannot move from `APPLIED` directly to `INTERVIEWED`).
- **Role Constraints**: `ROLE_TRANSITION_PERMISSIONS` defines *who* can trigger a move. Only **LEADs** can schedule interviews or make final decisions.
- **Terminal States**: `SELECTED` and `REJECTED` are terminal; no further transitions are allowed.

### 3. Interview Scheduling & Conflict Detection
The `lib/conflict.ts` utility handles the complex logic of ensuring no double-booking.

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
- **User Sync**: The `getUserFromToken` function in `lib/auth.ts` fetches the latest user data from the database using the email in the JWT to ensure role/department changes are reflected immediately.

### 2. Database Integration
- **Prisma ORM**: Uses SQLite for development (`dev.db`). To switch to production, update `DATABASE_URL` to PostgreSQL.
- **BigInt Handling**: The `User` model uses `BigInt` for IDs to match the main site's scale. **Warning**: JSON cannot natively serialize BigInt. All API routes must manually convert `BigInt` to `Number` or `String` before returning `NextResponse.json()`.

### 3. Email & Notifications
- **SMTP**: Uses `nodemailer`. If `SMTP_USER` is missing, it fails gracefully by logging the email content to the console.
- **Event Triggers**: Notifications are triggered inside the same database transaction as the status update to ensure consistency.

---

## ⚠️ Known Bugs & Technical Debt

If you are integrating this, be aware of the following existing issues:

### 🔴 High Priority
- **Department Filter Leak**: The `ApplicationTable` filter is client-side based on the current page. It does not reflect the global set of departments.
- **Notification Type Casting**: There is a mismatch where `bigint` IDs from Prisma are passed to notification functions expecting `number`. This causes silent failures or runtime errors in certain environments.
- **Checkbox Logic**: The "Select All" functionality in the application table does not correctly calculate partial selections across paginated data.

### 🟡 Medium Priority
- **Lead Dashboard Routing**: The `/applications` and `/interviews` paths simply re-render the main dashboard. The internal tab state is not fully synchronized with the URL query parameters.
- **Recruiter Stats**: The statistics card in the Recruiter view is currently a UI placeholder (hardcoded to 0).
- **Admin Permissions**: `ADMIN` is not explicitly listed in `ROLE_TRANSITION_PERMISSIONS`, which may cause `canTransition` to return false despite the admin's overall power.

### 🔵 Low Priority
- **Navbar Spacing**: `pt-20` on the Recruiter page may cause layout shifts on different screen sizes.
- **Error Messaging**: Most API failures return a generic 400/500 error without a detailed user-facing message in the UI.

---

## 🛠️ Maintenance Checklist

- [ ] **To add a new status**: Update `ApplicationStatus` in `lib/status.ts` $\rightarrow$ update `VALID_TRANSITIONS` $\rightarrow$ update `ROLE_TRANSITION_PERMISSIONS`.
- [ ] **To add a new role**: Update `Role` in `lib/status.ts` $\rightarrow$ update `requireRoles` in relevant API routes.
- [ ] **To change DB schema**: Modify `schema.prisma` $\rightarrow$ `npx prisma migrate dev` $\rightarrow$ `npx prisma generate`.
