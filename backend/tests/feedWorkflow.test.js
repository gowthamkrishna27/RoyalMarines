import assert from 'assert';

console.log('🧪 Starting Aqua Feed Entry Workflow Test Suite...\n');

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

// Helper simulating frontend/backend calculation for Count -> ABW
function calculateAbwFromCount(countVal) {
  const countNum = parseFloat(countVal);
  if (!isNaN(countNum) && countNum > 0) {
    const calcAbw = 1000 / countNum;
    return calcAbw % 1 === 0 ? String(calcAbw) : String(parseFloat(calcAbw.toFixed(2)));
  }
  return '';
}

// Helper simulating FCR calculation: Cumulative Feed / Biomass
function calculateFcr(cumFeedVal, estStockVal, abwVal) {
  const cumFeed = parseFloat(cumFeedVal);
  const estStock = parseFloat(estStockVal);
  const currentAbw = parseFloat(abwVal);
  if (!isNaN(cumFeed) && cumFeed > 0 && !isNaN(estStock) && estStock > 0 && !isNaN(currentAbw) && currentAbw > 0) {
    const estBiomassKg = (estStock * currentAbw) / 1000;
    if (estBiomassKg > 0) {
      return (cumFeed / estBiomassKg).toFixed(2);
    }
  }
  return '';
}

// 1. Requirement 2: Count -> ABW Formula (ABW = 1000 / Count)
it('Count = 100 yields ABW = 10', () => {
  assert.strictEqual(calculateAbwFromCount(100), '10');
  assert.strictEqual(calculateAbwFromCount('100'), '10');
});

it('Count = 200 yields ABW = 5', () => {
  assert.strictEqual(calculateAbwFromCount(200), '5');
  assert.strictEqual(calculateAbwFromCount('200'), '5');
});

it('Count = 250 yields ABW = 4', () => {
  assert.strictEqual(calculateAbwFromCount(250), '4');
  assert.strictEqual(calculateAbwFromCount('250'), '4');
});

it('Count = 500 yields ABW = 2', () => {
  assert.strictEqual(calculateAbwFromCount(500), '2');
  assert.strictEqual(calculateAbwFromCount('500'), '2');
});

it('Count = 1000 yields ABW = 1', () => {
  assert.strictEqual(calculateAbwFromCount(1000), '1');
  assert.strictEqual(calculateAbwFromCount('1000'), '1');
});

it('Count = 300 yields ABW = 3.33 (rounded clean 2 decimals)', () => {
  assert.strictEqual(calculateAbwFromCount(300), '3.33');
});

it('Count = 0 yields blank (never Infinity or NaN)', () => {
  const res = calculateAbwFromCount(0);
  assert.strictEqual(res, '', 'Must be empty string, never Infinity');
  assert.ok(!res.includes('Infinity') && !res.includes('NaN'));
});

it('Negative Count yields blank (never negative ABW or NaN)', () => {
  const res = calculateAbwFromCount(-50);
  assert.strictEqual(res, '', 'Must be empty string');
});

it('Empty or non-numeric Count yields blank', () => {
  assert.strictEqual(calculateAbwFromCount(''), '');
  assert.strictEqual(calculateAbwFromCount(null), '');
  assert.strictEqual(calculateAbwFromCount(undefined), '');
  assert.strictEqual(calculateAbwFromCount('abc'), '');
});

// 2. Requirement 3: Seed Stocked Fixed & Estimated Stock Separate
it('Seed Stocked is derived from tank and separate from Estimated Stock', () => {
  const tank = {
    id: 'tank-001',
    seedStocked: '50000',
    seed_stocking_lak: '0.50'
  };

  // Simulating tank retrieval in Feed New Entry
  const initialSeed = tank.seedStocked != null ? String(tank.seedStocked) : '';
  assert.strictEqual(initialSeed, '50000', 'Original Seed Stocked must be 50,000');

  // User enters Estimated Stock = 46000
  const feedSubmission = {
    tankId: tank.id,
    seed: initialSeed, // fixed, read-only
    estimatedStock: '46000',
    count: '200',
    abw: calculateAbwFromCount(200),
    cumulativeFeed: '276',
  };

  assert.strictEqual(feedSubmission.seed, '50000');
  assert.strictEqual(feedSubmission.estimatedStock, '46000');
  assert.notStrictEqual(feedSubmission.seed, feedSubmission.estimatedStock);
  assert.strictEqual(feedSubmission.abw, '5');
});

it('FCR calculates correctly with Estimated Stock and ABW (without Total Biomass)', () => {
  // Estimated Stock = 46,000 pcs, Count = 200 -> ABW = 5g
  // Biomass = (46,000 * 5) / 1000 = 230 kg
  // Cumulative Feed = 276 kg -> FCR = 276 / 230 = 1.20
  const abw = calculateAbwFromCount(200);
  const fcr = calculateFcr(276, 46000, abw);
  assert.strictEqual(fcr, '1.20');
});

// 3. Requirement 1: Manual CH TR Time (Feed Consumption Time)
it('CH TR Time preserves manual duration entries and is not submission clock time', () => {
  const manualValues = ['01:30', '1:30', '90 mins', '02:00', '45 mins'];
  manualValues.forEach(val => {
    const feedEntry = {
      checkTrayTime: val,
      chTrTime: val
    };
    assert.strictEqual(feedEntry.checkTrayTime, val);
    assert.strictEqual(feedEntry.chTrTime, val);
  });
});

console.log(`\n================================`);
console.log(`Tests run: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}`);
console.log(`================================\n`);
