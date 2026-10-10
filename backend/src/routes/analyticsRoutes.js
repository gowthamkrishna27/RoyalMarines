import { Router } from 'express';
import { 
  getSummary, 
  getRegions, 
  getAgents, 
  getAgentById,
  createAgent,
  updateAgent,
  reassignAgent,
  deleteAgent,
  getIncharges, 
  getInchargeById,
  createIncharge,
  updateIncharge,
  deleteIncharge,
  assignAgentToIncharge,
  unassignAgentFromIncharge,
  getAuditLogs 
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/regions', getRegions);

// Agents / Technicians REST API
router.get('/agents', getAgents);
router.get('/agents/:id', getAgentById);
router.post('/agents', createAgent);
router.put('/agents/:id', updateAgent);
router.patch('/agents/:id/reassign', reassignAgent);
router.delete('/agents/:id', deleteAgent);

// Incharges / ASMs REST API
router.get('/incharges', getIncharges);
router.get('/incharges/:id', getInchargeById);
router.post('/incharges', createIncharge);
router.put('/incharges/:id', updateIncharge);
router.delete('/incharges/:id', deleteIncharge);
router.post('/incharges/:id/assign-agent', assignAgentToIncharge);
router.post('/incharges/:id/unassign-agent', unassignAgentFromIncharge);

router.get('/audit-logs', getAuditLogs);

export default router;


