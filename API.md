# Independent Express API Reference

The HackClub VIT Recruitment Platform employs a standalone Express API backend that holds the authoritative implementation of database queries, user authentication, and business logic. 

## Base URL
The API runs at `http://localhost:3001/api` locally, or the origin deployed at `NEXT_PUBLIC_API_URL` for the frontend.

## Authentication & Authorization
All authenticated routes rely on an `httpOnly`, `secure`, and `sameSite: 'lax'` (or `'none'` for cross-domain) cookie issued upon login via `/api/auth/login`. 
The Next.js frontend must pass `credentials: "include"` for all standard requests.

Roles available for authorization:
- `ADMIN`
- `RECRUITER`
- `PANEL_MEMBER`
- `APPLICANT`

## Core Endpoints

### System
- `GET /api/health`: Returns API status and database connectivity.
- `GET /api/analytics`: Returns system-wide statistics for the dashboard.
- `GET /api/audit-logs`: Retrieves system audit trails.

### Authentication (`/api/auth/*`)
- `POST /login`: Authenticates a user and sets the JWT cookie.
- `POST /logout`: Clears the JWT cookie.
- `GET /me`: Returns the current user's session data.

### Users (`/api/users/*`)
- `GET /`: Lists all system users (Admins only).
- `POST /`: Creates a new user.
- `PUT /`: Updates an existing user.
- `DELETE /`: Removes a user.

### Forms (`/api/forms/*`)
- `GET /`: Lists all recruitment forms.
- `POST /`: Creates a new form.
- `GET /:id`: Gets details of a specific form.
- `PUT /:id`: Updates form configuration (publishing, closing).
- `DELETE /:id`: Deletes a form.
- `POST /:id/questions`: Adds a question to the form.
- `PUT /:id/questions/:questionId`: Edits a specific question.
- `DELETE /:id/questions/:questionId`: Removes a question.

### Applications (`/api/applications/*`)
- `GET /`: Lists applications (filtered by Role & Department).
- `POST /`: Submits a candidate application.
- `GET /:id`: Retrieves application by ID.
- `PUT /:id`: Updates the status of an application (e.g., Shortlisted, Rejected).

### Candidates (`/api/candidates/*`)
- `GET /`: Lists all available candidates.
- `GET /:id`: Fetches a candidate's profile.

### Panels & Members (`/api/panels/*`)
- `GET /`: Lists interview panels.
- `POST /`: Creates a new panel.
- `PUT /`: Updates panel details.
- `DELETE /`: Removes a panel.
- `POST /members`: Adds a user to a panel.
- `DELETE /members`: Removes a user from a panel.
- `GET /dashboard`: Fetches assigned panels and schedule for a Panel Member.

### Interviews (`/api/interviews/*`)
- `GET /`: Lists scheduled interviews.
- `POST /schedule`: Schedules an interview between a Candidate and a Panel. Handles conflict prevention.
- `GET /:id`: Retrieves details for a specific interview.
- `PUT /:id`: Updates interview status (e.g., COMPLETED, CANCELLED).

### Feedback (`/api/feedback/*`)
- `POST /`: Submits feedback for an interview round. Auto-links the application state.

### Notifications (`/api/notifications/*`)
- `GET /`: Gets notifications for the authenticated user.
- `PUT /read`: Marks user notifications as read.
