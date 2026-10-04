import { Router } from 'express';
import {
  getSubmissions,
  createSubmission,
  verifySubmission,
} from '../controllers/submissionController.js';

const router = Router();

router.get('/', getSubmissions);
router.post('/', createSubmission);
router.patch('/:id/verify', verifySubmission);

export default router;
