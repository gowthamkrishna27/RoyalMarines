import { Router } from 'express';
import {
  getTanks,
  getTankById,
  createTank,
  updateTank,
  recordWaterParameters,
} from '../controllers/tankController.js';

const router = Router();

router.get('/', getTanks);
router.get('/:id', getTankById);
router.post('/', createTank);
router.put('/:id', updateTank);
router.post('/:id/water-tests', recordWaterParameters);

export default router;
