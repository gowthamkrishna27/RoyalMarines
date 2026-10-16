import assert from 'assert';
import {
  getCalendarParts,
  calendarDaysDiff,
  calculateCurrentDoc,
  FARM_TIMEZONE
} from '../src/utils/docCalculator.js';

console.log('🧪 Starting DOC Auto-Increment & Calculator Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Same-Day Tests
it('Same-Day Registration & Stocking (DOC 0 baseline)', () => {
  const tank = {
    doc: 0,
    stocking_date: '2026-10-15',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 0, 'Same-day with entered doc 0 should be DOC 0');
});

it('Same-Day Registration & Stocking with Baseline DOC 30', () => {
  const tank = {
    doc: 30,
    stocking_date: '2026-10-15',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 30, 'Same-day with entered baseline 30 should be DOC 30');
});

// 2. Next-Day Increment Tests
it('Next-Day Increment (DOC 0 -> DOC 1)', () => {
  const tank = {
    doc: 0,
    stocking_date: '2026-10-15',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-16');
  assert.strictEqual(doc, 1, 'Next day after stocking should be DOC 1');
});

it('Next-Day Increment from Baseline (DOC 30 -> DOC 31)', () => {
  const tank = {
    doc: 30,
    stocking_date: '2026-10-15',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-16');
  assert.strictEqual(doc, 31, 'Next day after baseline 30 should be DOC 31');
});

// 3. Multiple Elapsed Days Tests
it('Multiple Elapsed Days (T_MV6KDAI7: stocked 2026-10-13, tested on 2026-10-15)', () => {
  const tank = {
    doc: 0,
    stocking_date: '2026-10-13',
    created_at: '2026-10-13T05:24:32.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 2, 'Two days after stocking DOC 0 should be DOC 2');
});

it('Multiple Elapsed Days with Baseline (DOC 50 + 5 days = DOC 55)', () => {
  const tank = {
    doc: 50,
    stocking_date: '2026-10-10',
    created_at: '2026-10-10T06:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 55, '5 days after baseline 50 should be DOC 55');
});

// 4. Past Stocking Date & Elapsed Days Safety (Do Not Count Twice)
it('Past Stocking Date with initial DOC 0 (stocked 14 days ago, registered today)', () => {
  const tank = {
    doc: 0,
    stocking_date: '2026-10-01',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 14, '14 days after past stocking date should be DOC 14');
});

it('Past Stocking Date with baseline recorded on registration day (do not count days twice)', () => {
  // Farm stocked on Oct 1. On Oct 10 (9 days later), agent registered tank with baseline DOC 10.
  // Today is Oct 15 (5 days after registration). Total culture age = 10 + 5 = 15.
  const tank = {
    doc: 10,
    stocking_date: '2026-10-01',
    created_at: '2026-10-10T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 15, 'Elapsed days before registration must NOT be added twice');
});

// 5. Timezone Boundary Tests (Asia/Kolkata UTC+05:30)
it('Timezone Boundary Handling (Late UTC timestamp falls into next Indian calendar day)', () => {
  // 2026-10-14 19:30:00 UTC = 2026-10-15 01:00:00 IST
  const lateUtcTank = {
    doc: 0,
    stocking_date: '2026-10-15',
    created_at: '2026-10-14T19:30:00.000Z',
    status: 'ACTIVE',
  };
  const parts = getCalendarParts(lateUtcTank.created_at, FARM_TIMEZONE);
  assert.strictEqual(parts.year, 2026);
  assert.strictEqual(parts.month, 10);
  assert.strictEqual(parts.day, 15, '19:30 UTC on Oct 14 should map to Oct 15 in IST');

  const doc = calculateCurrentDoc(lateUtcTank, '2026-10-15');
  assert.strictEqual(doc, 0, 'Evaluated on Oct 15 IST should be same-day DOC 0');
});

// 6. Legacy Records Tests
it('Legacy Record with missing stocking_date and DD-MM-YYYY seed_date', () => {
  const tank = {
    doc: 65,
    stocking_date: null,
    seed_date: '13-10-2026',
    created_at: '2026-10-12T12:06:27.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  // seed_date is Oct 13, today is Oct 15 -> 2 days elapsed -> 65 + 2 = 67
  assert.strictEqual(doc, 67, 'Legacy record with Indian format seed_date increments correctly');
});

it('Legacy Record with only created_at timestamp', () => {
  const tank = {
    doc: 40,
    stocking_date: null,
    seed_date: null,
    created_at: '2026-10-10T10:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 45, 'Legacy record with only created_at should increment from creation date');
});

// 7. Future Dates & Safety
it('Future Stocking Date Clamped (Does not produce negative DOC)', () => {
  const tank = {
    doc: 0,
    stocking_date: '2026-10-25',
    created_at: '2026-10-15T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 0, 'Future stocking date should clamp to entered DOC and not go negative');
});

// 8. Harvested / Completed Cycle Freezing
it('Harvested Tank Freezes DOC (Does not increment closed cycle)', () => {
  const tank = {
    doc: 85,
    stocking_date: '2026-07-01',
    created_at: '2026-07-01T04:00:00.000Z',
    status: 'Harvested',
  };
  const doc = calculateCurrentDoc(tank, '2026-10-15');
  assert.strictEqual(doc, 85, 'Harvested tank should freeze at final recorded DOC');
});

// 9. Repeated Requests & Idempotency
it('Idempotence: Calling 100 times never alters input record or accumulates drift', () => {
  const tank = {
    id: 'T_TEST',
    doc: 10,
    stocking_date: '2026-10-10',
    created_at: '2026-10-10T04:00:00.000Z',
    status: 'ACTIVE',
  };
  const frozenTank = JSON.stringify(tank);
  for (let i = 0; i < 100; i++) {
    const doc = calculateCurrentDoc(tank, '2026-10-15');
    assert.strictEqual(doc, 15);
  }
  assert.strictEqual(JSON.stringify(tank), frozenTank, 'Tank object must remain completely untouched');
});

// 10. Robustness against missing / invalid values
it('Handles null, undefined, and non-numeric doc safely', () => {
  assert.strictEqual(calculateCurrentDoc(null), 0);
  assert.strictEqual(calculateCurrentDoc({ doc: null, stocking_date: '2026-10-15' }, '2026-10-15'), 0);
  assert.strictEqual(calculateCurrentDoc({ doc: 'invalid', stocking_date: '2026-10-15' }, '2026-10-15'), 0);
  assert.strictEqual(calculateCurrentDoc({ doc: -5, stocking_date: '2026-10-15' }, '2026-10-15'), 0);
});

console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
} else {
  console.error('❌ SOME TESTS FAILED.\n');
  process.exit(1);
}
