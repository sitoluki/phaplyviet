# Environment Variables Documentation

This document describes all environment variables used by the Phaplyviet Legal AI project.

## Overview

The project uses environment variables to configure:
- Database connections (PostgreSQL URLs for development, testing, and real ingestion)
- Test execution (flag to enable/disable PostgreSQL integration tests)

Use `.env.example` as a baseline for local variables (copy to `.env` for tooling that loads it). Environment variables can also be passed via shell export or inline when running scripts. See `TASKS.md` Phase 0 for env documentation status.

## Variables by Phase

### 1. Database Phase (Required for Real Ingestion & DB Tests)

#### DATABASE_URL

**Name**: `DATABASE_URL`

**Phase**: Database, Ingestion, Runtime

**Type**: String (PostgreSQL connection string)

**Where Used**:
- `scripts/run-real-ingestion.ts` - Real document ingestion against PostgreSQL
- `scripts/inspect-documents.ts` - Document inspection and reporting
- `scripts/validate-idempotency.ts` - Re-ingestion validation testing
- `packages/db/src/connection.ts` - Database connection pool initialization

**Required**: Yes (has default fallback)

**Default Value**: `postgresql://localhost:5432/phaplyviet_legal`

**Example Values**:

```bash
# Local development with default password
DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal

# Docker container (if running Postgres in Docker)
DATABASE_URL=postgresql://postgres:dev@172.17.0.2:5432/phaplyviet_legal

# Remote staging database
DATABASE_URL=postgresql://dbuser:securepassword@staging-db.example.com:5432/phaplyviet_legal

# With SSL (production)
DATABASE_URL=postgresql://dbuser:password@db.example.com:5432/phaplyviet_legal?sslmode=require

# With connection pooling (PgBouncer)
DATABASE_URL=postgresql://user:password@pgbouncer:6432/phaplyviet_legal
```

**Connection String Format**:
```
postgresql://[username[:password]@][host][:port]/[database][?options]
```

**Safe Default for Local Dev**:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaplyviet_legal
```

**Notes**:
- Uses PostgreSQL `pg` client library
- Pool is created with max 20 connections, 30s idle timeout, 2s connection timeout
- Migrations are run automatically when scripts initialize the connection
- No password encoding is required (special chars should be percent-encoded)

---

#### TEST_DATABASE_URL

**Name**: `TEST_DATABASE_URL`

**Phase**: Test/Database

**Type**: String (PostgreSQL connection string)

**Where Used**:
- `tests/postgres-integration.test.ts` - PostgreSQL repository integration tests

**Required**: No (only if running PostgreSQL integration tests)

**Default Value**: `postgresql://localhost:5432/phaplyviet_legal_test`

**Example Values**:

```bash
# Separate test database
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal_test

# Same as main DB (not recommended, will interfere with data)
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal

# In-memory or ephemeral test instance
TEST_DATABASE_URL=postgresql://postgres:password@testdb:5432/phaplyviet_legal
```

**Safe Default for Local Tests**:
```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaplyviet_legal_test
```

**Notes**:
- Only required if `RUN_DB_TESTS=1` is set
- Should point to a separate database from `DATABASE_URL` to avoid test data contamination
- Migrations will auto-run against this database if tests execute
- Can be the same as `DATABASE_URL` for single-database setups (not recommended)

---

### 2. Testing Phase (Optional)

#### RUN_DB_TESTS

**Name**: `RUN_DB_TESTS`

**Phase**: Testing

**Type**: Boolean (any non-empty string = true, unset/empty = false)

**Where Used**:
- `tests/postgres-integration.test.ts` - Controls whether PostgreSQL integration tests run

**Required**: No (tests are skipped by default)

**Default Value**: Undefined (tests skipped)

**Example Values**:

```bash
# Enable tests
RUN_DB_TESTS=1
RUN_DB_TESTS=true
RUN_DB_TESTS=yes
RUN_DB_TESTS=enabled

# Disable tests (same as unset)
# (do not set the variable)
```

**Safe Default for Local Dev**:
```bash
RUN_DB_TESTS=1
```

**Notes**:
- Tests use Vitest's `.skipIf()` to avoid breaking CI pipelines if database is unavailable
- Without this variable, `npm test` will skip PostgreSQL integration tests
- Set to any non-empty string to enable (implementation uses `!process.env.RUN_DB_TESTS` to skip)
- MongoDB/optional database tests may use this pattern in future phases

---

## Environment Setup by Use Case

### Case 1: Run Real Ingestion Against PostgreSQL

```bash
# Required variables
export DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal

# Then run
tsx scripts/run-real-ingestion.ts
```

**Minimum Environment**:
- ✅ DATABASE_URL (required)
- ❌ TEST_DATABASE_URL (not needed)
- ❌ RUN_DB_TESTS (not needed)

---

### Case 2: Run Document Inspection/Reporting

```bash
# Required variables
export DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal

# Then run
tsx scripts/inspect-documents.ts
```

**Minimum Environment**:
- ✅ DATABASE_URL (required)
- ❌ TEST_DATABASE_URL (not needed)
- ❌ RUN_DB_TESTS (not needed)

---

### Case 3: Validate Idempotency/Re-ingestion

```bash
# Required variables
export DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal

# Then run
tsx scripts/validate-idempotency.ts
```

**Minimum Environment**:
- ✅ DATABASE_URL (required)
- ❌ TEST_DATABASE_URL (not needed)
- ❌ RUN_DB_TESTS (not needed)

---

### Case 4: Run PostgreSQL Integration Tests

```bash
# Required variables
export TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal_test
export RUN_DB_TESTS=1

# Then run
npm test
```

