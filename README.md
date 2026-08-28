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

## Setup Instructions

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

The API is fully self-contained and strictly decoupled from the frontend. It has its own `package.json` and `pnpm-lock.yaml`.

```bash
cd api
pnpm install
npx prisma generate
npx prisma db push
```

#### Running the API (Development)
```bash
pnpm run dev
```
*The API will start on `http://localhost:3001`.*

#### Building the API (Production)
```bash
pnpm run build
pnpm run start
```

### 3. Frontend Setup

The frontend consumes the Independent API via the centralized `fetchApi` client. It requires the API to be running to function properly.

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

## API Documentation

For full details on the registered API endpoints, please see [API.md](./API.md).
