# HackClub VIT — Shared Backend API Documentation

The HackClub VIT backend is a unified, shared REST API service powering:
1. **Main Website Frontend** (Member dashboard, projects, leaderboards, feedback, announcements).
2. **Recruitment Frontend** (Application form submission).
3. **Recruiter & Admin Dashboards** (Application review, multi-department preference management, 10-minute interview scheduling, conflict detection, panel member management, allowlist control).

---

## 1. Base Configuration & Headers

- **Base URL**: Configurable via `VITE_API_BASE_URL` (Defaults to `/api` in local dev).
- **Authentication**: Bearer Token in `Authorization` header:
  ```http
  Authorization: Bearer <JWT_TOKEN>
  ```
- **Content-Type**: `application/json`

---

## 2. Standard HTTP Status Codes

| Code | Status | Description |
| :--- | :--- | :--- |
| `200` | **OK** | Request succeeded; response payload returned. |
| `201` | **Created** | Resource successfully created. |
| `400` | **Bad Request** | Validation failed (missing required fields, invalid format). |
| `401` | **Unauthorized** | Missing or invalid authentication token. |
| `403` | **Forbidden** | Insufficient permissions (role mismatch or unassigned department). |
| `404` | **Not Found** | Target resource does not exist. |
| `409` | **Conflict** | Slot double-booking or unique constraint violation. |
| `429` | **Too Many Requests** | Rate limit exceeded (e.g. password reset code requests). |
| `500` | **Internal Server Error** | Unexpected server error. |

---

## 3. System & Health Endpoints

### `GET /api/health`
- **Auth**: Public (No auth required)
- **Description**: Verifies service liveness and connectivity.
- **Response `200`**:
  ```json
  { "status": "ok" }
  ```

---

## 4. Authentication Endpoints

