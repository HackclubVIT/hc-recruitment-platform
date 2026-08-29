# API Architecture and Documentation

## Core Architecture
This project utilizes a strictly separated API architecture:

- **Main Website**: Static/informational site (ignored in this document).
- **Recruitment Frontend**: Built with Next.js, React, and TailwindCSS. Communicates exclusively with the independent Express API using `src/api-client.ts`. It does not use Next.js API routes (`app/api` is strictly forbidden) and has absolutely zero direct access to PostgreSQL.
- **Independent Express API**: The true backend. Built with Express.js and TypeScript inside the `api/` directory. All database operations, business logic, and authentications happen here.
- **Database**: PostgreSQL accessed purely via Prisma ORM on the Express API layer.

The frontend configures its connection via the `NEXT_PUBLIC_API_URL` environment variable.

## Authentication & Security
- **Mechanism**: JWT (JSON Web Tokens) generated via `jose` and issued as `httpOnly` secure cookies. 
- **Production Safety**: A strong `JWT_SECRET` is strictly required in production; the fallback secret is blocked.
- **CORS**: Enforced strictly using `ALLOWED_ORIGIN`. Wildcard credentials are blocked.

## Authorization Model
All endpoints enforce strict role-based data isolation:
- **ADMIN**: Global access across all departments.
- **RECRUITER**: Access natively restricted to candidates, applications, and interviews within their explicitly assigned `departments`.
- **PANEL_MEMBER**: Minimal access strictly governed by their active Panel assignments.

## Panel Membership Lifecycle
- **Active Rule**: A Panel Member must have `active: true` to view newly scheduled interviews, access dashboards, or receive notifications.
- **Historical Protection**: When removed from a panel or upon changing roles (e.g., to RECRUITER), their membership is soft-deleted (`active: false`). Their historical feedback, interview associations, and audit logs are permanently preserved.

## Timezone Centralization
- **Timezone**: `Asia/Kolkata` is universally applied.
- **Mechanics**: Timezone boundaries (e.g., "Start of Today", "End of Week") are centralized in `api/src/lib/timezone.ts`. The API safely parses these into UTC for Prisma querying, ensuring Panel Dashboards, Recruiter Analytics, and Application filters are completely timezone-immune.

## Endpoints

### Forms (`/api/forms`)
- Supports dynamic question types (`TEXT`, `PARAGRAPH`, `RADIO`, `DROPDOWN`, `CHECKBOX`).
- Strictly validates answers against options and rejects unknown question IDs.
- Prevents deletion if applications are attached; supports closing/unpublishing instead.

### Applications (`/api/applications`)
- Duplicate submissions map natively to a `409` conflict.
- Strictly bounds manual status updates. `INTERVIEW_COMPLETED` cannot be manually forced—it requires full feedback submission natively via the state machine.
- Highly optimized queries return only the data explicitly needed for Panel Members.

### Candidates (`/api/candidates`)
- Enforces data minimization natively in Prisma using single-query relations (e.g., filtering candidates through active interview panels).

### Panels (`/api/panels`)
- Creation and updates enforce strict Zod validation against `ACTIVE` or `INACTIVE` lifecycles.
- Assigns Panel Members logically, prioritizing the reactivation of dormant records (`active: false`) over redundant duplication.

### Interviews & Scheduling (`/api/interviews`)
- **State Machine**: `SCHEDULED` → `IN_PROGRESS` → `COMPLETED` → `FEEDBACK_PENDING` → `FEEDBACK_SUBMITTED`.
- **Double Booking**: Automatically scans active Panel Members and the candidate for time conflicts. Returns `409` globally.
- **Rescheduling**: Validates times strictly and re-runs comprehensive active conflict checks.

### Feedback (`/api/feedback`)
- Requires exact matching of assigned panel members. The system validates whether A, B, and C all submitted (not just 3 random members).
- Once completed natively, the system transitions the interview to `FEEDBACK_SUBMITTED` and the application to `INTERVIEW_COMPLETED`.

### Final Decisions & Further Rounds
- **Final Decisions** (`SELECTED`, `WAITLISTED`, `REJECTED`): Blocked until the application successfully reaches `INTERVIEW_COMPLETED`. Records the decider's ID, reason, and exact timestamp.
- **Further Round**: Seamlessly stages the candidate for a new interview round, wiping intermediate decision metadata and maintaining the active application pipeline.

### Notifications
- Dispatched safely within Prisma transactions. 
- Sent to **active** Panel Members for new schedules.
- Consolidated feedback notification fires exactly once upon total panel completion.

### Analytics & Audit Logs
- **Analytics**: Calculates and groups metrics using absolute localized `Asia/Kolkata` days.
- **Audit Logs**: Irreversibly tracks every state mutation, role assignment, and final decision across the platform permanently.

## Testing Strategy
- **Static Verification**: `tsc --noEmit` and `pnpm build` rigorously prove schema isolation and TypeScript compliance.
- **E2E Capabilities**: Due to strict `httpOnly` cookie and timezone dependencies, end-to-end integration flows are validated natively using node/fetch simulated transactions directly against the Express server's Prisma core.
