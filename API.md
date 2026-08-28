# Recruitment Platform API Documentation

This document describes the unified, canonical architecture of the HackClub VIT Recruitment and Interview Management Platform. 

## Base Configuration

- **Base URL**: The API client must securely utilize the environment variable `NEXT_PUBLIC_API_URL` to route fetches.
- **CORS Constraints**: strictly configured to allow requests only from explicitly trusted `ALLOWED_ORIGIN` domains (no wildcard production CORS).
- **Authentication**: JWT stored in a secure HttpOnly cookie (`session`). No Bearer tokens or LocalStorage JWTs are permitted.

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Logic**: Validates credentials and checks `user.active === true`. Sets `session` HttpOnly cookie.

### `POST /api/auth/logout`
- **Logic**: Clears the `session` cookie.

### `GET /api/auth/me`
- **Logic**: Returns the currently authenticated user based on the decoded JWT session cookie.

---

## 2. Health Endpoint

### `GET /api/health`
- **Returns**: `{ "status": "ok", "database": "connected" }`

---

## 3. Users Management (Admin)

### `GET /api/users`
- **Returns**: Array of all users (Admins, Recruiters, Panel Members).

### `POST /api/users`
- **Body**: `{ name, email, password, role, departments }`
- **Logic**: Creates a new user.

### `PUT /api/users`
- **Body**: `{ id, name, email, role, departments, active }`
- **Logic**: Updates user details. Inactive users are instantly prevented from logging in.

### `DELETE /api/users`
- **Body**: `{ id }`
- **Logic**: Deletes the specified user (prevents self-deletion).

---

## 4. Forms & Questions

### `GET /api/forms`
- **Returns**: All forms.

### `POST /api/forms`
- **Body**: `{ title, description }`

### `GET /api/forms/:id`
- **Returns**: Specific form with its questions.

### `PUT /api/forms/:id`
- **Body**: `{ title, description, status }`
- **Logic**: Updates form status (DRAFT, PUBLISHED, CLOSED).

### `DELETE /api/forms/:id`
- **Logic**: Deletes the form.

### `POST /api/forms/:id/questions`
- **Body**: `{ question, type, required, options }`
- **Logic**: Adds a new question. (Allowed only if form is in DRAFT state).

### `PUT /api/forms/:id/questions/:questionId`
- **Body**: `{ question, type, required, options }`

### `DELETE /api/forms/:id/questions/:questionId`
- **Logic**: Removes a question from the form.

---

## 5. Applications

### `GET /api/applications`
- **Query Params**: `page`, `limit`, `search`, `status`, `department`, `date`
- **Returns**: Server-side paginated list: `{ items, page, limit, total, totalPages }`.

### `POST /api/applications`
- **Body**: `{ name, email, phone, department, registration_number, resume_url, form_id, answers }`
- **Logic**: Dynamic Zod validation. Validates required fields, checks array bounds for checkbox options. Validates `resume_url` starts with `https://`. Checks for duplicate submissions. Cannot submit to unpublished forms.

### `PUT /api/applications/:id`
- **Body**: `{ status, reason? }`
- **Logic**: Advances application status (e.g., APPLIED -> SHORTLISTED). Final decisions (SELECTED, REJECTED) track decided_by and reason. Validates department authorization for RECRUITER.

---

## 6. Candidates

### `GET /api/candidates`
- **Query Params**: `page`, `limit`, `search`, `status`, `department`, `date`
- **Returns**: Paginated list of candidates bounded by Recruiter department or Panel Member assignments.

### `GET /api/candidates/:id`
- **Returns**: Full candidate profile including complete interview history (all rounds) and feedback scores. Validated by department bounds.

---

## 7. Interviews

### `GET /api/interviews`
- **Returns**: All interviews (scoped by role constraints).

### `POST /api/interviews/schedule`
- **Body**: `{ candidate_id, panel_id, date, start_time, meeting_link }`
- **Logic**: Uses Prisma `$transaction` to guarantee zero double-bookings. Checks candidate eligibility. Checks panel availability. Auto-detects and increments the interview `round`. Returns `409` on conflicts.

### `PUT /api/interviews/:id`
- **Body**: `{ date, start_time, meeting_link, status }`
- **Logic**: Rescheduling validates identical conflict logic (excluding the current slot).

### `DELETE /api/interviews/:id`
- **Logic**: Cancels the interview.

---

## 8. Panels & Panel Members

### `GET /api/panels`
- **Returns**: All panels.

### `POST /api/panels`
- **Body**: `{ name, description }`

### `POST /api/panels/members`
- **Body**: `{ panel_id, user_id }`
- **Logic**: Assigns a Panel Member.

### `DELETE /api/panels/members`
- **Body**: `{ member_id }`
- **Logic**: Unassigns a member.

### `GET /api/panels/dashboard`
- **Returns**: Dashbaord metrics specifically scoped to a Panel Member.

---

## 9. Feedback & Evaluation

### `POST /api/feedback`
- **Body**: `{ interview_id, technical_score, communication_score, problem_solving_score, confidence_score, teamwork_score, comments, recommendation }`
- **Logic**: Computes scores securely. If all required panel members have submitted, automatically advances Interview status to `FEEDBACK_SUBMITTED`.

---

## 10. Dashboards & Analytics

### `GET /api/recruiter/dashboard`
- **Returns**: Real database aggregate counts for Recruiters (Shortlisted, Upcoming, Completed).

### `GET /api/analytics`
- **Returns**: System-wide administrative database metrics (Applications by status, department distribution, interview timeline).

---

## 11. System Operations

### `GET /api/audit-logs`
- **Returns**: Immutable sequence of state modifications (`APPLICATION_SUBMITTED`, `UPDATED_USER`, etc). Properly assigns `user_id` context.

### `GET /api/notifications`
- **Returns**: Owned system notifications.

### `POST /api/notifications/read`
- **Body**: `{ id }`
- **Logic**: Acknowledges a notification securely checking ownership boundaries.
