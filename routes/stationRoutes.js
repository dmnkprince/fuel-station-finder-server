import { Router } from 'express';
import { getStations, getStationDetails, addStation, assignManager, getStationManagers, updateStation, deleteStation } from '../controllers/stationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// GET  /api/stations        - Fetch all stations with their latest report (public)
router.get('/', getStations);

// GET  /api/stations/:id    - Fetch a single station with all historical reports (public)
router.get('/:id', getStationDetails);

// POST /api/stations        - Add a new station (admin only)
router.post('/', authenticateToken, requireRole('admin'), addStation);

// PUT /api/stations/:id     - Update an existing station (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), updateStation);

// DELETE /api/stations/:id  - Delete a station (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), deleteStation);

// GET /api/stations/:id/managers - Get all managers of a station (admin only)
router.get('/:id/managers', authenticateToken, requireRole('admin'), getStationManagers);

// PATCH /api/stations/:id/assign-manager  - Assign a manager (admin only)
router.patch('/:id/assign-manager', authenticateToken, requireRole('admin'), assignManager);

export default router;
