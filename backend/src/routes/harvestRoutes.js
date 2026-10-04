import { Router } from 'express';
import { getHarvests, createHarvest } from '../controllers/harvestController.js';

const router = Router();

router.get('/', getHarvests);
router.post('/', createHarvest);

export default router;
