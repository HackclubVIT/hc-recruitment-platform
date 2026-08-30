# Testing Guide

The HC Recruitment Platform enforces strict database isolation for End-to-End (E2E) testing. Because the recruitment API natively binds to the primary HC Main Database, the test runner must never execute against the live environment.

## 1. Prerequisites

To run E2E tests, you must provision an isolated PostgreSQL instance or use an isolated schema namespace within your local database.

## 2. Setting up the Test Database URL

The easiest way to safely isolate tests locally without spinning up a separate Docker container is to use a distinct schema namespace in your existing Postgres connection string. 

Create or update your local `.env` file in the `api/` directory (or export it to your shell). Do **not** overwrite `DATABASE_URL`. Instead, specify `TEST_DATABASE_URL` appending `?schema=test_namespace`:

```env
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/hc_recruitment?schema=test_namespace"
```

## 3. Initializing the Schema

Before running tests, the isolated schema must be initialized with the Prisma models. **Ensure you pass the test URL as the database URL specifically for the push command so you do not accidentally manipulate the live database.**

```bash
cd api
export DATABASE_URL="postgresql://user:password@localhost:5432/hc_recruitment?schema=test_namespace"
npx prisma db push --schema=prisma/schema.prisma
```
*(Note: Do not run `prisma migrate dev` or `prisma migrate reset` against your live `DATABASE_URL`)*

## 4. Running the Tests

Once the test schema is provisioned and migrated, execute the test suite:

```bash
cd api
pnpm test:e2e
```

The test script contains a hard fail-safe check. If `TEST_DATABASE_URL` is omitted, the test will abort immediately:
`CRITICAL ERROR: E2E tests MUST use an isolated TEST_DATABASE_URL to prevent destroying HC data.`

## 5. Cleanup

The E2E script automatically handles safe namespace cleanup during each run. Because the tables exist entirely inside `test_namespace`, your `public` HC data remains 100% untouched.
