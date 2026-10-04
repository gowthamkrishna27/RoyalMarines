import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const errorResponse = {
    message,
    ...(config.isDev ? { stack: err.stack } : {}),
  };

  return sendError(res, message, statusCode, errorResponse);
};
