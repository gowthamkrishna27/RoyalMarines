import { Router } from 'express';
import { getSummary, getRegions, getAgents } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/regions', getRegions);
router.get('/agents', getAgents);

export default router;
