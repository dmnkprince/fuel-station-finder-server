import { Router } from 'express';
import { submitReport, upvoteReport } from '../controllers/reportController.js';

const router = Router();

// POST  /api/reports           - Submit a live price/availability report
router.post('/', submitReport);

// PATCH /api/reports/:id/upvote - Upvote a report for verification
router.patch('/:id/upvote', upvoteReport);

export default router;
