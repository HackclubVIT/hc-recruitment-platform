# Recruitment Platform API Documentation

## Architecture

The recruitment platform uses Next.js API routes (`app/api/`) as the canonical backend. These routes are independently deployable and own all authentication, authorization, database connectivity (Prisma), and business logic.

```
Main Website ──┐
               ├──▶ API (app/api/) ──▶ PostgreSQL
Recruitment ───┘
Website
```

### Base URL

All API requests use the environment variable `NEXT_PUBLIC_API_URL`. In local development this defaults to `""` (same origin). In production, point it to the deployed API origin.

### Authentication

HTTP-only session cookies. No Bearer tokens, no localStorage, no sessionStorage.

- Cookie name: `session`
- Algorithm: HS256 JWT
- Expiry: 7 days
- `JWT_SECRET` is **mandatory** in production (runtime error if missing)

### Roles

| Role | Access |
|------|--------|
| `ADMIN` | Full access to all resources |
| `RECRUITER` | Only assigned department candidates/applications/interviews |
| `PANEL_MEMBER` | Only interviews assigned to their panel |

---

## Endpoints

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Returns `{ status, database }` |

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | No | Login with `{ email, password }`. Rejects inactive users. Sets session cookie. |
| `GET` | `/api/auth/me` | Yes | Returns current user from session cookie |
| `POST` | `/api/auth/logout` | Yes | Clears session cookie |

### Users (Admin only)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/users` | Admin | List all users |
| `POST` | `/api/users` | Admin | Create user with `{ name, email, password, role, departments }` |
| `PUT` | `/api/users` | Admin | Update user with `{ id, name, email, role, departments, active }` |
| `DELETE` | `/api/users` | Admin | Delete user with `{ id }` |

### Forms

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/forms` | Admin | List all forms |
| `POST` | `/api/forms` | Admin | Create form with `{ title, description }` |
| `GET` | `/api/forms/:id` | Any | Get form with questions |
| `PUT` | `/api/forms/:id` | Admin | Update form `{ title, description, status }` |
| `DELETE` | `/api/forms/:id` | Admin | Delete form and its questions |

### Form Questions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/forms/:id/questions` | Admin | Add question (DRAFT forms only). Types: TEXT, PARAGRAPH, RADIO, DROPDOWN, CHECKBOX |
| `PUT` | `/api/forms/:id/questions/:qid` | Admin | Update question (DRAFT forms only) |
| `DELETE` | `/api/forms/:id/questions/:qid` | Admin | Delete question (DRAFT forms only) |

### Applications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/applications` | No | Submit application. Validates form questions, HTTPS resume URL, rejects closed/unpublished forms, rejects duplicates. |
| `GET` | `/api/applications` | Yes | Paginated list. Params: `page, limit, search, status, department, date`. Recruiter: department-filtered. Panel: interview-filtered. Returns `{ items, page, limit, total, totalPages }` |
| `GET` | `/api/applications/:id` | Yes | Single application with authorization |
| `PUT` | `/api/applications/:id` | Admin/Recruiter | Update status. Validates transitions. Final decisions store `decided_by, decided_at, decision_reason`. |

### Candidates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/candidates` | Yes | Paginated list. Recruiter: department-filtered. Panel: panel-filtered. Returns `{ items, page, limit, total, totalPages }` |
| `GET` | `/api/candidates/:id` | Yes | Full profile with all interview rounds and feedback. Department/panel authorization enforced. |

### Panels

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/panels` | Admin/Recruiter | List panels. Recruiters see active panels only. |
| `POST` | `/api/panels` | Admin | Create panel |
| `PUT` | `/api/panels` | Admin | Update panel `{ id, name, description, status }` |
| `DELETE` | `/api/panels` | Admin | Delete panel |

### Panel Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/panels/members` | Admin | Add member `{ panel_id, user_id }` |
| `DELETE` | `/api/panels/members` | Admin | Remove member `{ panel_id, user_id }` |

### Interviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/interviews` | Yes | List interviews. Role-filtered (recruiter by department, panel member by panel). |
| `POST` | `/api/interviews/schedule` | Admin/Recruiter | Schedule interview. Validates panel active status, candidate eligibility, department authorization. Uses `$transaction` for conflict detection. Auto-calculates round number. Returns 409 on conflicts. |
| `GET` | `/api/interviews/:id` | Yes | Get interview with authorization |
| `PUT` | `/api/interviews/:id` | Admin/Recruiter | Reschedule/update. Validates status enum and transitions. Same conflict detection excluding self. |

#### Interview Statuses
`SCHEDULED` → `IN_PROGRESS` → `COMPLETED` → `FEEDBACK_PENDING` → `FEEDBACK_SUBMITTED`
Any status → `CANCELLED`

### Feedback

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/feedback` | Panel Member | Submit feedback. Validates scores (1-5), decision (RECOMMENDED/MAYBE/REJECTED). Uses `$transaction`. Prevents duplicates (409). Auto-advances interview to FEEDBACK_SUBMITTED when all panel members submit. |

### Dashboards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/recruiter/dashboard` | Recruiter | Real department-scoped stats |
| `GET` | `/api/panels/dashboard` | Panel Member | Real panel-scoped stats |
| `GET` | `/api/analytics` | Admin | System-wide metrics, charts, recent audit activity |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/notifications` | Yes | User's notifications (ownership enforced) |
| `PUT` | `/api/notifications/read` | Yes | Mark read. `{ id }` for single, empty for all. Ownership verified. |

### Audit Logs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/audit-logs` | Admin | Paginated audit trail. Params: `page, limit`. Returns `{ items, page, limit, total, totalPages }` |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid input, missing fields, invalid transitions |
| 401 | Not authenticated |
| 403 | Not authorized (wrong role, wrong department, wrong panel) |
| 404 | Resource not found |
| 409 | Conflict (duplicate feedback, scheduling conflict, duplicate application) |
| 500 | Internal server error |

---

## Environment Variables

| Variable | Required | Exposed to Frontend | Description |
|----------|----------|-------------------|-------------|
| `DATABASE_URL` | Yes | No | PostgreSQL connection string |
| `JWT_SECRET` | Production | No | JWT signing secret |
| `NEXT_PUBLIC_API_URL` | Yes | Yes | API base URL |
| `ALLOWED_ORIGIN` | Production | No | CORS allowed origin |

---

## Email Notifications

Email delivery (SMTP/SendGrid/etc.) is **not implemented**. All notifications are in-app only. Email delivery would require integrating a provider and is documented as out of scope for the current implementation.
