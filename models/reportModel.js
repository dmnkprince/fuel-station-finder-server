import mongoose from 'mongoose';

/**
 * Report Schema
 * Crowdsourced price and availability report for a fuel station.
 */
const reportSchema = new mongoose.Schema(
  {
    station_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      required: [true, 'station_id is required'],
    },
    fuel_type: {
      type: String,
      enum: {
        values: ['PMS', 'AGO', 'DPK', 'LPG'],
        message: 'fuel_type must be one of: PMS, AGO, DPK, LPG',
      },
      required: [true, 'fuel_type is required'],
    },
    price_per_litre: {
      type: Number,
      required: [true, 'price_per_litre is required'],
      min: [0, 'price_per_litre must be a non-negative number'],
    },
    is_available: {
      type: Boolean,
      required: [true, 'is_available is required'],
    },
    queue_length: {
      type: String,
      enum: {
        values: ['None', 'Short', 'Moderate', 'Long'],
        message: 'queue_length must be one of: None, Short, Moderate, Long',
      },
      required: [true, 'queue_length is required'],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index for fast lookup of reports by station
reportSchema.index({ station_id: 1, created_at: -1 });

const Report = mongoose.model('Report', reportSchema);

// ─── Model functions (same interface as old SQLite model) ──────────────────────

/**
 * Fetch all reports for a specific station.
 */
export async function findByStationId(stationId) {
  return Report.find({ station_id: stationId }).sort({ created_at: -1 }).lean();
}

/**
 * Insert a new report.
 */
export async function create({ station_id, fuel_type, price_per_litre, is_available, queue_length }) {
  const report = await Report.create({
    station_id,
    fuel_type,
    price_per_litre,
    is_available,
    queue_length,
  });
  return {
    id: report._id,
    station_id: report.station_id,
    fuel_type: report.fuel_type,
    price_per_litre: report.price_per_litre,
    is_available: report.is_available,
    queue_length: report.queue_length,
    upvotes: report.upvotes,
    created_at: report.created_at,
  };
}

/**
 * Increment the upvote count on a report by 1.
 */
export async function incrementUpvotes(reportId) {
  const updated = await Report.findByIdAndUpdate(
    reportId,
    { $inc: { upvotes: 1 } },
    { new: true }
  ).lean();
  if (!updated) return null;
  return {
    id: updated._id,
    station_id: updated.station_id,
    fuel_type: updated.fuel_type,
    price_per_litre: updated.price_per_litre,
    is_available: updated.is_available,
    queue_length: updated.queue_length,
    upvotes: updated.upvotes,
    created_at: updated.created_at,
  };
}

export default Report;
