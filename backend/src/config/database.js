import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool = null;
let isConnected = false;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(config.db);
  }
  return pool;
};

export const query = async (sql, params = []) => {
  const p = getPool();
  const cleanParams = params.map((val) => (val === undefined ? null : val));
  const [results] = await p.execute(sql, cleanParams);
  return results;
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
    console.error(`\x1b[31m[Database Connection Error]\x1b[0m ${error.message}`);
    return { success: false, error: error.message };
  }
};

export const isDbConnected = () => isConnected;

export default { getPool, query, checkDatabaseConnection, isDbConnected };
