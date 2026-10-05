import { Router } from 'express';
import authRoutes from './authRoutes.js';
import farmerRoutes from './farmerRoutes.js';
import tankRoutes from './tankRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import harvestRoutes from './harvestRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import dbAdminRoutes from './dbAdminRoutes.js';
import { sendSuccess } from '../utils/response.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Royals Marine Aquafeed API',
    version: '1.0.0',
  }, 'Royals Marine Backend is running at optimal speed');
});

// Mount domain routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/farmers', farmerRoutes);
apiRouter.use('/tanks', tankRoutes);
apiRouter.use('/submissions', submissionRoutes);
apiRouter.use('/harvests', harvestRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/db-admin', dbAdminRoutes);

export default apiRouter;
