const { pool } = require('../config/db');

const format = (r) => r && ({
  id: r.id,
  account_id: r.account_id,
  type: r.type,
  amount: Number(r.amount),
  description: r.description,
  reference_id: r.reference_id,
  created_at: r.created_at,
});

async function findByReference(client, accountId, referenceId) {
  const { rows } = await client.query(
    'SELECT * FROM transactions WHERE account_id = $1 AND reference_id = $2',
    [accountId, referenceId]
  );
  return format(rows[0]);
}

async function insert(client, { account_id, type, amount, description, reference_id }) {
  const { rows } = await client.query(
    `INSERT INTO transactions (account_id, type, amount, description, reference_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [account_id, type, amount, description, reference_id]
  );
  return format(rows[0]);
}

async function listByAccount(accountId, { type, page, limit }) {
  const params = [accountId];
  let where = 'account_id = $1';
  if (type) {
    params.push(type);
    where += ` AND type = $${params.length}`;
  }

  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM transactions WHERE ${where}`, params);

  params.push(limit, (page - 1) * limit);
  const { rows } = await pool.query(
    `SELECT * FROM transactions WHERE ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return { rows: rows.map(format), total: countRes.rows[0].total };
}

module.exports = { findByReference, insert, listByAccount };
