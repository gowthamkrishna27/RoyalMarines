import app from './src/app.js';
import { config } from './src/config/env.js';
import { checkDatabaseConnection } from './src/config/database.js';
import { initializeDatabaseSchema } from './src/config/initDb.js';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  const blue = '\x1b[34m';
  const green = '\x1b[32m';
  const cyan = '\x1b[36m';
  const yellow = '\x1b[33m';
  const reset = '\x1b[0m';

  console.log(`
${blue}=====================================================${reset}
${green}  🌊 Royals Marine Aquafeed API Server Online        ${reset}
${blue}=====================================================${reset}
  ${cyan}Port:${reset}        http://localhost:${PORT}
  ${cyan}Console:${reset}     ${green}http://localhost:${PORT}/console${reset}
  ${cyan}Health:${reset}      http://localhost:${PORT}/api/health
  ${cyan}Environment:${reset} ${config.nodeEnv}
  ${cyan}Database:${reset}    Aiven MySQL (${config.db.host})
  ${cyan}Endpoints:${reset}
    - ${yellow}/api/auth${reset}        (Agent, ASM, Admin Logins)
    - ${yellow}/api/farmers${reset}     (Farmers Directory & Team Allocations)
    - ${yellow}/api/tanks${reset}       (Pond Metrics, Water Analysis & DOC)
    - ${yellow}/api/submissions${reset} (Field Submissions & Verifications)
    - ${yellow}/api/harvests${reset}    (Harvest Logs & Cycle Closures)
    - ${yellow}/api/analytics${reset}   (Executive Summary & Region KPIs)
${blue}=====================================================${reset}
  `);

  // Check database connection and initialize tables
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.success) {
    await initializeDatabaseSchema();
  } else {
    console.log(`\x1b[33m[Database Notice]\x1b[0m Running with in-memory fallback until DB credentials in backend/.env are updated.\n`);
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
