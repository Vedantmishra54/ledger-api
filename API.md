# API Documentation

Base URL: `http://localhost:3000`  |  All bodies are JSON.

**Success:** `{ "success": true, "data": ... }`
**Error:** `{ "success": false, "error": { "code": "...", "message": "...", "details": {...optional} } }`

## Error codes
| HTTP | code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | name/reference_id missing or invalid, same source & destination in transfer |
| 400 | `INVALID_REQUEST_BODY` | body missing, not an object, or malformed JSON |
| 400 | `INVALID_ACCOUNT_ID` | id is not a valid UUID |
| 400 | `INVALID_TRANSACTION_TYPE` | type not `credit` / `debit` |
| 400 | `INVALID_AMOUNT` | not a number, <= 0, > 2 decimals, too large |
| 400 | `INVALID_PAGINATION` | bad `page` / `limit` |
| 404 | `ACCOUNT_NOT_FOUND` | account does not exist |
| 405 | `TRANSACTION_IMMUTABLE` | PUT/PATCH/DELETE on a transaction |
| 409 | `DUPLICATE_TRANSACTION` | reference_id already used for this account (existing txn in `details`) |
| 422 | `INSUFFICIENT_BALANCE` | debit/transfer larger than balance |
| 500 | `INTERNAL_ERROR` | unexpected error |

---
## 1. Create account: `POST /accounts`
```json
{ "name": "Vedant" }
```
`201`
```json
{ "success": true, "data": { "id": "uuid", "name": "Vedant", "balance": 0, "created_at": "2026-10-28T10:00:00.000Z" } }
```
A `balance` sent by the client is ignored; initial balance is always 0.

## 2. Add transaction: `POST /accounts/:id/transactions`
```json
{ "type": "credit", "amount": 50, "description": "salary", "reference_id": "ref-001" }
```
`201`
```json
{ "success": true, "data": {
  "transaction": { "id": "uuid", "account_id": "uuid", "type": "credit", "amount": 50,
                   "description": "salary", "reference_id": "ref-001", "created_at": "..." },
  "balance": 150 } }
```
Errors: 400, 404, 409 (duplicate), 422 (insufficient balance).

## 3. Get balance: `GET /accounts/:id/balance`
`200` -> `{ "success": true, "data": { "account_id": "uuid", "balance": 150 } }`

## 4. Transaction history: `GET /accounts/:id/transactions`
Query: `type` (`credit`|`debit`, optional), `page` (default 1), `limit` (default 10, max 100).
Sorted latest first (`created_at DESC`).
```
GET /accounts/<id>/transactions?type=debit&page=1&limit=10
```
`200`
```json
{ "success": true, "data": [ { "id": "...", "type": "debit", "amount": 30, "...": "..." } ],
  "pagination": { "current_page": 1, "page_size": 10, "total_records": 25, "total_pages": 3 } }
```

## 5. Transfer (bonus): `POST /transfers`
```json
{ "from_account_id": "uuid", "to_account_id": "uuid", "amount": 30, "reference_id": "tr-001", "description": "rent" }
```
`201`
```json
{ "success": true, "data": { "debit_transaction": {}, "credit_transaction": {},
  "balances": { "<from_id>": 70, "<to_id>": 80 } } }
```
Atomic: if anything fails nothing is saved. Errors: 400, 404, 409, 422.

## Immutability
`PUT/PATCH/DELETE /accounts/:id/transactions/:txId` -> `405 TRANSACTION_IMMUTABLE`.
