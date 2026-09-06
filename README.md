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

- **Recruitment Frontend**: Built with Next.js (App Router), deployed independently. Handles purely presentation and UX. All recruitment data is fetched securely from the HackClub API (`hc-api`).
- **Backend API**: Hosted in [`hc-api`](../hc-api). This is the authoritative source for authentication, authorization, session management, scheduling, candidate logic, and database interactions.
- **Database**: PostgreSQL (managed via Prisma ORM inside `hc-api`).

---

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file at the root of the project for the Frontend:
```env
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 2. Backend Setup (`hc-api`)

The backend REST API is housed in the `hc-api` repository.

```bash
cd ../hc-api
pnpm install
npx prisma generate
npx prisma db push
pnpm dev
```
*The API runs on `http://localhost:5000`.*

### 3. Frontend Setup

The frontend consumes the API via the centralized `fetchApi` client (`src/api-client.ts`).

```bash
# From the root directory
pnpm install
```

#### Running the Frontend (Development)
```bash
pnpm run dev
```
*The Frontend will start on `http://localhost:3000`.*

#### Building the Frontend (Production)
```bash
pnpm run build
pnpm run start
```

*Note: In production, `NEXT_PUBLIC_API_URL` must be set to the live API domain. The frontend will explicitly crash or warn if it attempts to silently fallback to itself.*

---

## Technical Policies

- **No Shared Database Logic**: The frontend must never contain Prisma schema definitions or database queries.
- **API Centralization**: All API calls from the frontend must be routed through `src/api-client.ts` to ensure credentials and JSON headers are systematically attached.
- **Authentication**: JWT-based session cookies are issued directly by the Express API. The cookies are strictly `httpOnly` and validated directly by the backend for every protected route.
- **Strict Workflow Integrity**: Administrative privileges do not bypass the logical recruitment state machine (e.g. `INTERVIEW_SCHEDULED` -> `INTERVIEW_COMPLETED` -> `SELECTED`).

## Local Development & Testing

- Always run the API (`cd ../hc-api && pnpm dev`) and the Frontend (`pnpm dev`) concurrently during local development.
- Utilize standard local tools (e.g., Postman) targeting `http://localhost:5000` for direct API testing.
- Test workflows end-to-end starting from Public Form application submission to Final Decision. Ensure strict isolation mechanisms are respected by switching between Admin, Recruiter, and Panel Member accounts.

## API Documentation

For full details on the registered API endpoints, architecture, and environment configuration, please see [API.md](./API.md).
