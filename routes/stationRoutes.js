import { Router } from 'express';
import { getStations, getStationDetails, addStation } from '../controllers/stationController.js';

const router = Router();

// GET  /api/stations        - Fetch all stations with their latest report
router.get('/', getStations);

// GET  /api/stations/:id    - Fetch a single station with all historical reports
router.get('/:id', getStationDetails);

// POST /api/stations        - Add a new station to the map
router.post('/', addStation);

export default router;
