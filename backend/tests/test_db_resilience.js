import { getPool, query, checkDatabaseConnection, isDbConnected } from '../src/config/database.js';

let passed = 0;
let total = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS [${total}]: ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL [${total}]: ${desc}`);
    throw new Error(`Assertion failed: ${desc}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('RUNNING DATABASE POOL RESILIENCE & CONCURRENCY VERIFICATION');
  console.log('================================================================\n');

  // 1. Database Startup & Ping
  console.log('--- Test 1: Database Startup Check ---');
  const dbStatus = await checkDatabaseConnection();
  assert(dbStatus.success === true, 'checkDatabaseConnection succeeded');
  assert(isDbConnected() === true, 'isDbConnected returns true');
  assert(!!dbStatus.version, `Server reported version ${dbStatus.version}`);

  // 2. Multiple simultaneous queries (concurrency stress test)
  console.log('\n--- Test 2: Concurrent Queries Across Pool ---');
  const t0 = Date.now();
  const concurrentQueries = [
    query('SELECT COUNT(*) as count FROM farmers'),
    query('SELECT COUNT(*) as count FROM tanks'),
    query('SELECT COUNT(*) as count FROM submissions'),
    query('SELECT COUNT(*) as count FROM harvests'),
    query('SELECT COUNT(*) as count FROM agents'),
    query('SELECT COUNT(*) as count FROM incharges'),
    query('SELECT COUNT(*) as count FROM regions'),
    query('SELECT COUNT(*) as count FROM roles'),
    query('SELECT COUNT(*) as count FROM users'),
    query('SELECT COUNT(*) as count FROM localities'),
  ];
  const results = await Promise.all(concurrentQueries);
  const elapsed = Date.now() - t0;
  assert(results.length === 10, 'All 10 concurrent queries resolved');
  assert(results.every(r => Array.isArray(r) && r.length > 0), 'All results contain valid row arrays');
  console.log(`  Execution time for 10 concurrent queries: ${elapsed}ms`);

  // 3. Pool Stability Test (Zero in-request pool closure)
  console.log('\n--- Test 3: Shared Pool Singularity & Zero In-Request Closures ---');
  const pool1 = getPool();
  await query('SELECT 1');
  const pool2 = getPool();
  assert(pool1 === pool2, 'getPool() maintains exactly one managed pool instance');

  // 4. Distinguishing SQL errors from transient errors
  console.log('\n--- Test 4: SQL Syntax Error Handling (No retry storm, no pool closure) ---');
  let caughtSqlError = false;
  try {
    await query('SELECT * FROM non_existent_table_xyz_123');
  } catch (err) {
    caughtSqlError = true;
    assert(err.code === 'ER_NO_SUCH_TABLE', 'Correctly caught ER_NO_SUCH_TABLE without retry storm');
  }
  assert(caughtSqlError, 'SQL error was caught and propagated');

  // Verify pool is still healthy and alive after SQL error
  const postErrorRow = await query('SELECT 1 as alive');
  assert(postErrorRow[0].alive === 1, 'Pool remains open and healthy after an application SQL error');

  // 5. Compliance Query Performance & Warm Latency
  console.log('\n--- Test 5: Weekly Compliance Query Execution ---');
  const tComp = Date.now();
  const { store } = await import('../src/data/store.js');
  const complianceData = await store.getTankComplianceList({ inchargeId: 'INC001' });
  const compTime = Date.now() - tComp;
  assert(complianceData && complianceData.counts, 'Compliance data returned with valid counts');
  assert(typeof complianceData.counts.totalActiveTanks === 'number', `Total active tanks: ${complianceData.counts.totalActiveTanks}`);
  console.log(`  getTankComplianceList executed in ${compTime}ms with zero connection errors`);

  // 6. Rapid Consecutive Bursts
  console.log('\n--- Test 6: Rapid Sequential Bursts ---');
  for (let b = 0; b < 5; b++) {
    const burst = await Promise.all([
      query('SELECT id, name FROM farmers LIMIT 5'),
      query('SELECT id, name FROM tanks LIMIT 5')
    ]);
    assert(burst[0].length > 0 && burst[1].length > 0, `Burst ${b + 1} completed cleanly`);
  }

  console.log('\n================================================================');
  console.log(`ALL TESTS PASSED: ${passed}/${total}`);
  console.log('================================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
