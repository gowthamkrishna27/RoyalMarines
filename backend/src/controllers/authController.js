import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const login = async (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password) {
    return sendError(res, 'Identifier and password are required', 400);
  }

  const user = await store.findUserByCredentials(identifier, password);

  if (!user) {
    return sendError(res, 'Invalid credentials. Please verify your ID/Phone and password.', 401);
  }

  if (role && user.role.toUpperCase() !== role.toUpperCase()) {
    return sendError(res, `Access denied for role ${role}`, 403);
  }

  const token = Buffer.from(`${user.role}:${user.id}:${Date.now()}`).toString('base64');
  const { password: _, ...safeUser } = user;

  return sendSuccess(
    res,
    {
      user: safeUser,
      token,
      expiresIn: '24h',
    },
    'Login successful'
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
