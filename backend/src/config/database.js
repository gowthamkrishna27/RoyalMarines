import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool = null;
let isConnected = null;

export const resetPool = () => {
  if (pool) {
    try {
      pool.end().catch(() => {});
    } catch {}
    pool = null;
  }
};

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || config.db.host,
      port: parseInt(process.env.DB_PORT, 10) || config.db.port,
      user: process.env.DB_USER || config.db.user,
      password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.db.password,
      database: process.env.DB_NAME || config.db.database,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : config.db.ssl,
      waitForConnections: true,
      connectionLimit: 15,
      maxIdle: 10,
      idleTimeout: 30000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 5000,
      queueLimit: 0,
      connectTimeout: 15000,
    });
  }
  return pool;
};

export const query = async (sql, params = []) => {
  const cleanParams = params.map((val) => (val === undefined ? null : val));
  try {
    const p = getPool();
    const [results] = await p.query(sql, cleanParams);
    isConnected = true;
    return results;
  } catch (err) {
    if (
      err.code === 'ECONNRESET' ||
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'EPIPE' ||
      err.code === 'ER_CON_COUNT_ERROR'
    ) {
      console.warn('[Database Reconnecting on dropped/exhausted socket]:', err.message);
      resetPool();
      try {
        const freshPool = getPool();
        const [retryResults] = await freshPool.query(sql, cleanParams);
        isConnected = true;
        return retryResults;
      } catch (retryErr) {
        throw retryErr;
      }
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      resetPool();
    }
    throw err;
  }
};

export const checkDatabaseConnection = async () => {
  try {
    const p = getPool();
    const start = performance.now();
    const [rows] = await p.query('SELECT VERSION() as version, NOW() as server_time');
    const latency = (performance.now() - start).toFixed(2);

    isConnected = true;
    console.log(`\x1b[32m[Database]\x1b[0m Connected to Aiven MySQL (v${rows[0].version}) in ${latency}ms`);
    return { success: true, version: rows[0].version, latency: `${latency}ms` };
  } catch (error) {
    resetPool();
    console.error(`\x1b[31m[Database Connection Error]\x1b[0m ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const isDbConnected = () => {
  if (isConnected === true) return true;
  return Boolean(process.env.DB_HOST || config.db.host);
};

export default { getPool, query, checkDatabaseConnection, isDbConnected };

