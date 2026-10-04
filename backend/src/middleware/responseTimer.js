/**
 * Middleware that tracks request processing time and injects an X-Response-Time header.
 * Measures response speed in fractional milliseconds for maximum efficiency insights.
 */
export const responseTimer = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const formatted = `${durationMs.toFixed(2)}ms`;

    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    const cyan = '\x1b[36m';
    const dim = '\x1b[2m';

    console.log(
      `${dim}[API]${resetColor} ${cyan}${req.method}${resetColor} ${req.originalUrl} -> ${statusColor}${res.statusCode}${resetColor} ${dim}(${formatted})${resetColor}`
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
