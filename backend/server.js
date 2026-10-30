import app from './src/app.js';
import { config } from './src/config/env.js';
import { checkDatabaseConnection } from './src/config/database.js';
import { initializeDatabaseSchema } from './src/config/initDb.js';

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', async () => {
  const consolePath = config.consolePath || '/rm-pma-console-8f92b74c10a3e9d82f5b6c01e7d4a39f/mysqleditor';
  console.log(`\x1b[36m🌊 Royals Marine API Online\x1b[0m -> \x1b[32mhttp://localhost:${PORT}\x1b[0m | Console: \x1b[35mhttp://localhost:${PORT}${consolePath}\x1b[0m`);

  // Check database connection and initialize tables
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.success) {
    await initializeDatabaseSchema();
    try {
      const { store } = await import('./src/data/store.js');
      await store.recalculateAllFarmerStatuses();
      console.log('✅ Farmer Active/Inactive lifecycle statuses reconciled with database');
    } catch (err) {
      console.error('[Error during initial farmer status reconciliation]', err.message);
    }
  }
});

// Server socket error handling (e.g. EADDRINUSE on restarts)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31m[Port ${PORT} in use]\x1b[0m Address already in use. Please wait a moment or free port ${PORT}.`);
    process.exit(1);
  } else {
    console.error('[Server Error]', err);
  }
});

// Process error listeners for stability
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('SIGTERM', () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  server.close(async () => {
    try {
      const { closePool } = await import('./src/config/database.js');
      await closePool();
    } catch {}
    console.log('[Process] Terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(async () => {
    try {
      const { closePool } = await import('./src/config/database.js');
      await closePool();
    } catch {}
    process.exit(0);
  });
});
