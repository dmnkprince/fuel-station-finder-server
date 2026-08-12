import * as StationModel from '../models/stationModel.js';
import * as UserModel from '../models/userModel.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * GET /api/stations
 * Returns all stations, each with their latest report data and computed status color.
 */
export async function getStations(req, res) {
  try {
    const stations = await StationModel.findAllWithLatestReport();
    res.json({ success: true, count: stations.length, data: stations });
  } catch (err) {
    console.error('Error fetching stations:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve stations.' });
  }
}

/**
 * GET /api/stations/:id
 * Returns a single station with all of its historical reports.
 */
export async function getStationDetails(req, res) {
  try {
    if (!req.params.id || (req.params.id.includes('-') && !UUID_REGEX.test(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid station ID format.' });
    }
    const station = await StationModel.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }
    res.json({ success: true, data: station });
  } catch (err) {
    console.error('Error fetching station details:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve station details.' });
  }
}

/**
 * POST /api/stations  (Admin only)
 * Adds a new fuel station to the map.
 * Required fields: name, address, latitude, longitude, brand
 * Optional: manager_email (assigns a station manager)
 */
export async function addStation(req, res) {
  const { name, address, latitude, longitude, brand, manager_email } = req.body;

  // Validation
  if (!name || !address || latitude === undefined || longitude === undefined || !brand) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: name, address, latitude, longitude, brand.',
    });
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude must be valid numbers.',
    });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90. Longitude must be between -180 and 180.',
    });
  }

  try {
    const newStation = await StationModel.create({ name, address, latitude, longitude, brand });

    // Optionally assign a station manager
    if (manager_email) {
      const manager = await UserModel.findByEmail(manager_email);
      if (manager && (manager.role === 'station_manager' || manager.role === 'admin')) {
        await StationModel.addManager(newStation.id, manager.id);
      }
    }

    res.status(201).json({ success: true, data: newStation });
  } catch (err) {
    console.error('Error adding station:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add station.' });
  }
}

/**
 * PATCH /api/stations/:id/assign-manager  (Admin only)
 * Assigns a station manager to a station.
 * Required: manager_email
 */
export async function assignManager(req, res) {
  const { manager_email } = req.body;

  if (!manager_email) {
    return res.status(400).json({ success: false, message: 'manager_email is required.' });
  }

  try {
    if (!req.params.id || (req.params.id.includes('-') && !UUID_REGEX.test(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid station ID format.' });
    }

    const station = await StationModel.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found.' });
    }

    const manager = await UserModel.findByEmail(manager_email);
    if (!manager) {
      return res.status(404).json({ success: false, message: 'User with that email not found.' });
    }
    if (manager.role !== 'station_manager' && manager.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'User must have station_manager or admin role.' });
    }

    await StationModel.addManager(req.params.id, manager.id);

    res.json({ success: true, message: `Manager ${manager.name} assigned to station.` });
  } catch (err) {
    console.error('Error assigning manager:', err.message);
    res.status(500).json({ success: false, message: 'Failed to assign manager.' });
  }
}

/**
 * GET /api/stations/:id/managers  (Admin only)
 * Returns all managers assigned to a station.
 */
export async function getStationManagers(req, res) {
  try {
    if (!req.params.id || (req.params.id.includes('-') && !UUID_REGEX.test(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid station ID format.' });
    }
    const managers = await StationModel.getManagersByStation(req.params.id);
    res.json({ success: true, data: managers });
  } catch (err) {
    console.error('Error fetching station managers:', err.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve station managers.' });
  }
}
