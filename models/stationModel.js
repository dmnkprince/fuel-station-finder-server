import pool from '../config/db.js';

/**
 * Station PostgreSQL Model
 */

/**
 * Fetch all stations with their most recent report and computed status.
 */
export async function findAllWithLatestReport() {
  const stationsResult = await pool.query(
    'SELECT id, name, address, latitude, longitude, brand, created_at FROM stations ORDER BY created_at ASC'
  );

  const stations = stationsResult.rows;
  const now = Date.now();

  const stationsWithReports = await Promise.all(
    stations.map(async (station) => {
      const reportResult = await pool.query(
        'SELECT id, fuel_type, price_per_litre, is_available, queue_length, upvotes, created_at FROM reports WHERE station_id = $1 ORDER BY created_at DESC LIMIT 1',
        [station.id]
      );

      const latestReportRow = reportResult.rows[0] || null;

      let latestReport = null;
      let status = 'grey';

      if (latestReportRow) {
        const reportAge = (now - new Date(latestReportRow.created_at).getTime()) / (1000 * 60);

        if (reportAge <= 720) { // 12 hours window
          if (!latestReportRow.is_available) {
            status = 'red';
          } else if (reportAge <= 120 && (latestReportRow.queue_length === 'Moderate' || latestReportRow.queue_length === 'Long')) {
            status = 'yellow';
          } else if (reportAge <= 120) {
            status = 'green';
          }
        }

        latestReport = {
          id: latestReportRow.id,
          fuel_type: latestReportRow.fuel_type,
          price_per_litre: parseFloat(latestReportRow.price_per_litre),
          is_available: latestReportRow.is_available,
          queue_length: latestReportRow.queue_length,
          upvotes: parseInt(latestReportRow.upvotes, 10),
          created_at: latestReportRow.created_at,
          minutes_ago: Math.round(reportAge),
        };
      }

      return {
        id: station.id,
        name: station.name,
        address: station.address,
        latitude: parseFloat(station.latitude),
        longitude: parseFloat(station.longitude),
        brand: station.brand,
        created_at: station.created_at,
        status,
        latest_report: latestReport,
      };
    })
  );

  return stationsWithReports;
}

/**
 * Fetch a single station by its ID with all historical reports.
 */
export async function findById(id) {
  const stationResult = await pool.query(
    'SELECT id, name, address, latitude, longitude, brand, created_at FROM stations WHERE id = $1',
    [id]
  );

  if (stationResult.rows.length === 0) return null;
  const station = stationResult.rows[0];

  const reportsResult = await pool.query(
    'SELECT id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, created_at FROM reports WHERE station_id = $1 ORDER BY created_at DESC',
    [id]
  );

  const reports = reportsResult.rows.map((r) => ({
    ...r,
    price_per_litre: parseFloat(r.price_per_litre),
    upvotes: parseInt(r.upvotes, 10),
  }));

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: parseFloat(station.latitude),
    longitude: parseFloat(station.longitude),
    brand: station.brand,
    created_at: station.created_at,
    reports,
  };
}

/**
 * Insert a new station.
 */
export async function create({ name, address, latitude, longitude, brand }) {
  const result = await pool.query(
    `INSERT INTO stations (name, address, latitude, longitude, brand)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, latitude, longitude, brand, created_at`,
    [name, address, latitude, longitude, brand]
  );

  const station = result.rows[0];
  return {
    id: station.id,
    name: station.name,
    address: station.address,
    latitude: parseFloat(station.latitude),
    longitude: parseFloat(station.longitude),
    brand: station.brand,
    created_at: station.created_at,
  };
}

export default {
  findAllWithLatestReport,
  findById,
  create,
};
