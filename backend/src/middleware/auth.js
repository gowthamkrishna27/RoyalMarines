import { sendError } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'];
  const userIdHeader = req.headers['x-user-id'];

  // Lightweight session-based / token-based header inspection
  if (roleHeader && userIdHeader) {
    req.user = {
      id: userIdHeader,
      role: roleHeader.toUpperCase(),
    };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Simple demo bearer token decoding (e.g., token format: role:userId:timestamp)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [role, id] = decoded.split(':');
      if (role && id) {
        req.user = { id, role: role.toUpperCase() };
        return next();
      }
    } catch {
      // fallback
    }
  }

  // Allow guest access if no auth required, otherwise controller checks req.user
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
