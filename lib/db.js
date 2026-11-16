const { Pool } = require('pg');

// One small pool per function instance, as in the other services.
let pool;
function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    // Local Postgres (the Docker stack) doesn't speak SSL at all; Neon always
    // does. An explicit `ssl` option on the Pool overrides anything in the
    // connection string, so this has to be conditional rather than always on.
    const local = url.includes('localhost') || url.includes('127.0.0.1');
    pool = new Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function withTransaction(fn) {
  const client = await getPool().connect();
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

module.exports = { getPool, withTransaction };
