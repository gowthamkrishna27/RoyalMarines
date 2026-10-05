import { Router } from 'express';
import {
  getTanks,
  getTankById,
  createTank,
  updateTank,
  recordWaterParameters,
  deleteTank,
} from '../controllers/tankController.js';

const router = Router();

router.get('/', getTanks);
router.get('/:id', getTankById);
router.post('/', createTank);
router.put('/:id', updateTank);
router.delete('/:id', deleteTank);
router.post('/:id/water-tests', recordWaterParameters);

export default router;
