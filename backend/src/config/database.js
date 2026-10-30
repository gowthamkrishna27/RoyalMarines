import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool = null;
let isConnected = null;
let poolCreationPromise = null;

// Transient socket / network errors eligible for a bounded retry on a fresh connection from the pool
const TRANSIENT_ERROR_CODES = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_LOCK_DEADLOCK',
  'ER_QUERY_INTERRUPTED',
]);

const buildPoolConfig = () => {
  const host = process.env.DB_HOST || config.db.host;
  const port = parseInt(process.env.DB_PORT, 10) || config.db.port;
  const user = process.env.DB_USER || config.db.user;
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.db.password;
  const database = process.env.DB_NAME || config.db.database;
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : config.db.ssl;

  return {
    host,
    port,
    user,
    password,
    database,
    ssl,
    waitForConnections: true,
    connectionLimit: 10, // Aiven plan allows 46 connections total; 10 is safe and optimal
    maxIdle: 8,
    idleTimeout: 60000, // 60s idle timeout (reduces costly TLS reconnects)
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10s TCP keepalive to keep NAT firewalls alive
    queueLimit: 100, // Bounded queue limit to prevent unbounded memory/wait pile-ups
    connectTimeout: 15000, // 15s connection timeout for cloud TLS handshakes
  };
};

/**
 * Returns the shared process pool. If pool doesn't exist, creates it.
 */
export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
  }
  return pool;
};

/**
 * Safe, coordinated pool recreation if ever explicitly requested.
 * Thread/promise-safe to prevent concurrent requests from creating competing pools.
 */
export const resetPool = async () => {
  if (poolCreationPromise) {
    return poolCreationPromise;
  }
  poolCreationPromise = (async () => {
    try {
      const oldPool = pool;
      pool = null;
      isConnected = null;
      if (oldPool) {
        try {
          await oldPool.end();
        } catch {}
      }
      pool = mysql.createPool(buildPoolConfig());
      return pool;
    } finally {
      poolCreationPromise = null;
    }
  })();
  return poolCreationPromise;
};

/**
 * Graceful pool shutdown for process exit hooks (SIGTERM/SIGINT).
 */
export const closePool = async () => {
  if (pool) {
    try {
      const p = pool;
      pool = null;
      isConnected = false;
      await p.end();
      console.log('[Database] Connection pool cleanly closed');
    } catch (err) {
      console.error('[Database] Error closing pool:', err.message);
    }
  }
};

/**
 * Execute a query with clean parameter normalization, single bounded retry for transient socket drops,
 * and strict preservation of SQL error propagation.
 *
 * CRITICAL RULE: NEVER close the shared pool during ordinary query execution.
 */
export const query = async (sql, params = []) => {
  const cleanParams = params.map((val) => (val === undefined ? null : val));
  const maxRetries = 1;
  let attempt = 0;

  while (true) {
    try {
      const p = getPool();
      const [results] = await p.query(sql, cleanParams);
      isConnected = true;
      return results;
    } catch (err) {
      attempt++;
      const isTransient = TRANSIENT_ERROR_CODES.has(err.code);

      // Only retry once on transient socket/connection drops
      if (isTransient && attempt <= maxRetries) {
        console.warn(`[Database Transient ${err.code}]: Retrying query (attempt ${attempt}/${maxRetries})...`);
        // Brief backoff before retry to allow socket cleanup
        await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
        continue;
      }

      // Mark connection flag false on fatal network errors, but DO NOT close the pool
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        isConnected = false;
      }

      // Propagate the real error to the caller (controllers/services)
      throw err;
    }
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
    isConnected = false;
    // DO NOT call resetPool() here! Closing the pool on a failed ping causes cascading failures.
    console.error(`\x1b[31m[Database Connection Error]\x1b[0m ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const isDbConnected = () => {
  if (isConnected === false) return false;
  if (isConnected === true) return true;
  return Boolean(process.env.DB_HOST || config.db.host);
};

export default { getPool, query, checkDatabaseConnection, isDbConnected, resetPool, closePool };
