import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store } from '../data/store.js';
import { config } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';

const JWT_EXPIRY = '24h';

/**
 * Strict DB-verified login.
 * 1. Looks up user by identifier (username / phone / email)
 * 2. Verifies password with bcrypt
 * 3. Issues a signed JWT token
 */
export const login = async (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password) {
    return sendError(res, 'Identifier and password are required', 400);
  }

  // 1. Lookup user from DB (no password in query)
  const user = await store.findUserByIdentifier(identifier.trim());

  if (!user) {
    return sendError(res, 'Invalid credentials. No account found with this ID/Phone/Email.', 401);
  }

  // 2. Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(String(password), user.password);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid credentials. Incorrect password.', 401);
  }

  // 3. Optional role enforcement
  if (role && user.role.toUpperCase() !== role.toUpperCase()) {
    return sendError(res, `Access denied. This account does not have ${role} privileges.`, 403);
  }

  // 4. Issue JWT
  const tokenPayload = {
    id: user.id,
    role: user.role.toUpperCase(),
    username: user.username,
  };
  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: JWT_EXPIRY });

  // 5. Build safe user object (no password)
  const { password: _, ...safeUser } = user;

  return sendSuccess(
    res,
    {
      user: safeUser,
      token,
      expiresIn: JWT_EXPIRY,
    },
    'Login successful'
  );
};

/**
 * GET /api/auth/me
 * Returns authenticated user profile + role-scoped data (farmers, tanks, submissions, harvests).
 */
export const getMe = async (req, res) => {
  if (!req.user) {
    return sendError(res, 'Authentication required. Please log in.', 401);
  }

  const user = await store.findUserById(req.user.id);
  if (!user) {
    return sendError(res, 'User account not found', 404);
  }

  const { password: _, ...safeUser } = user;
  const role = (user.role || '').toUpperCase();

  // Fetch role-scoped data
  let scopedData = {};

  try {
    if (role === 'AGENT') {
      // Agents see only their assigned farmers, tanks, submissions
      const farmers = await store.getFarmers({ agentId: user.id });
      const tanks = await store.getTanks({ agentId: user.id });
      const submissions = await store.getSubmissions({ agentId: user.id });
      const harvests = await store.getHarvests({});

      // Filter harvests to only tanks belonging to this agent
      const agentTankIds = new Set(tanks.map(t => t.id));
      const agentHarvests = harvests.filter(h => agentTankIds.has(h.tankId || h.tank_id));

      scopedData = {
        farmers,
        tanks,
        submissions,
        harvests: agentHarvests,
      };
    } else if (role === 'ASM' || role === 'INCHARGE') {
      // ASM / Incharge sees all farmers & tanks under their incharge_id
      const farmers = await store.getFarmers({ inchargeId: user.id });
      const tanks = await store.getTanks({ inchargeId: user.id });
      const submissions = await store.getSubmissions({});
      const harvests = await store.getHarvests({});

      scopedData = {
        farmers,
        tanks,
        submissions,
        harvests,
      };
    } else if (role === 'ADMIN') {
      // Admin sees everything
      const farmers = await store.getFarmers({});
      const tanks = await store.getTanks({});
      const submissions = await store.getSubmissions({});
      const harvests = await store.getHarvests({});
      const summary = await store.getAnalyticsSummary();

      scopedData = {
        farmers,
        tanks,
        submissions,
        harvests,
        summary,
      };
    }
  } catch (err) {
    console.error('[Auth /me] Error fetching scoped data:', err.message);
  }

  return sendSuccess(
    res,
    {
      user: safeUser,
      role,
      data: scopedData,
    },
    'Authenticated user profile and data retrieved'
  );
};

export const getProfile = async (req, res) => {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 401);
  }

  const user = await store.findUserById(req.user.id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const { password: _, ...safeUser } = user;
  return sendSuccess(res, safeUser, 'Profile retrieved');
};

export const logout = (req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};
