import { Router } from 'express';
import {
  getFarmers,
  getFarmerById,
  createFarmer,
  updateFarmer,
  deleteFarmer,
  reassignFarmer,
} from '../controllers/farmerController.js';

const router = Router();

router.get('/', getFarmers);
router.get('/:id', getFarmerById);
router.post('/', createFarmer);
router.put('/:id', updateFarmer);
router.delete('/:id', deleteFarmer);
router.patch('/:id/reassign', reassignFarmer);

export default router;
