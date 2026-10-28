require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Copy .env.example to .env and fill it.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,
});

pool.on('error', (err) => console.error('Unexpected PG pool error', err));

/**
 * Runs fn(client) inside BEGIN ... COMMIT.
 * Any error -> ROLLBACK, so nothing is persisted (atomicity).
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, withTransaction };
