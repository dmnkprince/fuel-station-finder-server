import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows DNS resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback silently
}

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Configure SSL for cloud hosts like Supabase / Render, disable for local connections
const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);

export const initDB = async () => {
  if (!connectionString) {
    console.warn('DATABASE_URL is not defined in .env file. Database connection skipped.');
    return;
  }

  try {
    const client = await pool.connect();
    console.log('PostgreSQL database connected successfully.');

    // Attempt to enable extensions if supported
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (e) {
      // Ignore if unprivileged or already available
    }

    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('PostGIS extension initialized.');
    } catch (e) {
      // PostGIS optional fallback
    }

    // Create stations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        brand VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        fuel_type VARCHAR(10) NOT NULL CHECK (fuel_type IN ('PMS', 'AGO', 'DPK', 'LPG')),
        price_per_litre NUMERIC(10, 2) NOT NULL CHECK (price_per_litre >= 0),
        is_available BOOLEAN NOT NULL,
        queue_length VARCHAR(20) NOT NULL CHECK (queue_length IN ('None', 'Short', 'Moderate', 'Long')),
        upvotes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create performance indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_station_created 
      ON reports (station_id, created_at DESC);
    `);

    client.release();
    console.log('PostgreSQL database schema verified.');
  } catch (err) {
    console.error('PostgreSQL DB connection/init error:', err.message);
  }
};

export default pool;
