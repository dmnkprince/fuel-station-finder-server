import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { initDB } from '../config/db.js';

const MANAGER_EMAIL = 'manager@fuelfinder.ng';
const MANAGER_PASSWORD = 'Manager@123';
const MANAGER_NAME = 'Station Manager';

async function seedManager() {
  try {
    await initDB();
    console.log('Database initialized.');

    let managerId;
    // Check if manager already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [MANAGER_EMAIL]);
    if (existing.rows.length > 0) {
      console.log(`Manager already exists: ${MANAGER_EMAIL}`);
      managerId = existing.rows[0].id;
    } else {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(MANAGER_PASSWORD, salt);

      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'station_manager')
         RETURNING id, name, email, role, created_at`,
        [MANAGER_NAME, MANAGER_EMAIL, password_hash]
      );
      managerId = result.rows[0].id;
      console.log('\n✅ Default Station Manager created successfully!');
    }

    // Now assign this manager to ALL existing stations in the database in a single query
    console.log('Assigning manager to all existing stations via bulk insert...');
    const assignResult = await pool.query(
      `INSERT INTO station_managers (station_id, user_id)
       SELECT id, $1::uuid FROM stations
       ON CONFLICT (station_id, user_id) DO NOTHING`,
      [managerId]
    );

    console.log(`✅ Assigned manager to stations (Bulk execution). Rows affected: ${assignResult.rowCount}`);
    console.log('\n--- Default Station Manager Credentials ---');
    console.log(`Email:    ${MANAGER_EMAIL}`);
    console.log(`Password: ${MANAGER_PASSWORD}`);
    console.log(`Role:     station_manager`);
    console.log(`User ID:  ${managerId}`);
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seedManager();
