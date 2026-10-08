/**
 * Middleware that tracks request processing time and injects an X-Response-Time header.
 * Measures response speed in fractional milliseconds for maximum efficiency insights.
 */
export const responseTimer = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    // Keep terminal console clean: skip static files, health checks, and dashboard polls
    const url = req.originalUrl || req.url;
    if (
      url === '/api/health' ||
      url === '/favicon.ico' ||
      url === '/' ||
      url.startsWith('/console') ||
      url.endsWith('.html') ||
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.svg')
    ) {
      return;
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const formatted = `${durationMs.toFixed(1)}ms`;

    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    const dim = '\x1b[2m';

    console.log(
      `${dim}[API]${resetColor} ${req.method} ${url} -> ${statusColor}${res.statusCode}${resetColor} ${dim}(${formatted})${resetColor}`
    );
  });

  const originalSend = res.send;
  res.send = function (body) {
    const currentEnd = process.hrtime.bigint();
    const durationMs = Number(currentEnd - start) / 1_000_000;
    res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    return originalSend.call(this, body);
  };

  next();
};
