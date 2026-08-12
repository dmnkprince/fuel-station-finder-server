import { Router } from 'express';
import { submitReport, upvoteReport, downvoteReport } from '../controllers/reportController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';
import { reportLimiter, voteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST  /api/reports           - Submit a live price/availability report (admin/manager only)
router.post('/', authenticateToken, requireAuth, reportLimiter, submitReport);

// PATCH /api/reports/:id/upvote - Upvote a report for verification (public)
router.patch('/:id/upvote', voteLimiter, upvoteReport);

// PATCH /api/reports/:id/downvote - Downvote / flag a report as inaccurate (public)
router.patch('/:id/downvote', voteLimiter, downvoteReport);

export default router;
