const { pool } = require('../config/db');

const format = (r) => r && ({
  id: r.id,
  name: r.name,
  balance: Number(r.balance), // NUMERIC comes back as string from pg
  created_at: r.created_at,
});

async function create(name) {
  const { rows } = await pool.query('INSERT INTO accounts (name) VALUES ($1) RETURNING *', [name]);
  return format(rows[0]);
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
  return format(rows[0]);
}

// Row-level lock. Ordered by id so two concurrent transfers can never deadlock.
async function lockByIds(client, ids) {
  const { rows } = await client.query(
    'SELECT id FROM accounts WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE',
    [ids]
  );
  return rows.map((r) => r.id);
}

// Atomic "balance + delta, but never below 0". Returns false if it would go negative.
async function applyDelta(client, id, delta) {
  const { rowCount } = await client.query(
    'UPDATE accounts SET balance = balance + $1::numeric WHERE id = $2 AND balance + $1::numeric >= 0',
    [delta, id]
  );
  return rowCount === 1;
}

module.exports = { create, findById, lockByIds, applyDelta };
