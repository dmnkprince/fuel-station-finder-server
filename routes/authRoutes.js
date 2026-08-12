import { Router } from 'express';
import { register, login, getMe, createManager, getManagers, getMyStations, getManagerDetails, updateManager, unassignStation } from '../controllers/authController.js';
import { authenticateToken, requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/auth/register - Create a new account (always 'user' role)
router.post('/register', authLimiter, register);

// POST /api/auth/login    - Authenticate and receive JWT
router.post('/login', authLimiter, login);

// GET  /api/auth/me       - Get current authenticated user profile
router.get('/me', authenticateToken, requireAuth, getMe);

// POST /api/auth/create-manager - Create a station manager account (admin only)
router.post('/create-manager', authenticateToken, requireRole('admin'), createManager);

// GET /api/auth/managers - List all station managers (admin only)
router.get('/managers', authenticateToken, requireRole('admin'), getManagers);

// GET /api/auth/managers/:id - Get details of a station manager (admin only)
router.get('/managers/:id', authenticateToken, requireRole('admin'), getManagerDetails);

// PUT /api/auth/managers/:id - Update details of a station manager (admin only)
router.put('/managers/:id', authenticateToken, requireRole('admin'), updateManager);

// DELETE /api/auth/managers/:id/stations/:stationId - Unassign a station from a manager (admin only)
router.delete('/managers/:id/stations/:stationId', authenticateToken, requireRole('admin'), unassignStation);

// GET /api/auth/my-stations - Get stations assigned to current manager
router.get('/my-stations', authenticateToken, requireAuth, getMyStations);

export default router;
