# Independent Express API Reference

The backend operates as an independent Express service listening on the configured port. All requests from the Next.js frontend are directed to this API.

## Core Services

### Authentication
- `POST /api/auth/login` - Authenticate a user and issue a JWT cookie.
- `POST /api/auth/logout` - Clear the active session.
- `GET /api/auth/me` - Retrieve the currently authenticated user session.

### Recruitment Applications
- `GET /api/applications` - Retrieve all applications (Paginated).
- `GET /api/applications/:id` - Get details of a specific application.
- `PUT /api/applications/:id` - Update the recruitment workflow status of an application.

### Candidates
- `GET /api/candidates` - Retrieve all candidates.
- `GET /api/candidates/:id` - Get candidate profile and history.

### Interviews & Scheduling
- `GET /api/interviews` - Fetch scheduled, completed, and pending interviews.
- `GET /api/interviews/:id` - Fetch specific interview details.
- `POST /api/interviews/schedule` - Schedule a new interview round (Checks overlap).
- `PUT /api/interviews/:id` - Reschedule an existing interview (Checks overlap).

### Panels
- `GET /api/panels` - Fetch available interview panels and members.

### Forms & Dynamic Questions
- `GET /api/forms` - List recruitment application forms.
- `GET /api/forms/:id` - Get dynamic form schema.

### Feedback
- `POST /api/feedback` - Submit interview feedback (Only panel members).

### Notifications
- `GET /api/notifications` - Retrieve all unread notifications.
- `PUT /api/notifications/read` - Mark specific notifications as read.

### Auditing & Analytics
- `GET /api/analytics` - Retrieve high-level recruitment metrics.
- `GET /api/audit-logs` - Query historical administrative actions.

## Notes
- All backend files are strictly confined to the `api/` directory.
- `app/api` does not exist; the Next.js API routes have been completely phased out.
