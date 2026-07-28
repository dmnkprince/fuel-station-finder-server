import * as ReportModel from '../models/reportModel.js';
import * as StationModel from '../models/stationModel.js';
import mongoose from 'mongoose';

const VALID_FUEL_TYPES = ['PMS', 'AGO', 'DPK', 'LPG'];
const VALID_QUEUE_LENGTHS = ['None', 'Short', 'Moderate', 'Long'];

/**
 * POST /api/reports
 * Submit a live price/availability report for a station.
 * Required fields: station_id, fuel_type, price_per_litre, is_available, queue_length
 */
export async function submitReport(req, res) {
  const { station_id, fuel_type, price_per_litre, is_available, queue_length } = req.body;

  // Presence validation
  if (
    station_id === undefined ||
    !fuel_type ||
    price_per_litre === undefined ||
    is_available === undefined ||
    !queue_length
  ) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: station_id, fuel_type, price_per_litre, is_available, queue_length.',
    });
  }

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(station_id)) {
    return res.status(400).json({ success: false, message: 'Invalid station_id format.' });
  }

  // Enum validations
  if (!VALID_FUEL_TYPES.includes(fuel_type)) {
    return res.status(400).json({
      success: false,
      message: `fuel_type must be one of: ${VALID_FUEL_TYPES.join(', ')}.`,
    });
  }
  if (!VALID_QUEUE_LENGTHS.includes(queue_length)) {
    return res.status(400).json({
      success: false,
      message: `queue_length must be one of: ${VALID_QUEUE_LENGTHS.join(', ')}.`,
    });
  }
  if (typeof price_per_litre !== 'number' || price_per_litre < 0) {
    return res.status(400).json({
      success: false,
      message: 'price_per_litre must be a non-negative number.',
    });
  }

  // Verify the station actually exists
  try {
    const station = await StationModel.findById(station_id);
    if (!station) {
      return res.status(404).json({ success: false, message: `Station with id ${station_id} not found.` });
    }
  } catch (err) {
    console.error('Error verifying station:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify station.' });
  }

  try {
    const newReport = await ReportModel.create({
      station_id,
      fuel_type,
      price_per_litre,
      is_available,
      queue_length,
    });
    res.status(201).json({ success: true, data: newReport });
  } catch (err) {
    console.error('Error submitting report:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
}

/**
 * PATCH /api/reports/:id/upvote
 * Upvote a report to verify / endorse its accuracy.
 */
export async function upvoteReport(req, res) {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID format.' });
    }
    const updated = await ReportModel.incrementUpvotes(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error upvoting report:', err.message);
    res.status(500).json({ success: false, message: 'Failed to upvote report.' });
  }
}
