import mongoose from 'mongoose';

/**
 * Station Schema
 * Location is stored as GeoJSON Point for geospatial queries.
 * We also keep separate `latitude` and `longitude` fields for frontend map compatibility.
 */
const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Station address is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    // GeoJSON Point for MongoDB geospatial queries ($near, $geoWithin)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order
        default: [0, 0],
      },
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// 2DSphere index for geospatial queries
stationSchema.index({ location: '2dsphere' });

// Auto-populate GeoJSON location from latitude/longitude before save
stationSchema.pre('save', function (next) {
  this.location = {
    type: 'Point',
    coordinates: [this.longitude, this.latitude],
  };
  next();
});

const Station = mongoose.model('Station', stationSchema);

// ─── Model functions (same interface as old SQLite model) ──────────────────────

/**
 * Fetch all stations with their most recent report and computed status.
 */
export async function findAllWithLatestReport() {
  const stations = await Station.find().sort({ created_at: 1 }).lean();

  const Report = (await import('./reportModel.js')).default;
  const now = Date.now();

  const stationsWithReports = await Promise.all(
    stations.map(async (station) => {
      const latestReport = await Report.findOne({ station_id: station._id })
        .sort({ created_at: -1 })
        .lean();

      const reportAge = latestReport
        ? (now - new Date(latestReport.created_at).getTime()) / (1000 * 60)
        : Infinity;

      let status = 'grey';
      if (latestReport && reportAge <= 720) {
        if (!latestReport.is_available) {
          status = 'red';
        } else if (reportAge <= 120 && (latestReport.queue_length === 'Moderate' || latestReport.queue_length === 'Long')) {
          status = 'yellow';
        } else if (reportAge <= 120) {
          status = 'green';
        }
      }

      return {
        id: station._id,
        name: station.name,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
        brand: station.brand,
        created_at: station.created_at,
        status,
        latest_report: latestReport
          ? {
              id: latestReport._id,
              fuel_type: latestReport.fuel_type,
              price_per_litre: latestReport.price_per_litre,
              is_available: latestReport.is_available,
              queue_length: latestReport.queue_length,
              upvotes: latestReport.upvotes,
              created_at: latestReport.created_at,
              minutes_ago: Math.round(reportAge),
            }
          : null,
      };
    })
  );

  return stationsWithReports;
}

/**
 * Fetch a single station by its ID with all historical reports.
 */
export async function findById(id) {
  const station = await Station.findById(id).lean();
  if (!station) return null;

  const Report = (await import('./reportModel.js')).default;
  const reports = await Report.find({ station_id: id }).sort({ created_at: -1 }).lean();

  return { ...station, id: station._id, reports };
}

/**
 * Insert a new station.
 */
export async function create({ name, address, latitude, longitude, brand }) {
  const station = await Station.create({ name, address, latitude, longitude, brand });
  return {
    id: station._id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    brand: station.brand,
    created_at: station.created_at,
  };
}

export default Station;
