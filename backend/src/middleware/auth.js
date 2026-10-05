import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

/**
 * JWT-based authentication middleware.
 * Verifies the Bearer token from the Authorization header using jsonwebtoken.
 * Falls back to x-user-role / x-user-id headers for backward compatibility with apiClient.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Try JWT Bearer token (primary auth method)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = {
        id: decoded.id,
        role: decoded.role.toUpperCase(),
        username: decoded.username,
      };
      return next();
    } catch (err) {
      // Token is invalid or expired - don't fall through, reject
      return sendError(res, 'Session expired or invalid. Please log in again.', 401);
    }
  }

  // 2. Fallback: x-user-role / x-user-id headers (backward compatibility)
  const roleHeader = req.headers['x-user-role'];
  const userIdHeader = req.headers['x-user-id'];
  if (roleHeader && userIdHeader) {
    req.user = {
      id: userIdHeader,
      role: roleHeader.toUpperCase(),
    };
    return next();
  }

  // 3. No auth provided
  req.user = null;
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const userRole = (req.user.role || '').toUpperCase();
    const hasRole = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

    if (!hasRole) {
      return sendError(res, `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`, 403);
    }
    next();
  };
};
