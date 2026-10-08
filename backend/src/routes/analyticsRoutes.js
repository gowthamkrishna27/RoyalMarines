import { Router } from 'express';
import { getSummary, getRegions, getAgents, getIncharges, getAuditLogs } from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/regions', getRegions);
router.get('/agents', getAgents);
router.get('/incharges', getIncharges);
router.get('/audit-logs', getAuditLogs);

export default router;
