# Transaction Ledger API

Backend API for a simple transaction ledger: accounts, credit/debit transactions, balances,
paginated history, and a bonus atomic money transfer.

**Stack:** Node.js, Express, PostgreSQL (Supabase), `pg`. Architecture: Routes -> Controllers -> Services -> Models.

## Project structure
```
src/
  config/db.js                 pg pool + withTransaction() helper
  routes/                      URL -> controller mapping
  controllers/                 request validation + response shaping
  services/ledgerService.js    business rules + DB transactions (atomicity, locking)
  models/                      SQL only (accounts, transactions)
  middleware/errorHandler.js   consistent error responses
  utils/                       AppError, validators
  db/schema.sql                tables, constraints, immutability trigger
scripts/smoke-test.js          end-to-end checks for the assignment rules
```

## Setup
1. **Supabase**: create a project, open *SQL Editor*, paste `src/db/schema.sql`, run it.
2. Supabase -> *Connect* -> copy the **Session pooler** connection string (works on IPv4 networks).
3. ```bash
   cp .env.example .env      # paste DATABASE_URL (with your DB password)
   npm install
   npm run dev               # or: npm start
   ```
4. Check: `GET http://localhost:3000/health`
5. Optional full check: `npm run test:smoke` (server must be running)

### Local Postgres instead of Supabase
Set `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname` and `DB_SSL=false`, run `schema.sql` on it.

### Docker
```bash
docker build -t ledger-api .
docker run -p 3000:3000 --env-file .env ledger-api
```

## How the important rules are enforced
| Requirement | How |
|---|---|
| Atomic transaction + balance update | One DB transaction (`BEGIN/COMMIT/ROLLBACK`) in `withTransaction` |
| No race conditions / negative balance | `SELECT ... FOR UPDATE` on the account row + `UPDATE ... WHERE balance + delta >= 0` + `CHECK (balance >= 0)` |
| Unique reference_id per account | `UNIQUE (account_id, reference_id)` + pre-check returning 409 |
| Immutable transactions | No update/delete routes (405) + DB trigger blocking UPDATE/DELETE |
| Transfer atomicity | Debit + credit in the same DB transaction; accounts locked in id order (no deadlocks) |
| Money precision | `NUMERIC(14,2)`, arithmetic done in SQL, never floats |

See `API.md` for endpoints and `ASSUMPTIONS.md` for assumptions.