**Minimum Environment**:
- ❌ DATABASE_URL (not used)
- ✅ TEST_DATABASE_URL (required)
- ✅ RUN_DB_TESTS (required)

---

### Case 5: Run All Tests (Unit + PostgreSQL Integration)

```bash
# Required variables (both databases)
export DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal
export TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/phaplyviet_legal_test
export RUN_DB_TESTS=1

# Then run
npm test
```

**Minimum Environment**:
- ✅ DATABASE_URL (recommended for consistency)
- ✅ TEST_DATABASE_URL (required)
- ✅ RUN_DB_TESTS (required)

---

### Case 6: Local Development Setup (Complete)

```bash
# All variables for full local development

# Database
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaplyviet_legal

# Testing
export TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaplyviet_legal_test
export RUN_DB_TESTS=1

# Then run any scripts
npm test                     # All tests
tsx scripts/run-real-ingestion.ts
tsx scripts/inspect-documents.ts
tsx scripts/validate-idempotency.ts
```

**Minimum Environment**:
- ✅ DATABASE_URL (required)
- ✅ TEST_DATABASE_URL (required if RUN_DB_TESTS=1)
- ✅ RUN_DB_TESTS (required to run postgres tests)

---

## Loading Environment Variables

### Method 1: Inline with Command

```bash
DATABASE_URL=postgresql://localhost:5432/phaplyviet_legal tsx scripts/run-real-ingestion.ts
```

### Method 2: Export in Shell

```bash
export DATABASE_URL=postgresql://localhost:5432/phaplyviet_legal
tsx scripts/run-real-ingestion.ts
```

### Method 3: Create .env File (Optional)

If you prefer to use a `.env` file (not required, but helpful):

```bash
# Copy the example
cp .env.example .env

# Edit .env with your values
# nano .env

# Load before running
export $(cat .env | xargs)
npm test
```

### Method 4: Use Node.js --require (dotenv manually)

If future versions add dotenv support:

```bash
# Would work like
node --require dotenv/config scripts/run-real-ingestion.ts
```

Currently not implemented (project does not use dotenv).

---

## Environment Variables Summary Table

| Variable | Phase | Used In | Required | Default | Example |
|----------|-------|---------|----------|---------|---------|
| `DATABASE_URL` | Database, Ingestion | scripts/run-real-ingestion.ts, inspect-documents.ts, validate-idempotency.ts | Yes | `postgresql://localhost:5432/phaplyviet_legal` | `postgresql://user:pass@db:5432/legal` |
| `TEST_DATABASE_URL` | Testing | tests/postgres-integration.test.ts | Conditional* | `postgresql://localhost:5432/phaplyviet_legal_test` | `postgresql://user:pass@testdb:5432/legal_test` |
| `RUN_DB_TESTS` | Testing | tests/postgres-integration.test.ts | Conditional** | Undefined (false) | `1`, `true`, `yes` |

*Only required if RUN_DB_TESTS is set  
**Only required if you want PostgreSQL integration tests to run

---

## Future Environment Variables (Not Yet Implemented)

These variables are expected in future phases but are **not currently used**:

- `NODE_ENV` - (Phase 5+) Runtime environment (development/staging/production)
- `LOG_LEVEL` - (Phase 5+) Logging level (debug/info/warn/error)
- `SUPABASE_URL` - (Phase 6+) Supabase backend URL for auth
- `SUPABASE_KEY` - (Phase 6+) Supabase anonymous key
- `OPENAI_API_KEY` - (Phase 5+) LLM provider key
- `S3_BUCKET` - (Phase 4+) Object storage for snapshots
- `VECTOR_SEARCH_ENABLED` - (Phase 4+) Feature flag for vector search

**Note**: Do not set these now; they will be documented when implemented.

---

## Security Best Practices

### ✅ DO:

- Use `.gitignore` to exclude `.env` files from version control
- Include `.env.example` with safe/default values in the repository
- Use separate DATABASE_URLs for development, testing, and production
- Use strong passwords for production databases
- Restrict file permissions on `.env` files (`chmod 600 .env`)
- Rotate database passwords regularly
- Use environment-specific credentials (no shared passwords)

### ❌ DON'T:

- Commit `.env` files with real credentials to git
- Use the same password across environments
- Expose database URLs in logs or error messages
- Use default passwords in production
- Share `.env` files in chat/email/docs
- Store credentials in code comments

---

## Troubleshooting

### "Cannot find database" Error

```
Error: connect ENOENT /var/run/postgresql/.s.PGSQL.5432
```

**Solution**: PostgreSQL is not running.

```bash
# macOS
brew services start postgresql

# Docker
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=phaplyviet_legal \
  postgres:latest
  
# Linux
sudo systemctl start postgresql
```

### "Connection refused" Error

```
Error: getaddrinfo ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Database URL is incorrect or PostgreSQL is not accessible.

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Or use a correct example
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaplyviet_legal
```

### "Tests Skipped" or "Tests Not Running"

**Solution**: RUN_DB_TESTS is not set.

```bash
# Enable tests
export RUN_DB_TESTS=1

# Then run
npm test
```

### "Wrong Database" or "Test Data Contaminated"

**Solution**: TEST_DATABASE_URL is pointing to the same database as DATABASE_URL.

```bash
# Use separate databases
export DATABASE_URL=postgresql://localhost:5432/phaplyviet_legal
export TEST_DATABASE_URL=postgresql://localhost:5432/phaplyviet_legal_test

# Create test database
createdb phaplyviet_legal_test

# Run tests
npm test
```

---

## References

- [Real Ingestion Validation](./real-ingestion-validation.md) - How to run real ingestion
- [Phase 3 Completion Summary](./phase-3-completion-summary.md) - Database setup details
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/libpq-connect.html) - Connection string format
- `.env.example` - Template file in project root