### `POST /api/auth/login`
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "user@vitstudent.ac.in",
    "password": "Password123!",
    "role": "user"
  }
  ```
- **Response `200`**:
  ```json
  {
    "token": "<JWT_TOKEN>",
    "role": "recruiter",
    "user": {
      "name": "Recruiter User",
      "email": "recruiter@vitstudent.ac.in",
      "role": "recruiter"
    }
  }
  ```

### `POST /api/auth/signup`
- **Auth**: Public (Allowlist verified)
- **Request Body**:
  ```json
  {
    "name": "Full Name",
    "email": "student@vitstudent.ac.in",
    "password": "Password123!",
    "registerNumber": "24BCE1234",
    "department": "Technical"
  }
  ```
- **Response `201`**:
  ```json
  { "success": true, "message": "Registration successful. You can now login." }
  ```

### `POST /api/auth/forgot-password`
- **Auth**: Public (Rate-limited to 1 request / 60 seconds)
- **Request Body**: `{ "email": "student@vitstudent.ac.in" }`
- **Response `200`**:
  ```json
  { "success": true, "message": "Password reset code sent to your email." }
  ```

### `POST /api/auth/verify-reset-code`
- **Auth**: Public
- **Request Body**: `{ "email": "student@vitstudent.ac.in", "code": "123456" }`
- **Response `200`**: `{ "success": true, "message": "Code verified." }`

### `POST /api/auth/reset-password`
- **Auth**: Public
- **Request Body**: `{ "email": "student@vitstudent.ac.in", "code": "123456", "password": "NewPassword123!" }`
- **Response `200`**: `{ "success": true, "message": "Password reset successfully." }`

### `GET /api/auth/me` and `GET /api/users/me`
- **Auth**: `authenticateToken`
- **Response `200`**:
  ```json
  {
    "user": {
      "name": "User Name",
      "email": "user@vitstudent.ac.in",
      "role": "recruiter"
    }
  }
  ```

---

## 5. Recruitment Endpoints

### `POST /api/recruitment/apply`
- **Auth**: Public
- **Description**: Submits a new recruitment application with up to 2 department preferences.
- **Request Body**:
  ```json
  {
    "name": "Candidate Name",
    "registerNumber": "24BCE5678",
    "email": "candidate@vitstudent.ac.in",
    "phoneNumber": "9876543210",
    "firstPreference": "Technical",
    "secondPreference": "Projects",
    "firstPrefReason": "Interest in web/systems",
    "secondPrefReason": "Interest in planning",
    "yearOfStudy": "1st",
    "technicalSkills": ["React", "Node.js", "Python"],
    "skillLevel": "Intermediate"
  }
  ```
- **Response `201`**:
  ```json
  { "success": true, "message": "Application submitted successfully!" }
  ```

### `GET /api/recruitment/applications`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Description**: Returns applications scoped to the recruiter's assigned departments (or all applications for Admins).
- **Response `200`**:
  ```json
  [
    {
      "id": 1001,
      "name": "Aarav Sharma",
      "email": "aarav.sharma@vitstudent.ac.in",
      "registerNumber": "24BCE1001",
      "firstPreference": "Technical",
      "secondPreference": "Projects",
      "firstPrefStatus": "Shortlisted",
      "secondPrefStatus": "Pending",
      "departmentStatuses": {
        "Technical": "Shortlisted",
        "Projects": "Pending"
      },
      "status": "Shortlisted",
      "appliedDate": "2026-08-20"
    }
  ]
  ```

### `PUT /api/recruitment/applications/:id/status`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Description**: Updates the status of a specific department preference (`Pending`, `Under Review`, `Shortlisted`, `Rejected`).
- **Authorization**: Enforces that the authenticated recruiter is assigned to the specified `department`.
- **Request Body**:
  ```json
  {
    "department": "Technical",
    "status": "Shortlisted"
  }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "message": "Technical status updated to Shortlisted (overall: Shortlisted)",
    "application": {
      "id": 1001,
      "firstPrefStatus": "Shortlisted",
      "secondPrefStatus": "Pending",
      "status": "Shortlisted"
    }
  }
  ```

### `DELETE /api/recruitment/applications/:id`
- **Auth**: `authenticateToken`, `requireAdmin`
- **Description**: Deletes a single application.

### `DELETE /api/recruitment/applications/all`
- **Auth**: `authenticateToken`, `requireAdmin`
- **Description**: Clears all application records.

---

## 6. Interview & Scheduling Endpoints

### `GET /api/recruitment/interviews`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Description**: Returns interviews for the recruiter's assigned departments (or all for Admins).
- **Response `200`**:
  ```json
  [
    {
      "id": "iv_1",
      "applicationId": "1001",
      "candidateName": "Aarav Sharma",
      "candidateEmail": "aarav.sharma@vitstudent.ac.in",
      "department": "Technical",
      "scheduledDate": "2026-09-01T00:00:00.000Z",
      "startTime": "10:00",
      "endTime": "10:10",
      "meetingUrl": "https://meet.google.com/abc-defg-hij",
      "status": "SCHEDULED",
      "panelMembers": [
        { "panelName": "Panel Lead", "panelEmail": "lead@vitstudent.ac.in", "department": "Technical" }
      ]
    }
  ]
  ```

### `POST /api/recruitment/interviews`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Validation**:
  - `startTime` and `endTime` must be valid `HH:mm` format representing exactly a 10-minute slot.
  - Recruiter must be authorized for `department`.
  - Double-booking conflict check for both candidate and panel members (`409 Conflict` on overlap).
- **Request Body**:
  ```json
  {
    "applicationId": 1001,
    "department": "Technical",
    "interviewDate": "2026-09-01",
    "startTime": "10:00",
    "endTime": "10:10",
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "panelMembers": [
      { "name": "Panel Member", "email": "panel@vitstudent.ac.in", "department": "Technical" }
    ]
  }
  ```
- **Response `201`**:
  ```json
  {
    "success": true,
    "message": "Interview scheduled successfully.",
    "interview": { "id": "1724719200000", "department": "Technical", "status": "SCHEDULED" }
  }
  ```

### `PUT /api/recruitment/interviews/:id`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Description**: Reschedules interview date/time or updates meeting URL / panel members with conflict validation.
- **Response `200`**:
  ```json
  { "success": true, "message": "Interview updated successfully." }
  ```

### `DELETE /api/recruitment/interviews/:id`
- **Auth**: `authenticateToken`, `requireRecruiter`, `loadRecruiterDepartments`
- **Description**: Soft-cancels an interview (`status: CANCELLED`).
- **Response `200`**:
  ```json
  { "success": true, "message": "Interview cancelled successfully." }
  ```

### `GET /api/recruitment/panels`
- **Auth**: `authenticateToken`, `requireRecruiter`
- **Description**: Returns eligible panel members.
- **Response `200`**:
  ```json
  [
    {
      "id": "1",
      "name": "Recruiter One",
      "email": "recruiter@vitstudent.ac.in",
      "department": "Technical",
      "role": "Recruiter"
    }
  ]
  ```

---

## 7. Global Data & Admin Endpoints

### `GET /api/data`
- **Auth**: `authenticateToken`
- **Description**: Returns core club data (announcements, uploads, projects, members, activities).

### `GET /api/public/leaderboard`
- **Auth**: Public

### `GET /api/projects/leaderboard`
- **Auth**: Public

### `POST /api/projects`
- **Auth**: `authenticateToken`

### `POST /api/projects/:id/rate`
- **Auth**: `authenticateToken`

### `PUT /api/users` & `PUT /api/users/:id` & `DELETE /api/users/:id`
- **Auth**: `authenticateToken`, `requireAdmin`

### `GET /api/allowlist` & `POST /api/allowlist` & `DELETE /api/allowlist/:id`
- **Auth**: `authenticateToken`, `requireAdmin`

---

## 8. Multi-Department Preference Rule Reference

When updating statuses via `PUT /api/recruitment/applications/:id/status`:

```text
Status Computation Hierarchy:
1. ANY preference Shortlisted / Accepted / Interview Scheduled  => Overall: SHORTLISTED
2. ANY preference Under Review                                  => Overall: UNDER_REVIEW
3. ANY preference Pending                                       => Overall: PENDING
4. ALL chosen preferences Rejected                             => Overall: REJECTED
```
