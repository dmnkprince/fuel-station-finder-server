import pool from '../config/db.js';

/**
 * Report PostgreSQL Model
 */

/**
 * Fetch all reports for a specific station.
 */
export async function findByStationId(stationId) {
  const result = await pool.query(
    'SELECT id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, downvotes, is_official, author_role, created_at FROM reports WHERE station_id = $1 ORDER BY created_at DESC',
    [stationId]
  );
  return result.rows.map((r) => ({
    ...r,
    price_per_litre: parseFloat(r.price_per_litre),
    upvotes: parseInt(r.upvotes, 10),
    downvotes: parseInt(r.downvotes || 0, 10),
    is_official: r.is_official ?? false,
    author_role: r.author_role ?? 'user',
  }));
}

/**
 * Insert a new report.
 */
export async function create({ station_id, fuel_type, price_per_litre, is_available, queue_length, is_official, author_role }) {
  const result = await pool.query(
    `INSERT INTO reports (station_id, fuel_type, price_per_litre, is_available, queue_length, is_official, author_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, downvotes, is_official, author_role, created_at`,
    [station_id, fuel_type, price_per_litre, is_available, queue_length, is_official || false, author_role || 'user']
  );

  const report = result.rows[0];
  return {
    id: report.id,
    station_id: report.station_id,
    fuel_type: report.fuel_type,
    price_per_litre: parseFloat(report.price_per_litre),
    is_available: report.is_available,
    queue_length: report.queue_length,
    upvotes: parseInt(report.upvotes, 10),
    downvotes: parseInt(report.downvotes || 0, 10),
    is_official: report.is_official,
    author_role: report.author_role,
    created_at: report.created_at,
  };
}

/**
 * Increment the upvote count on a report by 1.
 */
export async function incrementUpvotes(reportId) {
  const result = await pool.query(
    `UPDATE reports 
     SET upvotes = upvotes + 1 
     WHERE id = $1 
     RETURNING id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, downvotes, is_official, author_role, created_at`,
    [reportId]
  );

  if (result.rows.length === 0) return null;

  const updated = result.rows[0];
  return {
    id: updated.id,
    station_id: updated.station_id,
    fuel_type: updated.fuel_type,
    price_per_litre: parseFloat(updated.price_per_litre),
    is_available: updated.is_available,
    queue_length: updated.queue_length,
    upvotes: parseInt(updated.upvotes, 10),
    downvotes: parseInt(updated.downvotes || 0, 10),
    is_official: updated.is_official,
    author_role: updated.author_role,
    created_at: updated.created_at,
  };
}

/**
 * Increment the downvote count on a report by 1.
 */
export async function incrementDownvotes(reportId) {
  const result = await pool.query(
    `UPDATE reports 
     SET downvotes = downvotes + 1 
     WHERE id = $1 
     RETURNING id, station_id, fuel_type, price_per_litre, is_available, queue_length, upvotes, downvotes, is_official, author_role, created_at`,
    [reportId]
  );

  if (result.rows.length === 0) return null;

  const updated = result.rows[0];
  return {
    id: updated.id,
    station_id: updated.station_id,
    fuel_type: updated.fuel_type,
    price_per_litre: parseFloat(updated.price_per_litre),
    is_available: updated.is_available,
    queue_length: updated.queue_length,
    upvotes: parseInt(updated.upvotes, 10),
    downvotes: parseInt(updated.downvotes || 0, 10),
    is_official: updated.is_official,
    author_role: updated.author_role,
    created_at: updated.created_at,
  };
}

export default {
  findByStationId,
  create,
  incrementUpvotes,
  incrementDownvotes,
};
