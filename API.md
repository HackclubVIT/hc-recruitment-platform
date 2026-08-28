# Independent Express API Reference

The backend operates as an independent Express service listening on the configured port. All requests from the Next.js frontend are directed to this API.

## Architecture
- **Frontend**: Next.js application strictly serving UI. Uses `src/api-client.ts` for all backend requests.
- **Database**: PostgreSQL accessed exclusively by the independent Express API using Prisma.
- **Independent Express API**: The centralized hub for all business logic, authorization, authentication, scheduling, feedback, and database connections.

## Core Services

### Authentication
- `POST /api/auth/login` - Authenticate a user and issue an httpOnly JWT cookie.
- `POST /api/auth/logout` - Clear the active session.
- `GET /api/auth/me` - Retrieve the currently authenticated user session.

### Authorization
All endpoints enforce strictly scoped access.
- **ADMIN**: Global access across all endpoints.
- **RECRUITER**: Access scoped strictly to the candidate's applied `department`.
- **PANEL_MEMBER**: Access scoped strictly to their assigned interview, application, and candidate. Lateral traversal is structurally blocked.

### Recruitment Applications
- `GET /api/applications` - Retrieve all applications.
- `GET /api/applications/:id` - Get details of a specific application.
- `PUT /api/applications/:id` - Update the recruitment workflow status of an application.
- `POST /api/applications` - Submit a new application form publicly.

### Final Decisions
Final decisions (`SELECTED`, `REJECTED`, `WAITLISTED`, `FURTHER_ROUND`) enforce exact completion workflows.
- Cannot be applied without a completed interview.
- Cannot be applied without all required Panel Member feedback successfully submitted.

### Candidates
- `GET /api/candidates` - Retrieve all candidates.
- `GET /api/candidates/:id` - Get candidate profile and history.

### Interviews & Scheduling
- `GET /api/interviews` - Fetch scheduled, completed, and pending interviews.
- `GET /api/interviews/:id` - Fetch specific interview details.
- `POST /api/interviews/schedule` - Schedule a new interview round (checks for double bookings and candidate overlaps using transactions).
- `PUT /api/interviews/:id` - Reschedule or update status (enforces strict state machine `SCHEDULED` -> `IN_PROGRESS` -> `COMPLETED`).

### Panels
- `GET /api/panels` - Fetch available interview panels and members.
- `POST /api/panels` - Create a panel.
- `DELETE /api/panels/:id` - Soft-delete (deactivate) panels with historical interviews.

### Forms & Dynamic Questions
- `GET /api/forms` - List recruitment application forms.
- `GET /api/forms/:id` - Get dynamic form schema.
- `POST /api/forms/:id/questions` - Add a question (only while `DRAFT`).
- `PUT /api/forms/:id/questions/:questionId` - Edit a question.
- `DELETE /api/forms/:id/questions/:questionId` - Delete a question.

### Feedback
- `POST /api/feedback` - Submit interview feedback. Strict `unique(interview_id, panel_member_id)` guarantees uniqueness.

### Notifications
- `GET /api/notifications` - Retrieve all unread notifications.
- `PUT /api/notifications/read` - Mark specific notifications as read.

### Auditing & Analytics
- `GET /api/analytics` - Retrieve high-level recruitment metrics.
- `GET /api/audit-logs` - Query historical administrative actions.

### Health
- `GET /api/health` - Basic liveness probe.

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Backend).
- `JWT_SECRET`: Mandatory in production for signing session cookies (Backend).
- `ALLOWED_ORIGIN`: Defines acceptable CORS origins for the frontend (Backend).
- `NEXT_PUBLIC_API_URL`: Points to the independent Express API (Frontend).

## Testing
- Ensure the API is running locally on port `3001` (or configured).
- End-to-end tests utilize valid user flows matching the strict state machine requirements and database transactions.

## Notes
- All backend files are strictly confined to the `api/` directory.
- `app/api` does not exist; the Next.js API routes have been completely phased out.
