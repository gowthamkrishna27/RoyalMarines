import app from './src/app.js';
import { config } from './src/config/env.js';
import { checkDatabaseConnection } from './src/config/database.js';
import { initializeDatabaseSchema } from './src/config/initDb.js';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  const consolePath = config.consolePath || '/rm-pma-console-8f92b74c10a3e9d82f5b6c01e7d4a39f/mysqleditor';
  console.log(`\x1b[36m🌊 Royals Marine API Online\x1b[0m -> \x1b[32mhttp://localhost:${PORT}\x1b[0m | Console: \x1b[35mhttp://localhost:${PORT}${consolePath}\x1b[0m`);

  // Check database connection and initialize tables
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.success) {
    await initializeDatabaseSchema();
  }
});

// Process error listeners for stability
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

process.on('SIGTERM', () => {
  console.log('[SIGTERM] Shutting down gracefully...');
  server.close(() => {
    console.log('[Process] Terminated');
    process.exit(0);
  });
});
