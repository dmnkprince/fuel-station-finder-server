import * as StationModel from '../models/stationModel.js';
import mongoose from 'mongoose';

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
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
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
 * POST /api/stations
 * Adds a new fuel station to the map.
 * Required fields: name, address, latitude, longitude, brand
 */
export async function addStation(req, res) {
  const { name, address, latitude, longitude, brand } = req.body;

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
    res.status(201).json({ success: true, data: newStation });
  } catch (err) {
    console.error('Error adding station:', err.message);
    res.status(500).json({ success: false, message: 'Failed to add station.' });
  }
}
