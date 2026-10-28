const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await pool.query('SELECT 1'); // fail fast if DB is unreachable
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Ledger API running on port ${PORT}`));
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);
  }
})();
