import { Router } from 'express';
import { login, getMe, getProfile, logout } from '../controllers/authController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, requireAuth, getMe);
router.get('/profile', authenticate, getProfile);
router.post('/logout', logout);

export default router;
