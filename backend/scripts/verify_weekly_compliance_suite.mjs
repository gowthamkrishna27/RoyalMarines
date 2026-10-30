import '../src/config/env.js';
import { store } from '../src/data/store.js';
import { query } from '../src/config/database.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS [${totalTests}]: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL [${totalTests}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING WEEKLY TANK TESTING & FOLLOW-UP COMPLIANCE SUITE');
  console.log('================================================================\n');

  // --- SCENARIO 1, 2, 3, 4, 5: COMPLIANCE STATUS CALCULATION ---
  console.log('--- Testing Compliance Rules & 7-Day Rolling Calculation ---');
  const compliance = await store.getTankComplianceList({});
  assert(compliance && compliance.counts, 'getTankComplianceList returned valid payload with counts');
  assert(typeof compliance.counts.totalActiveTanks === 'number', 'totalActiveTanks is a valid number');
  assert(typeof compliance.counts.compliantCount === 'number', 'compliantCount is a valid number');
  assert(typeof compliance.counts.dueCount === 'number', 'dueCount is a valid number');
  assert(typeof compliance.counts.addressedCount === 'number', 'addressedCount is a valid number');
  assert(compliance.counts.compliantCount + compliance.counts.dueCount + compliance.counts.addressedCount === compliance.counts.totalActiveTanks,
    'Counts reconcile: Compliant + Due + Addressed === Total Active Tanks');

  // Verify harvested tanks excluded
  const harvestedTanksInList = compliance.allTanks.filter(t => (t.tankStatus || '').toUpperCase() === 'HARVESTED');
  assert(harvestedTanksInList.length === 0, 'Scenario 5: Harvested tanks are strictly excluded from weekly compliance');

  // Verify active tanks with recent tests vs tanks without tests
  const testedTank = compliance.allTanks.find(t => t.lastTestTimestamp && (Date.now() - new Date(t.lastTestTimestamp).getTime() <= 7 * 24 * 3600 * 1000));
  if (testedTank) {
    assert(testedTank.isCompliant === true, `Scenario 1 & 2: Tank ${testedTank.tankId} tested within 7 days is marked COMPLIANT`);
    assert(testedTank.complianceStatus === 'COMPLIANT', 'complianceStatus is COMPLIANT');
  }

  const neverTestedTank = compliance.dueList.find(t => !t.lastTestTimestamp);
  if (neverTestedTank) {
    assert(neverTestedTank.isCompliant === false, `Scenario 4: Tank ${neverTestedTank.tankId} with no prior qualifying tests is marked DUE`);
    assert(neverTestedTank.complianceStatus === 'DUE', 'complianceStatus is DUE');
  }

  // --- SCENARIO 8: EMPTY MESSAGE REJECTION ---
  console.log('\n--- Testing Validation: Empty Message Rejection ---');
  let emptyErrorCaught = false;
  try {
    await store.createTankFollowup({ tankId: 'T006', message: '   ' }, { id: 'ADM001', role: 'ADMIN' });
  } catch (err) {
    emptyErrorCaught = true;
    assert(err.message.includes('empty'), 'Scenario 8: Empty message throws validation error');
  }
  assert(emptyErrorCaught, 'Empty message submission was blocked');

  // --- SCENARIO 18: ROLE-BASED ACCESS CONTROL ENFORCEMENT ---
  console.log('\n--- Testing Authorization & Permissions ---');
  let unauthorizedCaught = false;
  try {
    // Incharge INC002 trying to follow up on Tank T006 (which is under INC001)
    await store.createTankFollowup(
      { tankId: 'T006', message: 'Unauthorized message attempt' },
      { id: 'INC999', role: 'INCHARGE', name: 'Intruder Incharge' }
    );
  } catch (err) {
    unauthorizedCaught = true;
    assert(err.message.includes('Forbidden') || err.message.includes('not authorized'),
      'Scenario 18: Unauthorized incharge cannot follow up on other incharge\'s tank');
  }
  assert(unauthorizedCaught, 'Unauthorized attempt was blocked by backend');

  // --- SCENARIO 6, 7, 11, 12, 13, 14: FOLLOW-UP WORKFLOW & SHARED VISIBILITY ---
  console.log('\n--- Testing Follow-Up Submission, Addressed State, & History ---');
  const targetDueTank = compliance.dueList[0];
  assert(targetDueTank, 'Found a test target due tank in database');

  const testMsgAdmin = `Admin Follow-up Directive: Tank testing required immediately for weekly cycle.`;
  const fupRecord = await store.createTankFollowup(
    {
      tankId: targetDueTank.tankId,
      cycleKey: targetDueTank.cycleKey,
      message: testMsgAdmin
    },
    { id: 'ADM001', role: 'ADMIN', name: 'System Administrator' }
  );

  assert(fupRecord && fupRecord.id, 'Scenario 6: Admin follow-up message saved successfully to MySQL');
  assert(fupRecord.senderRole === 'ADMIN', 'Sender role authenticated as ADMIN');
  assert(fupRecord.senderName === 'System Administrator', 'Sender name derived securely from DB/auth');

  // Verify tank moved from Due to Addressed
  const complianceAfterAdminFup = await store.getTankComplianceList({ tankId: targetDueTank.tankId });
  const updatedTank = complianceAfterAdminFup.allTanks[0];
  assert(updatedTank.followupStatus === 'ADDRESSED', 'Scenario 6: Due item transitioned to ADDRESSED follow-up status');
  assert(updatedTank.complianceStatus === 'ADDRESSED', 'Scenario 14: Item marked ADDRESSED and test entry not required for this week');
  assert(updatedTank.testRequired === false, 'Scenario 14: testRequired is false because due item was addressed');
  assert(updatedTank.latestFollowup.message === testMsgAdmin, 'Scenario 11: Latest message content matches submitted text');

  // Scenario 13: Agent replies in same conversation
  const testMsgAgent = `Agent Reply: Acknowledged. Visiting farmer today at 4 PM to complete water analysis.`;
  const agentReply = await store.createTankFollowup(
    {
      tankId: targetDueTank.tankId,
      cycleKey: targetDueTank.cycleKey,
      message: testMsgAgent
    },
    { id: targetDueTank.agentId || 'agent001', role: 'AGENT', name: targetDueTank.agentName || 'Agent Tech' }
  );

  assert(agentReply && agentReply.id, 'Scenario 13: Agent reply saved successfully to conversation');
  assert(agentReply.senderRole === 'AGENT', 'Agent role recorded');

  // Check history retrieval (Admin & ASM shared visibility)
  const history = await store.getTankFollowupHistory(targetDueTank.tankId, targetDueTank.cycleKey);
  assert(history.length >= 2, 'Scenario 11 & 12: Full conversation thread preserved with at least 2 messages');
  assert(history[0].message === testMsgAdmin, 'First message from Admin preserved');
  assert(history[1].message === testMsgAgent, 'Reply message from Agent preserved');

  // --- SCENARIO 19: CONCURRENCY & DUPLICATE MESSAGE PREVENTION ---
  console.log('\n--- Testing Idempotency & Duplicate Prevention ---');
  const dupResult = await store.createTankFollowup(
    {
      tankId: targetDueTank.tankId,
      cycleKey: targetDueTank.cycleKey,
      message: testMsgAgent
    },
    { id: targetDueTank.agentId || 'agent001', role: 'AGENT', name: targetDueTank.agentName || 'Agent Tech' }
  );
  assert(dupResult.isDuplicateSuppressed === true, 'Scenario 19: Double-click/retry within 5 seconds suppressed duplicate record');

  // Clean up test follow-ups so zero artificial data remains
  await query('DELETE FROM tank_due_followups WHERE tank_id = ? AND message IN (?, ?)', [
    targetDueTank.tankId,
    testMsgAdmin,
    testMsgAgent
  ]);
  console.log('\n  ✓ Test follow-up records cleaned up cleanly from database.');

  console.log('\n================================================================');
  console.log(`ALL COMPLIANCE SUITE TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');

  process.exit(0);
}

runTestSuite().catch(e => {
  console.error('\nTest suite failed with error:', e);
  process.exit(1);
});
