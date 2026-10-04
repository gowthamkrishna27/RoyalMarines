import { Router } from 'express';
import { login, getProfile, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/logout', logout);

export default router;
