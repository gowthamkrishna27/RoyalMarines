import { Router } from 'express';
import {
  getTanks,
  getTankById,
  createTank,
  updateTank,
  recordWaterParameters,
  deleteTank,
  restockTank,
} from '../controllers/tankController.js';
import { authenticate } from '../middleware/auth.js';
import {
  getComplianceDueList,
  createComplianceFollowup,
  getComplianceFollowupHistory,
} from '../controllers/tankComplianceController.js';

const router = Router();

// Weekly Tank Testing Compliance & Follow-Up Routes
router.get('/compliance/due-list', authenticate, getComplianceDueList);
router.post('/compliance/follow-up', authenticate, createComplianceFollowup);
router.get('/compliance/follow-up/:tankId', authenticate, getComplianceFollowupHistory);

router.get('/', getTanks);
router.get('/:id', getTankById);
router.post('/', createTank);
router.put('/:id', updateTank);
router.delete('/:id', deleteTank);
router.post('/:id/water-tests', recordWaterParameters);
router.post('/:id/restock', restockTank);

export default router;
