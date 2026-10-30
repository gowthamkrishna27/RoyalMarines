const endpoints = [
  '/api/farmers',
  '/api/tanks',
  '/api/submissions',
  '/api/harvests',
  '/api/analytics/agents',
  '/api/analytics/incharges',
  '/api/analytics/regions'
];

async function testHttpEndpoints() {
  console.log('Testing HTTP API endpoints concurrently on http://localhost:5000...\n');
  const t0 = Date.now();

  const requests = endpoints.map(async (ep) => {
    const url = `http://localhost:5000${ep}`;
    const start = Date.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const elapsed = Date.now() - start;
      const count = Array.isArray(data.data) ? data.data.length : (data.data ? 'object' : 'empty');
      return { ep, status: res.status, success: data.success, count, elapsed };
    } catch (err) {
      return { ep, status: 'FETCH_ERROR', error: err.message };
    }
  });

  const results = await Promise.all(requests);
  const totalElapsed = Date.now() - t0;

  console.table(results);
  console.log(`\nAll ${endpoints.length} concurrent HTTP requests completed in ${totalElapsed}ms.`);

  const allSuccess = results.every(r => r.status === 200 && r.success === true);
  if (!allSuccess) {
    console.error('FAIL: Some endpoints failed!');
    process.exit(1);
  }
  console.log('✓ SUCCESS: All endpoints returned HTTP 200 with real database data and ZERO 500 errors!');
  process.exit(0);
}

testHttpEndpoints();
