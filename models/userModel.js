import pool from '../config/db.js';

export async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, role, station_id, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function findById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, station_id, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function create({ name, email, password_hash, role, station_id }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, station_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, station_id, created_at`,
    [name, email, password_hash, role || 'user', station_id || null]
  );
  return result.rows[0];
}

export async function updateStationId(userId, stationId) {
  const result = await pool.query(
    'UPDATE users SET station_id = $1 WHERE id = $2 RETURNING id, name, email, role, station_id, created_at',
    [stationId, userId]
  );
  return result.rows[0] || null;
}

export async function findAllManagers() {
  const result = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE role = 'station_manager' ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function update(id, { name, email, password_hash }) {
  let query = 'UPDATE users SET name = $1, email = $2';
  const params = [name, email, id];
  if (password_hash) {
    query += ', password_hash = $4';
    params.push(password_hash);
  }
  query += ' WHERE id = $3 RETURNING id, name, email, role, created_at';
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

export default { findByEmail, findById, create, updateStationId, findAllManagers, update };

