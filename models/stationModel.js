import pool from '../config/db.js';

/**
 * Station PostgreSQL Model
 */

/**
 * Fetch all stations with their most recent report and computed status.
 * Uses a single SQL query with ROW_NUMBER() to eliminate N+1.
 */
export async function findAllWithLatestReport() {
  const result = await pool.query(`
    WITH ranked_reports AS (
      SELECT
        r.id AS report_id,
        r.station_id,
        r.fuel_type,
        r.price_per_litre,
        r.is_available,
        r.queue_length,
        r.upvotes,
        r.is_official,
        r.author_role,
        r.created_at AS report_created_at,
        ROW_NUMBER() OVER (PARTITION BY r.station_id ORDER BY r.created_at DESC) AS rn
      FROM reports r
    )
    SELECT
      s.id, s.name, s.address, s.latitude, s.longitude, s.brand, s.created_at,
      rr.report_id, rr.fuel_type, rr.price_per_litre, rr.is_available,
      rr.queue_length, rr.upvotes, rr.is_official, rr.author_role, rr.report_created_at
    FROM stations s
    LEFT JOIN ranked_reports rr ON rr.station_id = s.id AND rr.rn = 1
    ORDER BY s.created_at ASC
  `);

  const now = Date.now();

  return result.rows.map((row) => {
    let latestReport = null;
    let status = 'red';

    if (row.report_id) {
      const reportAge = (now - new Date(row.report_created_at).getTime()) / (1000 * 60);

      if (!row.is_available) {
        status = 'red';
      } else if (row.queue_length === 'Moderate' || row.queue_length === 'Long') {
        status = 'yellow';
      } else {
        status = 'green';
      }

      latestReport = {
        id: row.report_id,
        fuel_type: row.fuel_type,
        price_per_litre: parseFloat(row.price_per_litre),
        is_available: row.is_available,
        queue_length: row.queue_length,
        upvotes: parseInt(row.upvotes, 10),
        is_official: row.is_official ?? false,
        author_role: row.author_role ?? 'user',
        created_at: row.report_created_at,
        minutes_ago: Math.round(reportAge),
      };
    }

    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      brand: row.brand,
      created_at: row.created_at,
      status,
      latest_report: latestReport,
    };
  });
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
    'SELECT id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, is_official, author_role, downvotes, created_at FROM reports WHERE station_id = $1 ORDER BY created_at DESC',
    [id]
  );

  const reports = reportsResult.rows.map((r) => ({
    ...r,
    price_per_litre: parseFloat(r.price_per_litre),
    upvotes: parseInt(r.upvotes, 10),
    downvotes: parseInt(r.downvotes || 0, 10),
    is_official: r.is_official ?? false,
    author_role: r.author_role ?? 'user',
  }));

  // Compute status from latest report
  let status = 'red';
  if (reports.length > 0) {
    const latest = reports[0];
    if (!latest.is_available) status = 'red';
    else if (latest.queue_length === 'Moderate' || latest.queue_length === 'Long') status = 'yellow';
    else status = 'green';
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

/**
 * Assign a manager to a station (legacy single-manager column).
 */
export async function assignManager(stationId, userId) {
  const result = await pool.query(
    'UPDATE stations SET managed_by_id = $1 WHERE id = $2 RETURNING id, name, managed_by_id',
    [userId, stationId]
  );
  return result.rows[0] || null;
}

/**
 * Add a manager to a station (junction table — many-to-many).
 */
export async function addManager(stationId, userId) {
  const result = await pool.query(
    `INSERT INTO station_managers (station_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (station_id, user_id) DO NOTHING
     RETURNING id, station_id, user_id, assigned_at`,
    [stationId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Remove a manager from a station.
 */
export async function removeManager(stationId, userId) {
  const result = await pool.query(
    'DELETE FROM station_managers WHERE station_id = $1 AND user_id = $2 RETURNING id',
    [stationId, userId]
  );
  return result.rowCount > 0;
}

/**
 * Get all managers assigned to a station.
 */
export async function getManagersByStation(stationId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, sm.assigned_at
     FROM station_managers sm
     JOIN users u ON u.id = sm.user_id
     WHERE sm.station_id = $1
     ORDER BY sm.assigned_at DESC`,
    [stationId]
  );
  return result.rows;
}

/**
 * Get all stations assigned to a manager.
 */
export async function getStationsByManager(userId) {
  const result = await pool.query(
    `SELECT s.id, s.name, s.address, s.brand, sm.assigned_at
     FROM station_managers sm
     JOIN stations s ON s.id = sm.station_id
     WHERE sm.user_id = $1
     ORDER BY sm.assigned_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Check if a user is a manager of a specific station.
 */
export async function isManagerOfStation(userId, stationId) {
  const result = await pool.query(
    'SELECT 1 FROM station_managers WHERE user_id = $1 AND station_id = $2',
    [userId, stationId]
  );
  return result.rows.length > 0;
}

/**
 * Update a station.
 */
export async function update(id, { name, address, latitude, longitude, brand }) {
  const result = await pool.query(
    `UPDATE stations
     SET name = $1, address = $2, latitude = $3, longitude = $4, brand = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING id, name, address, latitude, longitude, brand, created_at`,
    [name, address, parseFloat(latitude), parseFloat(longitude), brand, id]
  );
  return result.rows[0] || null;
}

/**
 * Delete a station.
 */
export async function remove(id) {
  const result = await pool.query('DELETE FROM stations WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

export default {
  findAllWithLatestReport,
  findById,
  create,
  assignManager,
  addManager,
  removeManager,
  getManagersByStation,
  getStationsByManager,
  isManagerOfStation,
  update,
  remove,
};

