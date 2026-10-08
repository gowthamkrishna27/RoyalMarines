import { Router } from 'express';
import { getSubmissionLocations, getFieldStaff } from '../controllers/adminController.js';

const router = Router();

// Real-time submission location map endpoints
router.get('/submission-locations', getSubmissionLocations);
router.get('/field-staff', getFieldStaff);

export default router;

